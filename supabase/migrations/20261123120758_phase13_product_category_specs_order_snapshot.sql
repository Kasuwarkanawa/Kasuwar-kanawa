-- Preserve product sample choices and category-specific specifications in immutable order snapshots.
CREATE OR REPLACE FUNCTION public.edge_checkout_order(p_buyer_id text, p_items jsonb, p_payment_method "PaymentMethod", p_shipping_address jsonb)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_buyer "User"%rowtype;
  v_seller "User"%rowtype;
  v_product "Product"%rowtype;
  v_line record;
  v_item jsonb;
  v_order_id text := gen_random_uuid()::text;
  v_order_number text;
  v_subtotal numeric(12,2) := 0;
  v_delivery_fee numeric(12,2);
  v_logistics_company_id text;
  v_logistics_company_name text;
  v_status "OrderStatus";
  v_now timestamptz := now();
  v_date_label text := to_char(v_now at time zone 'Africa/Lagos','DD Mon YYYY, HH12:MI AM');
  v_payment jsonb;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 50 then
    raise exception 'Order must contain between 1 and 50 items' using errcode='22023';
  end if;
  if jsonb_typeof(p_shipping_address) <> 'object' then
    raise exception 'Shipping address is required' using errcode='22023';
  end if;

  select * into v_buyer from public."User" where id=p_buyer_id and role='BUYER' and status='ACTIVE';
  if not found then raise exception 'Active buyer account required' using errcode='42501'; end if;

  for v_line in
    select value->>'productId' as product_id, sum((value->>'quantity')::integer)::integer as quantity
    from jsonb_array_elements(p_items)
    group by value->>'productId'
  loop
    if v_line.product_id is null or v_line.quantity < 1 or v_line.quantity > 5000 then
      raise exception 'Invalid product quantity' using errcode='22023';
    end if;
    select * into v_product from public."Product"
      where id=v_line.product_id and "approvalStatus"='APPROVED'
      for update;
    if not found then raise exception 'A product is no longer available' using errcode='P0001'; end if;
    if v_product."stockQuantity" < v_line.quantity then
      raise exception 'Requested quantity is no longer available in stock' using errcode='P0001';
    end if;
    if v_seller.id is null then
      select * into v_seller from public."User" where id=v_product."sellerId" and role='SELLER';
    elsif v_seller.id <> v_product."sellerId" then
      raise exception 'Please place separate orders for products from different sellers' using errcode='22023';
    end if;
  end loop;

  if v_seller.id is null then raise exception 'Seller account not found' using errcode='P0001'; end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    select * into v_product from public."Product" where id=v_item->>'productId';
    v_subtotal := v_subtotal + (v_product.price * (v_item->>'quantity')::integer);
  end loop;

  select q.logistics_company_id, q.logistics_company_name, q.delivery_fee
    into v_logistics_company_id, v_logistics_company_name, v_delivery_fee
  from public.edge_resolve_delivery_quote(
    p_shipping_address->>'state',
    p_shipping_address->>'city',
    v_subtotal
  ) q;

  if v_logistics_company_id is null then
    raise exception 'Delivery is not available for the selected state and city. Please choose a supported delivery location.' using errcode='22023';
  end if;

  v_order_number := 'KN-' || to_char(v_now at time zone 'Africa/Lagos','YYMMDDHH24MISS') || '-' || upper(substr(md5(random()::text),1,8));
  v_status := case when p_payment_method='opay' then 'pending_payment'::"OrderStatus" else 'pending_order'::"OrderStatus" end;
  v_payment := jsonb_build_object(
    'method',p_payment_method,
    'bankName',case when p_payment_method='opay' then 'OPay' else 'Cash on Delivery' end,
    'accountName',case when p_payment_method='opay' then 'RAMATU SAIDU' else 'Cash on Delivery' end,
    'accountNumber',case when p_payment_method='opay' then '7066300079' else '' end,
    'confirmedByBuyer',false,'verifiedByAdmin',false
  );

  insert into public."Order" (
    id,"orderNumber","buyerId","sellerId","buyerName","buyerEmail","buyerPhone",
    "sellerName","sellerBusinessName","sellerPhone","sellerWhatsApp",
    subtotal,"deliveryFee","totalAmount","shippingAddress","paymentMethod",status,"paymentConfirmation",
    "logisticsCompanyId","logisticsCompanyName","createdAt","updatedAt"
  ) values (
    v_order_id,v_order_number,v_buyer.id,v_seller.id,v_buyer."fullName",v_buyer.email,v_buyer.phone,
    v_seller."fullName",coalesce(v_seller."businessName",''),v_seller.phone,coalesce(v_seller."whatsAppNumber",v_seller.phone),
    v_subtotal,v_delivery_fee,v_subtotal+v_delivery_fee,p_shipping_address,p_payment_method,v_status,v_payment,
    v_logistics_company_id,v_logistics_company_name,v_now,v_now
  );

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    select * into v_product from public."Product" where id=v_item->>'productId';
    update public."Product" set "stockQuantity"="stockQuantity"-(v_item->>'quantity')::integer,"updatedAt"=v_now
      where id=v_product.id and "stockQuantity">=(v_item->>'quantity')::integer;
    if not found then raise exception 'Requested quantity is no longer available in stock' using errcode='P0001'; end if;
    insert into public."OrderItem" (
      id,"orderId","productId","productSnapshot",quantity,"selectedColor","selectedSize","selectedVariation","unitPrice"
    ) values (
      gen_random_uuid()::text,v_order_id,v_product.id,
      jsonb_build_object('id',v_product.id,'name',v_product.name,'category',v_product.category,'image',v_product.image,
        'images',v_product.images,'colors',v_product.colors,'sizes',v_product.sizes,'variations',v_product.variations,'description',v_product.description,'price',v_product.price,'sellerId',v_product."sellerId",
        'sellerName',v_seller."fullName",'sellerBusinessName',v_seller."businessName"),
      (v_item->>'quantity')::integer,v_item->>'selectedColor',v_item->>'selectedSize',v_item->>'selectedVariation',v_product.price
    );
  end loop;

  insert into public."OrderTrackingStep" (id,"orderId",title,"dateLabel",completed,description,"sortOrder","createdAt") values
    (gen_random_uuid()::text,v_order_id,'Order Placed',v_date_label,true,'Order '||v_order_number||' placed.',0,v_now),
    (gen_random_uuid()::text,v_order_id,case when p_payment_method='opay' then 'Payment Pending' else 'Order Pending' end,v_date_label,false,
      case when p_payment_method='opay' then 'Submit transfer details for Super Admin verification.' else 'Awaiting seller acceptance.' end,1,v_now),
    (gen_random_uuid()::text,v_order_id,'Processing','',false,'Seller will prepare your order.',2,v_now),
    (gen_random_uuid()::text,v_order_id,'Dispatched','',false,'Order will be handed to dispatch.',3,v_now),
    (gen_random_uuid()::text,v_order_id,'Delivered','',false,'Order will be delivered to your address.',4,v_now);

  return v_order_id;
end;
$function$

