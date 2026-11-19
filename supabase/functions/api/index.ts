import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import bcrypt from "npm:bcryptjs@3.0.2";
import { z } from "npm:zod@3.25.76";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FRONTEND_ORIGIN = Deno.env.get("FRONTEND_ORIGIN") ?? "https://kasuwarkanawa.github.io";
const COOKIE_NAME = "kk_session";
const SESSION_DAYS = 14;
const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const allowedOrigins = new Set([FRONTEND_ORIGIN, ...(Deno.env.get("EXTRA_ALLOWED_ORIGINS") ?? "").split(",").map(x => x.trim()).filter(Boolean)]);

const headersFor = (origin: string | null) => ({
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": origin && allowedOrigins.has(origin) ? origin : FRONTEND_ORIGIN,
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  "Vary": "Origin",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
});
function reply(data: unknown, status = 200, origin: string | null = null, extra: Record<string,string> = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...headersFor(origin), ...extra } });
}
function fail(message: string, status = 400): never {
  throw Object.assign(new Error(message), { status });
}
function cookieValue(req: Request, name: string) {
  const raw = req.headers.get("cookie") ?? "";
  for (const part of raw.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
  return null;
}
async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}
function sessionCookie(token: string, maxAge = SESSION_DAYS * 86400) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${maxAge}`;
}
function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`;
}
async function bodyJson(req: Request) {
  try { return await req.json(); } catch { return fail("A valid JSON request body is required.", 400); }
}
function safeUser(user: Record<string, any>) {
  const { passwordHash: _secret, role, status, ...safe } = user;
  return { ...safe, status: String(status).toLowerCase(), accountType: role === "BUYER" ? "buyer" : role === "SELLER" ? "seller" : "admin" };
}
async function currentUser(req: Request) {
  const token = cookieValue(req, COOKIE_NAME);
  if (!token || token.length < 32 || token.length > 128) return null;
  const tokenHash = await sha256(token);
  const { data: session, error } = await db.from("Session").select("id,userId,expiresAt").eq("tokenHash", tokenHash).maybeSingle();
  if (error || !session || new Date(session.expiresAt).getTime() <= Date.now()) {
    if (session?.id) await db.from("Session").delete().eq("id", session.id);
    return null;
  }
  const { data: user } = await db.from("User").select("*").eq("id", session.userId).maybeSingle();
  if (!user || user.status !== "ACTIVE") {
    await db.from("Session").delete().eq("id", session.id);
    return null;
  }
  return { user, sessionId: session.id };
}
async function requireRole(req: Request, roles: string[]) {
  const auth = await currentUser(req);
  if (!auth) fail("Authentication required.", 401);
  if (!roles.includes(auth.user.role)) fail("You do not have permission to access this resource.", 403);
  return auth;
}
async function issueSession(userId: string) {
  const token = [...crypto.getRandomValues(new Uint8Array(48))].map(x => x.toString(16).padStart(2, "0")).join("");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  const { error } = await db.from("Session").insert({ id: crypto.randomUUID(), userId, tokenHash: await sha256(token), expiresAt });
  if (error) throw error;
  return token;
}
const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(120), businessName: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().min(7).max(24), whatsAppNumber: z.string().trim().min(7).max(24).optional(),
  email: z.string().trim().email().max(254), password: z.string().min(10).max(128),
  address: z.string().trim().max(300).optional(), businessAddress: z.string().trim().max(300).optional(),
  city: z.string().trim().max(100).optional(), state: z.string().trim().max(100).optional(), area: z.string().trim().max(100).optional(),
  productCategory: z.string().trim().max(120).optional(), accountType: z.enum(["buyer","seller"]), profileImage: z.string().url().max(1000).optional(),
}).strict();
const loginSchema = z.object({ identifier: z.string().trim().min(1).max(254), password: z.string().min(1).max(128) }).strict();


async function getOrder(orderId:string) {
  const {data,error}=await db.from("Order").select("*,items:OrderItem(*),trackingTimeline:OrderTrackingStep(*)").eq("id",orderId).maybeSingle();
  if(error) throw error; return data;
}
function serializeOrder(order:any) {
  const timeline=[...(order.trackingTimeline??[])].sort((a,b)=>a.sortOrder-b.sortOrder);
  return {...order,subtotal:Number(order.subtotal),deliveryFee:Number(order.deliveryFee),totalAmount:Number(order.totalAmount),
    items:(order.items??[]).map((item:any)=>({id:item.id,quantity:item.quantity,selectedColor:item.selectedColor,selectedSize:item.selectedSize,selectedVariation:item.selectedVariation,product:{...(item.productSnapshot??{}),price:Number(item.unitPrice)}})),
    trackingTimeline:timeline.map((step:any)=>({title:step.title,date:step.dateLabel,completed:step.completed,description:step.description}))};
}
function orderForBuyer(order:any) {
  const result=serializeOrder(order); delete result.sellerPhone; delete result.sellerWhatsApp;
  if(result.paymentConfirmation && typeof result.paymentConfirmation==="object") delete result.paymentConfirmation.receiptPath;
  return result;
}
function orderForSeller(order:any) {
  const result=serializeOrder(order), payment=order.paymentConfirmation??{};
  const approved=order.paymentMethod==="opay" ? order.status==="payment_confirmed" && payment.verifiedByAdmin===true : payment.adminApproved===true;
  delete result.sellerPhone; delete result.sellerWhatsApp;
  if(!approved){delete result.buyerName;delete result.buyerEmail;delete result.buyerPhone;delete result.shippingAddress;}
  if(result.paymentConfirmation && typeof result.paymentConfirmation==="object") delete result.paymentConfirmation.receiptPath;
  return result;
}

function serializeProduct(product: any, seller?: any, reviews: any[] = []) {
  const ratings = reviews.map(r => Number(r.rating)).filter(Number.isFinite);
  const { price, originalPrice, stockQuantity, approvalStatus, ...rest } = product;
  return {
    ...rest, price: Number(price), originalPrice: Number(originalPrice), stockQuantity,
    stockLeft: stockQuantity, inStock: stockQuantity > 0, isApproved: approvalStatus === "APPROVED",
    approvalStatus: approvalStatus === "APPROVED" ? "approved" : approvalStatus === "REJECTED" ? "rejected" : "pending_approval",
    rating: ratings.length ? Number((ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(1)) : 0,
    reviewsCount: ratings.length,
    ...(seller ? { sellerId: seller.id, sellerName: seller.fullName, sellerBusinessName: seller.businessName } : {}),
  };
}
async function withProductDetails(products: any[]) {
  if (!products.length) return [];
  const sellerIds = [...new Set(products.map(p => p.sellerId))];
  const productIds = products.map(p => p.id);
  const [{ data: sellers }, { data: reviews }] = await Promise.all([
    db.from("User").select("id,fullName,businessName").in("id", sellerIds),
    db.from("ProductReview").select("productId,rating").in("productId", productIds),
  ]);
  return products.map(p => serializeProduct(p, sellers?.find(s => s.id === p.sellerId), (reviews ?? []).filter(r => r.productId === p.id)));
}
async function dispatch(req: Request, origin: string | null) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/functions\/v1\/api/, "").replace(/^\/api/, "") || "/";
  const method = req.method.toUpperCase();

  if (method === "GET" && path === "/health") {
    const { error } = await db.from("Category").select("id", { head: true, count: "exact" });
    return error ? reply({status:"error",database:"unavailable"},503,origin) : reply({status:"ok",database:"connected",runtime:"supabase-edge"},200,origin);
  }

  if (path === "/auth/register" && method === "POST") {
    const data = registerSchema.parse(await bodyJson(req));
    const role = data.accountType === "seller" ? "SELLER" : "BUYER";
    if (role === "SELLER" && (!data.businessName || !data.productCategory)) fail("Seller registration requires a business name and product category.",400);
    const email = data.email.trim().toLowerCase();
    const phone = data.phone.replace(/[\s()-]/g,"");
    const [{ data: byEmail }, { data: byPhone }] = await Promise.all([
      db.from("User").select("id").eq("email",email).maybeSingle(),
      db.from("User").select("id").eq("phone",phone).maybeSingle(),
    ]);
    if (byEmail || byPhone) fail("An account with this email or phone already exists.",409);
    const now = new Date().toISOString();
    const userRow = {
      id: crypto.randomUUID(), fullName: data.fullName, businessName: role === "SELLER" ? data.businessName : null,
      phone, whatsAppNumber: data.whatsAppNumber ? data.whatsAppNumber.replace(/[\s()-]/g,"") : phone,
      email, passwordHash: await bcrypt.hash(data.password,12), address: data.address || data.businessAddress || "",
      businessAddress: role === "SELLER" ? (data.businessAddress || data.address || null) : null,
      city: data.city || "Kano City", state: data.state || "Kano State", area: data.area || "Kano Municipal",
      productCategory: role === "SELLER" ? data.productCategory : null, role,
      status: role === "BUYER" ? "ACTIVE" : "PENDING", profileImage: data.profileImage ?? null, createdAt: now, updatedAt: now,
    };
    const { data: user, error } = await db.from("User").insert(userRow).select("*").single();
    if (error) throw error;
    if (role === "BUYER") {
      const token = await issueSession(user.id);
      return reply({success:true,user:safeUser(user)},201,origin,{"Set-Cookie":sessionCookie(token)});
    }
    return reply({success:true,user:safeUser(user),message:"Seller account awaits administrator approval."},201,origin);
  }

  if (path === "/auth/login" || path === "/auth/buyer/login" || path === "/auth/seller/login" || path === "/auth/admin/login") {
    if (method !== "POST") fail("Method not allowed.",405);
    const {identifier,password} = loginSchema.parse(await bodyJson(req));
    const clean = identifier.includes("@") ? identifier.trim().toLowerCase() : identifier.replace(/[\s()-]/g,"");
    const {data:user} = await db.from("User").select("*").or(`email.eq.${clean},phone.eq.${clean}`).limit(1).maybeSingle();
    const dummy = "$2a$12$C6UzMDM.H6dfI/f/IKcEe.5JYKoM2e9sX.YXxTzFNtNrdL7vG4S5e";
    const matches = await bcrypt.compare(password,user?.passwordHash ?? dummy).catch(()=>false);
    const requiredRole = path.includes("/admin/") ? "SUPER_ADMIN" : path.includes("/seller/") ? "SELLER" : path.includes("/buyer/") ? "BUYER" : null;
    if (!user || (requiredRole && user.role !== requiredRole) || !matches) fail("Invalid credentials.",401);
    if (user.status !== "ACTIVE") fail(user.status === "PENDING" ? "Account approval is pending." : `Account is ${String(user.status).toLowerCase()}.`,403);
    const token = await issueSession(user.id);
    return reply({success:true,user:safeUser(user)},200,origin,{"Set-Cookie":sessionCookie(token)});
  }

  if (path === "/auth/me" && method === "GET") {
    const auth = await currentUser(req);
    return auth ? reply({user:safeUser(auth.user)},200,origin) : reply({error:"Authentication required."},401,origin);
  }
  if (path === "/auth/logout" && method === "POST") {
    const token = cookieValue(req,COOKIE_NAME);
    if (token) await db.from("Session").delete().eq("tokenHash",await sha256(token));
    return reply({success:true},200,origin,{"Set-Cookie":clearSessionCookie()});
  }

  if (method === "GET" && path === "/products") {
    const take = Math.min(100,Math.max(1,Number(url.searchParams.get("take") ?? 50)));
    const skip = Math.max(0,Number(url.searchParams.get("skip") ?? 0));
    let query = db.from("Product").select("*").eq("approvalStatus","APPROVED").order("createdAt",{ascending:false}).range(skip,skip+take-1);
    const category = url.searchParams.get("category"), search = url.searchParams.get("search"), sellerId = url.searchParams.get("sellerId");
    if (category) query = query.eq("category",category);
    if (sellerId) query = query.eq("sellerId",sellerId);
    if (search) query = query.or(`name.ilike.%${search.replace(/[%_,]/g," ")}%,description.ilike.%${search.replace(/[%_,]/g," ")}%,category.ilike.%${search.replace(/[%_,]/g," ")}%`);
    const {data,error} = await query;
    if (error) throw error;
    return reply(await withProductDetails(data ?? []),200,origin);
  }
  if (method === "GET" && path === "/categories") {
    const [{data:categories,error},{data:products}] = await Promise.all([
      db.from("Category").select("*").order("name"),
      db.from("Product").select("categoryId").eq("approvalStatus","APPROVED"),
    ]);
    if (error) throw error;
    return reply((categories ?? []).map(c=>({...c,_count:{products:(products ?? []).filter(p=>p.categoryId===c.id).length}})),200,origin);
  }
  const productMatch = path.match(/^\/products\/([^/]+)$/);
  if (method === "GET" && productMatch) {
    const {data,error} = await db.from("Product").select("*").eq("id",decodeURIComponent(productMatch[1])).eq("approvalStatus","APPROVED").maybeSingle();
    if (error) throw error;
    if (!data) fail("Product not found.",404);
    return reply((await withProductDetails([data]))[0],200,origin);
  }
  const reviewsMatch = path.match(/^\/products\/([^/]+)\/reviews$/);
  if (reviewsMatch && method === "GET") {
    const productId = decodeURIComponent(reviewsMatch[1]);
    const {data:product} = await db.from("Product").select("id").eq("id",productId).eq("approvalStatus","APPROVED").maybeSingle();
    if (!product) fail("Product not found.",404);
    const take = Math.min(100,Math.max(1,Number(url.searchParams.get("take") ?? 50))), skip = Math.max(0,Number(url.searchParams.get("skip") ?? 0));
    const {data,error} = await db.from("ProductReview").select("*,buyer:User!ProductReview_buyerId_fkey(fullName)").eq("productId",productId).order("createdAt",{ascending:false}).range(skip,skip+take-1);
    if (error) throw error;
    return reply(data ?? [],200,origin);
  }
  if (reviewsMatch && method === "POST") {
    const auth = await requireRole(req,["BUYER"]);
    const data = z.object({rating:z.number().int().min(1).max(5),comment:z.string().trim().min(1).max(2000)}).strict().parse(await bodyJson(req));
    const productId = decodeURIComponent(reviewsMatch[1]);
    const {data:product} = await db.from("Product").select("id").eq("id",productId).eq("approvalStatus","APPROVED").maybeSingle();
    if (!product) fail("Product not found.",404);
    const {data:purchase} = await db.from("OrderItem").select("id,order:Order!OrderItem_orderId_fkey!inner(id)").eq("productId",productId).eq("order.buyerId",auth.user.id).eq("order.status","delivered").maybeSingle();
    if (!purchase) fail("A completed purchase is required to review this product.",403);
    const {data,error} = await db.from("ProductReview").insert({id:crypto.randomUUID(),productId,buyerId:auth.user.id,...data}).select("*,buyer:User!ProductReview_buyerId_fkey(fullName)").single();
    if (error) throw error;
    return reply(data,201,origin);
  }
  const reportMatch = path.match(/^\/products\/([^/]+)\/reports$/);
  if (reportMatch && method === "POST") {
    const auth = await requireRole(req,["BUYER"]);
    const data = z.object({reason:z.string().trim().min(2).max(200),details:z.string().trim().min(2).max(2000)}).strict().parse(await bodyJson(req));
    const productId = decodeURIComponent(reportMatch[1]);
    const {data:product} = await db.from("Product").select("id").eq("id",productId).eq("approvalStatus","APPROVED").maybeSingle();
    if (!product) fail("Product not found.",404);
    const {data:report,error} = await db.from("ProductReport").insert({id:crypto.randomUUID(),productId,reporterId:auth.user.id,...data}).select("*").single();
    if (error) throw error;
    return reply(report,201,origin);
  }

  if (method === "GET" && path === "/content/announcements") {
    const {data,error}=await db.from("Announcement").select("*").eq("isPublished",true).order("createdAt",{ascending:false});
    if(error) throw error; return reply(data ?? [],200,origin);
  }
  if (method === "GET" && path === "/content/advertisements") {
    const {data,error}=await db.from("Advertisement").select("*").eq("isActive",true).order("createdAt",{ascending:false});
    if(error) throw error; return reply(data ?? [],200,origin);
  }
  if (method === "GET" && path === "/content/flash-sales") {
    const now = new Date().toISOString();
    const {data,error}=await db.from("FlashSale").select("*,products:FlashSaleProduct(productId)").eq("isActive",true).lte("startTime",now).gt("endTime",now).order("createdAt",{ascending:false}).limit(20);
    if(error) throw error;
    return reply((data ?? []).map(s=>({id:s.id,title:s.title,description:s.description || undefined,discountPercentage:s.discountPercentage,startTime:s.startTime,endTime:s.endTime,productIds:(s.products ?? []).map((p:any)=>p.productId),isActive:s.isActive,createdAt:s.createdAt})),200,origin);
  }
  if (method === "POST" && path === "/content/newsletter") {
    const {email}=z.object({email:z.string().trim().email().max(254)}).parse(await bodyJson(req));
    const clean=email.toLowerCase();
    const {data,error}=await db.from("NewsletterSubscription").upsert({id:crypto.randomUUID(),email:clean},{onConflict:"email",ignoreDuplicates:true}).select("id").maybeSingle();
    if(error) throw error;
    if(data) return reply({success:true,id:data.id},201,origin);
    const {data:existing,error:readError}=await db.from("NewsletterSubscription").select("id").eq("email",clean).single();
    if(readError) throw readError; return reply({success:true,id:existing.id},201,origin);
  }


  // Buyer and seller profile APIs.
  if (path === "/buyer/profile" && method === "GET") {
    const auth=await requireRole(req,["BUYER"]); return reply({user:safeUser(auth.user)},200,origin);
  }
  if (path === "/seller/profile" && method === "GET") {
    const auth=await requireRole(req,["SELLER"]); return reply({user:safeUser(auth.user)},200,origin);
  }
  if ((path === "/buyer/profile" || path === "/seller/profile") && method === "PATCH") {
    const role=path.startsWith("/buyer") ? "BUYER" : "SELLER";
    const auth=await requireRole(req,[role]);
    const allowed=role==="BUYER" ? ["fullName","phone","address","city","state","area","profileImage"] : ["fullName","businessName","whatsAppNumber","address","businessAddress","city","state","area","productCategory","profileImage"];
    const input=await bodyJson(req); const update:any={};
    for(const key of allowed) if(Object.prototype.hasOwnProperty.call(input,key)) update[key]=input[key];
    if(!Object.keys(update).length) fail("At least one profile field is required.",400);
    if(update.phone) update.phone=String(update.phone).replace(/[\\s()-]/g,"");
    if(update.whatsAppNumber) update.whatsAppNumber=String(update.whatsAppNumber).replace(/[\\s()-]/g,"");
    update.updatedAt=new Date().toISOString();
    const {data,error}=await db.from("User").update(update).eq("id",auth.user.id).select("*").single();
    if(error) throw error; return reply({user:safeUser(data)},200,origin);
  }

  // Seller catalog management. Every changed product returns to Admin approval.
  if(path==="/seller/products" && method==="GET") {
    const auth=await requireRole(req,["SELLER"]);
    const {data,error}=await db.from("Product").select("*").eq("sellerId",auth.user.id).order("createdAt",{ascending:false});
    if(error) throw error; return reply(await withProductDetails(data ?? []),200,origin);
  }
  const sellerProductMatch=path.match(/^\\/seller\\/products\\/([^/]+)$/);
  if(path==="/seller/products" && method==="POST") {
    const auth=await requireRole(req,["SELLER"]);
    const s=z.object({
      name:z.string().trim().min(2).max(180),category:z.string().trim().min(1).max(120),price:z.number().positive(),
      originalPrice:z.number().nonnegative().optional(),discountPercentage:z.number().int().min(0).max(100).optional(),
      image:z.string().trim().min(1).max(1000),images:z.array(z.string().max(1000)).max(20).optional(),
      colors:z.array(z.string().max(80)).max(50).optional(),sizes:z.array(z.string().max(80)).max(50).optional(),
      variations:z.array(z.object({name:z.string().trim().min(1).max(120),options:z.array(z.string().trim().min(1).max(120)).max(50)}).strict()).max(100).optional(),
      badge:z.string().max(80).nullable().optional(),stockQuantity:z.number().int().min(0).max(100000).default(0),
      isFlashSale:z.boolean().optional(),isPopular:z.boolean().optional(),isNew:z.boolean().optional(),isSpecialOffer:z.boolean().optional(),description:z.string().max(10000).optional(),
    }).strict().parse(await bodyJson(req));
    const now=new Date().toISOString();
    const row={id:crypto.randomUUID(),...s,originalPrice:s.originalPrice??0,discountPercentage:s.discountPercentage??0,images:s.images??[],colors:s.colors??[],sizes:s.sizes??[],variations:s.variations??[],isFlashSale:s.isFlashSale??false,isPopular:s.isPopular??false,isNew:s.isNew??false,isSpecialOffer:s.isSpecialOffer??false,description:s.description??"",sellerId:auth.user.id,approvalStatus:"PENDING_APPROVAL",createdAt:now,updatedAt:now};
    const {data,error}=await db.from("Product").insert(row).select("*").single(); if(error) throw error;
    return reply(serializeProduct(data),201,origin);
  }
  if(sellerProductMatch && method==="PATCH") {
    const auth=await requireRole(req,["SELLER"]); const id=decodeURIComponent(sellerProductMatch[1]);
    const input=await bodyJson(req); const allowed=["name","category","price","originalPrice","discountPercentage","image","images","colors","sizes","variations","badge","stockQuantity","isFlashSale","isPopular","isNew","isSpecialOffer","description"];
    const update:any={}; for(const k of allowed) if(Object.prototype.hasOwnProperty.call(input,k)) update[k]=input[k];
    if(!Object.keys(update).length) fail("At least one product field is required.",400);
    const {data:existing}=await db.from("Product").select("id").eq("id",id).eq("sellerId",auth.user.id).maybeSingle();
    if(!existing) fail("Product not found.",404);
    update.approvalStatus="PENDING_APPROVAL"; update.updatedAt=new Date().toISOString();
    const {data,error}=await db.from("Product").update(update).eq("id",id).select("*").single(); if(error) throw error;
    return reply(serializeProduct(data),200,origin);
  }
  if(sellerProductMatch && method==="DELETE") {
    const auth=await requireRole(req,["SELLER"]); const id=decodeURIComponent(sellerProductMatch[1]);
    const {data,error}=await db.from("Product").delete().eq("id",id).eq("sellerId",auth.user.id).select("id").maybeSingle();
    if(error) throw error; if(!data) fail("Product not found.",404); return reply({success:true},200,origin);
  }

  // Buyer and seller dispute reports.
  if(path==="/buyer/reports/sellers" && method==="POST") {
    const auth=await requireRole(req,["BUYER"]);
    const b=z.object({sellerId:z.string().min(1),orderId:z.string().min(1).optional(),reason:z.string().trim().min(2).max(200),details:z.string().trim().min(2).max(2000)}).strict().parse(await bodyJson(req));
    const {data:seller}=await db.from("User").select("id").eq("id",b.sellerId).eq("role","SELLER").maybeSingle();
    if(!seller) fail("Seller not found.",404);
    let order:any=null;
    if(b.orderId){const result=await db.from("Order").select("id,orderNumber").eq("id",b.orderId).eq("buyerId",auth.user.id).eq("sellerId",seller.id).maybeSingle(); order=result.data; if(!order) fail("Matching order not found.",404);}
    const {data,error}=await db.from("SellerReport").insert({id:crypto.randomUUID(),buyerId:auth.user.id,sellerId:seller.id,orderId:order?.id??null,orderNumber:order?.orderNumber??null,reason:b.reason,details:b.details}).select("*").single();
    if(error) throw error; return reply(data,201,origin);
  }
  if(path==="/buyer/reports/sellers" && method==="GET") {
    const auth=await requireRole(req,["BUYER"]); const {data,error}=await db.from("SellerReport").select("*").eq("buyerId",auth.user.id).order("createdAt",{ascending:false});
    if(error) throw error; return reply(data??[],200,origin);
  }
  if(path==="/seller/reports/buyers" && method==="POST") {
    const auth=await requireRole(req,["SELLER"]);
    const b=z.object({buyerId:z.string().min(1),orderId:z.string().min(1),reason:z.string().trim().min(2).max(200),details:z.string().trim().min(2).max(2000)}).strict().parse(await bodyJson(req));
    const {data:order}=await db.from("Order").select("id,orderNumber,status,paymentMethod,paymentConfirmation").eq("id",b.orderId).eq("sellerId",auth.user.id).eq("buyerId",b.buyerId).maybeSingle();
    if(!order) fail("Matching seller order not found.",404);
    const payment=order.paymentConfirmation??{};
    const approved=order.paymentMethod==="opay" ? payment.verifiedByAdmin===true : payment.adminApproved===true;
    if(!approved || ["rejected","cancelled"].includes(order.status)) fail("A buyer report can only be filed against an Admin-approved order.",403);
    const {data,error}=await db.from("BuyerReport").insert({id:crypto.randomUUID(),sellerId:auth.user.id,buyerId:b.buyerId,orderId:order.id,orderNumber:order.orderNumber,reason:b.reason,details:b.details}).select("*,buyer:User!BuyerReport_buyerId_fkey(id,fullName,phone)").single();
    if(error) throw error; return reply(data,201,origin);
  }
  if(path==="/seller/reports/buyers" && method==="GET") {
    const auth=await requireRole(req,["SELLER"]); const {data,error}=await db.from("BuyerReport").select("*,buyer:User!BuyerReport_buyerId_fkey(id,fullName,phone)").eq("sellerId",auth.user.id).order("createdAt",{ascending:false});
    if(error) throw error; return reply(data??[],200,origin);
  }

  // Super Admin dashboard, account moderation, product approvals, and reports.
  if(path==="/admin/dashboard" && method==="GET") {
    await requireRole(req,["SUPER_ADMIN"]);
    const count=async(table:string,filters:(q:any)=>any= q=>q)=>{const r=await filters(db.from(table).select("id",{count:"exact",head:true}));if(r.error)throw r.error;return r.count??0;};
    const [buyers,sellers,pendingSellers,products,pendingProducts,orders,pr,br,sr]=await Promise.all([
      count("User",q=>q.eq("role","BUYER")),count("User",q=>q.eq("role","SELLER")),count("User",q=>q.eq("role","SELLER").eq("status","PENDING")),
      count("Product"),count("Product",q=>q.eq("approvalStatus","PENDING_APPROVAL")),count("Order"),
      count("ProductReport",q=>q.eq("status","pending")),count("BuyerReport",q=>q.eq("status","pending")),count("SellerReport",q=>q.eq("status","pending")),
    ]);
    return reply({buyers,sellers,pendingSellers,products,pendingProducts,orders,pendingReports:pr+br+sr},200,origin);
  }
  if(path==="/admin/users" && method==="GET") {
    await requireRole(req,["SUPER_ADMIN"]); const take=Math.min(100,Math.max(1,Number(url.searchParams.get("take")??50))),skip=Math.max(0,Number(url.searchParams.get("skip")??0));
    let q=db.from("User").select("*").order("createdAt",{ascending:false}).range(skip,skip+take-1);
    const role=url.searchParams.get("role"),status=url.searchParams.get("status"); if(role)q=q.eq("role",role);if(status)q=q.eq("status",status);
    const {data,error}=await q;if(error)throw error;return reply((data??[]).map(safeUser),200,origin);
  }
  const adminUserMatch=path.match(/^\\/admin\\/users\\/([^/]+)\\/status$/);
  if(adminUserMatch && method==="PATCH") {
    await requireRole(req,["SUPER_ADMIN"]);const id=decodeURIComponent(adminUserMatch[1]);
    const {status}=z.object({status:z.enum(["ACTIVE","SUSPENDED","REJECTED"])}).strict().parse(await bodyJson(req));
    const {data:target}=await db.from("User").select("id,role").eq("id",id).maybeSingle();if(!target)fail("User not found.",404);if(target.role==="SUPER_ADMIN")fail("Super Admin status cannot be changed through this endpoint.",403);
    const {data,error}=await db.from("User").update({status,updatedAt:new Date().toISOString()}).eq("id",id).select("*").single();if(error)throw error;
    if(status!=="ACTIVE")await db.from("Session").delete().eq("userId",id);
    return reply({user:safeUser(data)},200,origin);
  }
  if(path==="/admin/products/pending" && method==="GET") {
    await requireRole(req,["SUPER_ADMIN"]);const take=Math.min(100,Math.max(1,Number(url.searchParams.get("take")??50))),skip=Math.max(0,Number(url.searchParams.get("skip")??0));
    const {data,error}=await db.from("Product").select("*").eq("approvalStatus","PENDING_APPROVAL").order("createdAt",{ascending:true}).range(skip,skip+take-1);
    if(error)throw error;return reply(await withProductDetails(data??[]),200,origin);
  }
  const approvalMatch=path.match(/^\\/admin\\/products\\/([^/]+)\\/approval$/);
  if(approvalMatch && method==="PATCH") {
    await requireRole(req,["SUPER_ADMIN"]);const id=decodeURIComponent(approvalMatch[1]);const {status}=z.object({status:z.enum(["APPROVED","REJECTED"])}).strict().parse(await bodyJson(req));
    const {data,error}=await db.from("Product").update({approvalStatus:status,updatedAt:new Date().toISOString()}).eq("id",id).select("*").single();
    if(error)throw error;return reply(serializeProduct(data),200,origin);
  }
  if(path==="/admin/reports" && method==="GET") {
    await requireRole(req,["SUPER_ADMIN"]);const take=Math.min(100,Math.max(1,Number(url.searchParams.get("take")??50))),skip=Math.max(0,Number(url.searchParams.get("skip")??0)),status=url.searchParams.get("status");
    const load=async(table:string,select:string)=>{let q=db.from(table).select(select).order("createdAt",{ascending:false}).range(skip,skip+take-1);if(status)q=q.eq("status",status);const r=await q;if(r.error)throw r.error;return r.data??[];};
    const [products,buyers,sellers]=await Promise.all([
      load("ProductReport","*,product:Product(*),reporter:User!ProductReport_reporterId_fkey(id,fullName,phone)"),
      load("BuyerReport","*,buyer:User!BuyerReport_buyerId_fkey(id,fullName,phone),seller:User!BuyerReport_sellerId_fkey(id,fullName,businessName,phone)"),
      load("SellerReport","*,buyer:User!SellerReport_buyerId_fkey(id,fullName,phone),seller:User!SellerReport_sellerId_fkey(id,fullName,businessName,phone)"),
    ]);return reply({products,buyers,sellers},200,origin);
  }
  const reportUpdate=path.match(/^\\/admin\\/reports\\/(product|buyer|seller)\\/([^/]+)$/);
  if(reportUpdate && method==="PATCH") {
    await requireRole(req,["SUPER_ADMIN"]);const [,type,id]=reportUpdate;
    const b=z.object({status:z.enum(["pending","reviewed","resolved","approved","rejected"]),adminNotes:z.string().trim().max(2000).optional()}).strict().parse(await bodyJson(req));
    const table=type==="product"?"ProductReport":type==="buyer"?"BuyerReport":"SellerReport";
    const {data,error}=await db.from(table).update(b).eq("id",decodeURIComponent(id)).select("*").single();if(error)throw error;return reply(data,200,origin);
  }

  // Admin content-management APIs (persisted in Supabase, not browser storage).
  if(path==="/content/admin/announcements" && method==="GET") {
    await requireRole(req,["SUPER_ADMIN"]);const {data,error}=await db.from("Announcement").select("*").order("createdAt",{ascending:false});if(error)throw error;return reply(data??[],200,origin);
  }
  if(path==="/content/admin/announcements" && method==="POST") {
    await requireRole(req,["SUPER_ADMIN"]);const b=z.object({title:z.string().trim().min(1).max(200),description:z.string().trim().min(1).max(5000),type:z.string().trim().max(40).default("info"),isPublished:z.boolean().default(false)}).parse(await bodyJson(req));
    const {data,error}=await db.from("Announcement").insert({id:crypto.randomUUID(),...b}).select("*").single();if(error)throw error;return reply(data,201,origin);
  }
  const annMatch=path.match(/^\\/content\\/admin\\/announcements\\/([^/]+)$/);
  if(annMatch && method==="PATCH") {
    await requireRole(req,["SUPER_ADMIN"]);const b=z.object({title:z.string().trim().min(1).max(200).optional(),description:z.string().trim().min(1).max(5000).optional(),type:z.string().trim().max(40).optional(),isPublished:z.boolean().optional()}).strict().parse(await bodyJson(req));
    const {data,error}=await db.from("Announcement").update({...b,updatedAt:new Date().toISOString()}).eq("id",decodeURIComponent(annMatch[1])).select("*").single();if(error)throw error;return reply(data,200,origin);
  }
  if(annMatch && method==="DELETE") {await requireRole(req,["SUPER_ADMIN"]);const {error}=await db.from("Announcement").delete().eq("id",decodeURIComponent(annMatch[1]));if(error)throw error;return reply({success:true},200,origin);}
  if(path==="/content/admin/advertisements" && method==="GET") {
    await requireRole(req,["SUPER_ADMIN"]);const {data,error}=await db.from("Advertisement").select("*").order("createdAt",{ascending:false});if(error)throw error;return reply(data??[],200,origin);
  }
  if(path==="/content/admin/advertisements" && method==="POST") {
    await requireRole(req,["SUPER_ADMIN"]);const b=z.object({title:z.string().trim().min(1).max(200),description:z.string().trim().max(2000),badge:z.string().max(80).optional(),image:z.string().trim().min(1).max(1000),linkText:z.string().max(100).optional(),linkUrl:z.string().max(1000).optional(),discountTag:z.string().max(80).optional(),isActive:z.boolean().default(true)}).parse(await bodyJson(req));
    const {data,error}=await db.from("Advertisement").insert({id:crypto.randomUUID(),...b}).select("*").single();if(error)throw error;return reply(data,201,origin);
  }
  const adMatch=path.match(/^\\/content\\/admin\\/advertisements\\/([^/]+)$/);
  if(adMatch && method==="PATCH") {
    await requireRole(req,["SUPER_ADMIN"]);const b=z.object({title:z.string().trim().min(1).max(200).optional(),description:z.string().trim().max(2000).optional(),badge:z.string().max(80).nullable().optional(),image:z.string().trim().min(1).max(1000).optional(),linkText:z.string().max(100).nullable().optional(),linkUrl:z.string().max(1000).nullable().optional(),discountTag:z.string().max(80).nullable().optional(),isActive:z.boolean().optional()}).strict().parse(await bodyJson(req));
    const {data,error}=await db.from("Advertisement").update({...b,updatedAt:new Date().toISOString()}).eq("id",decodeURIComponent(adMatch[1])).select("*").single();if(error)throw error;return reply(data,200,origin);
  }
  if(adMatch && method==="DELETE") {await requireRole(req,["SUPER_ADMIN"]);const {error}=await db.from("Advertisement").delete().eq("id",decodeURIComponent(adMatch[1]));if(error)throw error;return reply({success:true},200,origin);}
  if(path==="/content/admin/newsletter" && method==="GET") {
    await requireRole(req,["SUPER_ADMIN"]);const {data,error}=await db.from("NewsletterSubscription").select("*").order("createdAt",{ascending:false}).limit(500);if(error)throw error;return reply(data??[],200,origin);
  }


  // Persistent buyer cart.
  if(path==="/cart" && method==="GET") {
    const auth=await requireRole(req,["BUYER"]);
    const {data:cart}=await db.from("Cart").select("id").eq("userId",auth.user.id).maybeSingle();
    if(!cart) return reply({items:[]},200,origin);
    const {data:items,error}=await db.from("CartItem").select("*").eq("cartId",cart.id).order("id");
    if(error)throw error;
    const products=await withProductDetails(await (async()=>{const ids=(items??[]).map(i=>i.productId);if(!ids.length)return [];const r=await db.from("Product").select("*").in("id",ids);if(r.error)throw r.error;return r.data??[];})());
    return reply({items:(items??[]).map(i=>({id:i.id,quantity:i.quantity,selectedColor:i.selectedColor,selectedSize:i.selectedSize,selectedVariation:i.selectedVariation,product:products.find(p=>p.id===i.productId)}))},200,origin);
  }
  if(path==="/cart/items" && method==="POST") {
    const auth=await requireRole(req,["BUYER"]);
    const b=z.object({productId:z.string().min(1),quantity:z.number().int().min(1).max(100),selectedColor:z.string().trim().max(120).optional(),selectedSize:z.string().trim().max(120).optional(),selectedVariation:z.string().trim().max(120).optional()}).strict().parse(await bodyJson(req));
    const {data:product}=await db.from("Product").select("id,stockQuantity").eq("id",b.productId).eq("approvalStatus","APPROVED").maybeSingle();
    if(!product)fail("Product not found or unavailable.",404);if(product.stockQuantity<b.quantity)fail("Requested quantity is not available in stock.",409);
    let {data:cart,error:cartError}=await db.from("Cart").upsert({id:crypto.randomUUID(),userId:auth.user.id,updatedAt:new Date().toISOString()},{onConflict:"userId"}).select("*").single();
    if(cartError)throw cartError;
    let q=db.from("CartItem").select("*").eq("cartId",cart.id).eq("productId",b.productId);
    q=b.selectedColor===undefined?q.is("selectedColor",null):q.eq("selectedColor",b.selectedColor);
    q=b.selectedSize===undefined?q.is("selectedSize",null):q.eq("selectedSize",b.selectedSize);
    q=b.selectedVariation===undefined?q.is("selectedVariation",null):q.eq("selectedVariation",b.selectedVariation);
    const {data:match,error}=await q.maybeSingle();if(error)throw error;
    if(match){if(match.quantity+b.quantity>product.stockQuantity)fail("Requested quantity is not available in stock.",409);const r=await db.from("CartItem").update({quantity:match.quantity+b.quantity}).eq("id",match.id);if(r.error)throw r.error;}
    else {const r=await db.from("CartItem").insert({id:crypto.randomUUID(),cartId:cart.id,productId:b.productId,quantity:b.quantity,selectedColor:b.selectedColor??null,selectedSize:b.selectedSize??null,selectedVariation:b.selectedVariation??null});if(r.error)throw r.error;}
    return reply({success:true},201,origin);
  }
  const cartItemMatch=path.match(/^\\/cart\\/items\\/([^/]+)$/);
  if(cartItemMatch && method==="PATCH") {
    const auth=await requireRole(req,["BUYER"]);const id=decodeURIComponent(cartItemMatch[1]);
    const {quantity}=z.object({quantity:z.number().int().min(1).max(100)}).strict().parse(await bodyJson(req));
    const {data:item}=await db.from("CartItem").select("*,cart:Cart!CartItem_cartId_fkey(userId),product:Product!CartItem_productId_fkey(stockQuantity,approvalStatus)").eq("id",id).maybeSingle();
    if(!item || item.cart?.userId!==auth.user.id)fail("Cart item not found.",404);
    if(item.product?.approvalStatus!=="APPROVED" || item.product.stockQuantity<quantity)fail("Product is unavailable or requested quantity exceeds stock.",409);
    const {error}=await db.from("CartItem").update({quantity}).eq("id",id);if(error)throw error;return reply({success:true},200,origin);
  }
  if(cartItemMatch && method==="DELETE") {
    const auth=await requireRole(req,["BUYER"]);const id=decodeURIComponent(cartItemMatch[1]);
    const {data:item}=await db.from("CartItem").select("id,cart:Cart!CartItem_cartId_fkey(userId)").eq("id",id).maybeSingle();
    if(!item || item.cart?.userId!==auth.user.id)fail("Cart item not found.",404);
    const {error}=await db.from("CartItem").delete().eq("id",id);if(error)throw error;return reply({success:true},200,origin);
  }
  if(path==="/cart" && method==="DELETE") {
    const auth=await requireRole(req,["BUYER"]);const {data:cart}=await db.from("Cart").select("id").eq("userId",auth.user.id).maybeSingle();
    if(cart){const {error}=await db.from("CartItem").delete().eq("cartId",cart.id);if(error)throw error;}
    return reply({items:[]},200,origin);
  }

  // Order read endpoints. Sensitive fields are filtered per role.
  if(path==="/orders/mine" && method==="GET") {
    const auth=await requireRole(req,["BUYER"]);const take=Math.min(100,Math.max(1,Number(url.searchParams.get("take")??50))),skip=Math.max(0,Number(url.searchParams.get("skip")??0));
    const {data,error}=await db.from("Order").select("*,items:OrderItem(*),trackingTimeline:OrderTrackingStep(*)").eq("buyerId",auth.user.id).order("createdAt",{ascending:false}).range(skip,skip+take-1);
    if(error)throw error;return reply((data??[]).map(orderForBuyer),200,origin);
  }
  if(path==="/orders/seller/mine" && method==="GET") {
    const auth=await requireRole(req,["SELLER"]);const take=Math.min(100,Math.max(1,Number(url.searchParams.get("take")??50))),skip=Math.max(0,Number(url.searchParams.get("skip")??0));
    const {data,error}=await db.from("Order").select("*,items:OrderItem(*),trackingTimeline:OrderTrackingStep(*)").eq("sellerId",auth.user.id).order("createdAt",{ascending:false}).range(skip,skip+take-1);
    if(error)throw error;return reply((data??[]).map(orderForSeller),200,origin);
  }
  if(path==="/orders/admin/all" && method==="GET") {
    await requireRole(req,["SUPER_ADMIN"]);const take=Math.min(100,Math.max(1,Number(url.searchParams.get("take")??50))),skip=Math.max(0,Number(url.searchParams.get("skip")??0));
    const {data,error}=await db.from("Order").select("*,items:OrderItem(*),trackingTimeline:OrderTrackingStep(*)").order("createdAt",{ascending:false}).range(skip,skip+take-1);
    if(error)throw error;return reply((data??[]).map(serializeOrder),200,origin);
  }
  const orderIdMatch=path.match(/^\\/orders\\/([^/]+)$/);
  if(orderIdMatch && method==="GET") {
    const auth=await requireRole(req,["BUYER","SELLER","SUPER_ADMIN"]);const id=decodeURIComponent(orderIdMatch[1]);
    let q=db.from("Order").select("*,items:OrderItem(*),trackingTimeline:OrderTrackingStep(*)").eq("id",id);
    if(id.startsWith("KN-"))q=db.from("Order").select("*,items:OrderItem(*),trackingTimeline:OrderTrackingStep(*)").eq("orderNumber",id);
    const {data,error}=await q.maybeSingle();if(error)throw error;
    if(!data || (auth.user.role!=="SUPER_ADMIN" && data.buyerId!==auth.user.id && data.sellerId!==auth.user.id))fail("Order not found.",404);
    return reply(auth.user.role==="BUYER"?orderForBuyer(data):auth.user.role==="SELLER"?orderForSeller(data):serializeOrder(data),200,origin);
  }

  return reply({error:"API route is not yet migrated to Supabase Edge Functions.",route:`${method} ${path}`},501,origin);
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    if (origin && !allowedOrigins.has(origin)) return new Response(null,{status:403,headers:headersFor(origin)});
    return new Response(null,{status:204,headers:headersFor(origin)});
  }
  if (origin && !allowedOrigins.has(origin)) return reply({error:"Request origin is not allowed."},403,origin);
  if (["POST","PUT","PATCH","DELETE"].includes(req.method) && origin && !allowedOrigins.has(origin)) return reply({error:"Request origin is not allowed."},403,origin);
  try { return await dispatch(req,origin); }
  catch (error) {
    const status = Number((error as any)?.status ?? ((error as any)?.code === "23505" ? 409 : 500));
    const message = status >= 500 ? "The service could not complete this request." : String((error as Error)?.message ?? "Request failed.");
    if (status >= 500) console.error("Edge API error:",error);
    return reply({error:message},status,origin);
  }
});
