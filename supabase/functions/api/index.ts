import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import bcrypt from "npm:bcryptjs@3.0.2";
import { z } from "npm:zod@3.25.76";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = (() => {
  try {
    const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
    if (typeof secretKeys.default === "string") return secretKeys.default;
  } catch { /* fall back to legacy service_role key */ }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
})();
const configuredPublishableKeys = (() => {
  const keys = new Set<string>();
  const single = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
  if (single) keys.add(single);
  try {
    const named = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}");
    for (const value of Object.values(named)) if (typeof value === "string") keys.add(value);
  } catch { /* optional legacy environment format */ }
  // Public project key only; never a service-role credential.
  keys.add("sb_publishable_Z5Dj-_1weCpFUi1aNeyigg_uaEDIuVr");
  return keys;
})();
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
async function constantTimeSecretMatch(candidate: string, expected: string) {
  const a = await sha256(candidate);
  const b = await sha256(expected);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
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
  return { ...safe, status: String(status).toLowerCase(), accountType: role === "BUYER" ? "buyer" : role === "SELLER" ? "seller" : role === "LOGISTICS" ? "logistics" : "admin" };
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
async function recordUserActivity(userId:string,eventType:string,description:string,metadata:Record<string,unknown>={}) {
  const {error}=await db.from("UserActivityLog").insert({id:crypto.randomUUID(),userId,eventType,description,metadata,createdAt:new Date().toISOString()});
  if(error) throw error;
}
async function issueSession(userId: string) {
  const token = [...crypto.getRandomValues(new Uint8Array(48))].map(x => x.toString(16).padStart(2, "0")).join("");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  const { error } = await db.from("Session").insert({ id: crypto.randomUUID(), userId, tokenHash: await sha256(token), expiresAt });
  if (error) throw error;
  await recordUserActivity(userId,"LOGIN","User signed in");
  await db.from("UserPresence").upsert({userId,lastSeenAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
  return token;
}
const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(120), businessName: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().min(7).max(24), whatsAppNumber: z.string().trim().min(7).max(24).optional(),
  email: z.string().trim().email().max(254), password: z.string().min(10).max(128),
  address: z.string().trim().max(300).optional(), businessAddress: z.string().trim().max(300).optional(),
  city: z.string().trim().max(100).optional(), state: z.string().trim().max(100).optional(), area: z.string().trim().max(100).optional(),
  productCategory: z.string().trim().max(120).optional(), accountType: z.enum(["buyer","seller","logistics"]), profileImage: z.string().url().max(1000).optional(),
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
  const approved=order.paymentMethod==="opay" ? payment.verifiedByAdmin===true : payment.adminApproved===true;
  delete result.sellerPhone; delete result.sellerWhatsApp;
  if(!approved){delete result.buyerName;delete result.buyerEmail;delete result.buyerPhone;delete result.shippingAddress;}
  if(result.paymentConfirmation && typeof result.paymentConfirmation==="object") {
    result.paymentConfirmation={
      verifiedByAdmin:payment.verifiedByAdmin===true,
      adminApproved:payment.adminApproved===true,
      verifiedAt:payment.verifiedAt??undefined,
      adminApprovedAt:payment.adminApprovedAt??undefined,
    };
  }
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
async function ensureOpayTransferPayout(orderId:string) {
  const {data:order,error:orderError}=await db.from("Order").select("id,sellerId,subtotal,paymentMethod,status,paymentConfirmation").eq("id",orderId).maybeSingle();
  if(orderError)throw orderError;
  if(!order || order.paymentMethod!=="opay" || order.status!=="delivered" || order.paymentConfirmation?.verifiedByAdmin!==true || !order.sellerId)return null;
  const subtotal=Number(order.subtotal),commission=Number((subtotal*0.05).toFixed(2)),payout=Number((subtotal-commission).toFixed(2)),now=new Date().toISOString();
  const {data,error}=await db.from("TransferPayout").upsert({id:crypto.randomUUID(),orderId:order.id,sellerId:order.sellerId,grossOrderAmount:subtotal,commissionRate:5,commissionAmount:commission,sellerPayoutAmount:payout,status:"awaiting_admin_payout",createdAt:now,updatedAt:now},{onConflict:"orderId",ignoreDuplicates:true}).select("*").maybeSingle();
  if(error)throw error;return data;
}


async function expiredSubscriptionSellerIds() {
  const {data,error}=await db.from("SellerSubscription").select("sellerId,status,createdAt").order("createdAt",{ascending:false});
  if(error) throw error;
  const latest=new Map<string,string>();
  for(const row of data??[]) if(!latest.has(row.sellerId)) latest.set(row.sellerId,row.status);
  return [...latest.entries()].filter(([,status])=>status!=="active" && status!=="grace").map(([sellerId])=>sellerId);
}
async function notifySubscriptionSeller(userId:string, type:string, title:string, message:string, dedupeKey:string, data:Record<string,unknown>={}) {
  const {error}=await db.from("UserNotification").insert({
    id:crypto.randomUUID(),userId,type,title,message,data,dedupeKey,createdAt:new Date().toISOString()
  });
  if(error && error.code!=="23505") throw error;
}
async function runSubscriptionExpiry() {
  const now=new Date().toISOString();
  const [{data:toGrace,error:graceReadError},{data:toExpire,error:expireReadError}]=await Promise.all([
    db.from("SellerSubscription").select("id,sellerId,expiresAt,plan:SellerSubscriptionPlan(graceDays)").eq("status","active").lte("expiresAt",now),
    db.from("SellerSubscription").select("id,sellerId,graceEndsAt").eq("status","grace").lte("graceEndsAt",now)
  ]);
  if(graceReadError)throw graceReadError;if(expireReadError)throw expireReadError;
  const {error}=await db.rpc("process_seller_subscription_expiry");
  if(error) throw error;
  for(const row of toGrace??[]) {
    const joinedPlan=Array.isArray(row.plan)?row.plan[0]:row.plan;
    const graceDays=Number(joinedPlan?.graceDays??7);
    await notifySubscriptionSeller(row.sellerId,"subscription_grace","Subscription grace period started",`Your subscription has expired. You have a ${graceDays}-day grace period to renew before your products are hidden.`,`subscription:${row.id}:grace`,{subscriptionId:row.id,expiresAt:row.expiresAt,graceDays});
  }
  for(const row of toExpire??[]) await notifySubscriptionSeller(row.sellerId,"subscription_expired","Subscription expired","Your grace period has ended. Your products are hidden from the public marketplace until your subscription is renewed and approved.",`subscription:${row.id}:expired`,{subscriptionId:row.id,graceEndsAt:row.graceEndsAt});
}

async function dispatch(req: Request, origin: string | null) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/functions\/v1\/api/, "").replace(/^\/api/, "") || "/";
  const method = req.method.toUpperCase();


  if (path.startsWith("/auth/") && method === "POST") {
    const ip = req.headers.get("cf-connecting-ip") ?? (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
    const bucket = "auth:" + await sha256(ip + ":" + path);
    const {data:allowed,error} = await db.rpc("edge_consume_rate_limit",{p_bucket:bucket,p_limit:30,p_window_seconds:900});
    if(error) throw error;
    if(!allowed) fail("Too many authentication attempts. Try again later.",429);
  }

  if (method === "GET" && path === "/health") {
    const { error } = await db.from("Category").select("id", { head: true, count: "exact" });
    return error ? reply({status:"error",database:"unavailable"},503,origin) : reply({status:"ok",database:"connected",runtime:"supabase-edge"},200,origin);
  }

  if (path === "/auth/bootstrap-admin" && method === "POST") {
    const configuredToken=Deno.env.get("BOOTSTRAP_ADMIN_TOKEN");
    if(!configuredToken || configuredToken.length<32) fail("First Admin setup has not been configured in Supabase Edge Function secrets.",503);
    const b=z.object({setupToken:z.string().min(32).max(256),fullName:z.string().trim().min(2).max(120),email:z.string().trim().email().max(254),phone:z.string().trim().min(7).max(24),password:z.string().min(12).max(128)}).strict().parse(await bodyJson(req));
    if(!(await constantTimeSecretMatch(b.setupToken,configuredToken))) fail("Invalid first Admin setup token.",403);
    const {data:userId,error}=await db.rpc("edge_bootstrap_first_admin",{p_full_name:b.fullName,p_email:b.email,p_phone:b.phone,p_password_hash:await bcrypt.hash(b.password,12)});
    if(error) {
      if(error.code==="P0001") fail(error.message,409);
      if(error.code==="23505") fail(error.message,409);
      throw error;
    }
    const {data:user,error:readError}=await db.from("User").select("*").eq("id",userId).single();
    if(readError) throw readError;
    const token=await issueSession(user.id);
    return reply({success:true,user:safeUser(user)},201,origin,{"Set-Cookie":sessionCookie(token)});
  }

  if (path === "/auth/register" && method === "POST") {
    const data = registerSchema.parse(await bodyJson(req));
    const role = data.accountType === "seller" ? "SELLER" : data.accountType === "logistics" ? "LOGISTICS" : "BUYER";
    if ((role === "SELLER" || role === "LOGISTICS") && !data.businessName) fail("Business or company name is required.",400);
    if (role === "SELLER" && !data.productCategory) fail("Seller registration requires a product category.",400);
    const email = data.email.trim().toLowerCase();
    const phone = data.phone.replace(/[\s()-]/g,"");
    const [{ data: byEmail }, { data: byPhone }] = await Promise.all([
      db.from("User").select("id").eq("email",email).maybeSingle(),
      db.from("User").select("id").eq("phone",phone).maybeSingle(),
    ]);
    if (byEmail || byPhone) fail("An account with this email or phone already exists.",409);
    const now = new Date().toISOString();
    const userRow = {
      id: crypto.randomUUID(), fullName: data.fullName, businessName: role === "SELLER" || role === "LOGISTICS" ? data.businessName : null,
      phone, whatsAppNumber: data.whatsAppNumber ? data.whatsAppNumber.replace(/[\s()-]/g,"") : phone,
      email, passwordHash: await bcrypt.hash(data.password,12), address: data.address || data.businessAddress || "",
      businessAddress: role === "SELLER" || role === "LOGISTICS" ? (data.businessAddress || data.address || null) : null,
      city: data.city || "Kano City", state: data.state || "Kano State", area: data.area || "Kano Municipal",
      productCategory: role === "SELLER" ? data.productCategory : null, role,
      status: role === "BUYER" ? "ACTIVE" : "PENDING", profileImage: data.profileImage ?? null, createdAt: now, updatedAt: now,
    };
    const { data: user, error } = await db.from("User").insert(userRow).select("*").single();
    if (error) throw error;
    if (role === "LOGISTICS") {
      const { error: companyError } = await db.from("LogisticsCompany").insert({
        id: crypto.randomUUID(), ownerUserId: user.id, companyName: data.businessName!,
        logo: data.profileImage ?? null, contactName: data.fullName, phone,
        whatsAppNumber: data.whatsAppNumber ? data.whatsAppNumber.replace(/[\\s()-]/g,"") : phone,
        email, address: data.businessAddress || data.address || "", city: data.city || "Kano City",
        state: data.state || "Kano State", serviceAreas: [], pricing: [], approvalStatus: "pending",
        createdAt: now, updatedAt: now,
      });
      if (companyError) {
        await db.from("User").delete().eq("id", user.id);
        if (companyError.code === "23505") fail("A logistics company with this name is already registered.",409);
        throw companyError;
      }
    }
    if (role === "BUYER") {
      const token = await issueSession(user.id);
      return reply({success:true,user:safeUser(user)},201,origin,{"Set-Cookie":sessionCookie(token)});
    }
    return reply({success:true,user:safeUser(user),message:role === "LOGISTICS" ? "Logistics company registration received. Super Admin approval is required before sign-in." : "Seller account awaits administrator approval."},201,origin);
  }

  if (path === "/auth/login" || path === "/auth/buyer/login" || path === "/auth/seller/login" || path === "/auth/logistics/login" || path === "/auth/admin/login") {
    if (method !== "POST") fail("Method not allowed.",405);
    const {identifier,password} = loginSchema.parse(await bodyJson(req));
    const clean = identifier.includes("@") ? identifier.trim().toLowerCase() : identifier.replace(/[\s()-]/g,"");
    const {data:user} = await db.from("User").select("*").or(`email.eq.${clean},phone.eq.${clean}`).limit(1).maybeSingle();
    const dummy = "$2a$12$C6UzMDM.H6dfI/f/IKcEe.5JYKoM2e9sX.YXxTzFNtNrdL7vG4S5e";
    const matches = await bcrypt.compare(password,user?.passwordHash ?? dummy).catch(()=>false);
    const requiredRole = path.includes("/admin/") ? "SUPER_ADMIN" : path.includes("/seller/") ? "SELLER" : path.includes("/logistics/") ? "LOGISTICS" : path.includes("/buyer/") ? "BUYER" : null;
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
    if (token) {
      const tokenHash=await sha256(token);
      const {data:session}=await db.from("Session").select("id,userId").eq("tokenHash",tokenHash).maybeSingle();
      if(session?.userId) await recordUserActivity(session.userId,"LOGOUT","User signed out");
      if(session?.id) await db.from("Session").delete().eq("id",session.id);
    }
    return reply({success:true},200,origin,{"Set-Cookie":clearSessionCookie()});
  }
  if (path === "/auth/heartbeat" && method === "POST") {
    const auth=await currentUser(req);
    if(!auth) fail("Authentication required.",401);
    const now=new Date().toISOString();
    const {error}=await db.from("UserPresence").upsert({userId:auth.user.id,lastSeenAt:now,updatedAt:now});
    if(error) throw error;
    return reply({success:true,lastSeenAt:now},200,origin);
  }

  if (method === "GET" && path === "/products") {
    const take = Math.min(100,Math.max(1,Number(url.searchParams.get("take") ?? 50)));
    const skip = Math.max(0,Number(url.searchParams.get("skip") ?? 0));
    await runSubscriptionExpiry();
    const blockedSellerIds=await expiredSubscriptionSellerIds();
    let query = db.from("Product").select("*").eq("approvalStatus","APPROVED").order("createdAt",{ascending:false});
    if(blockedSellerIds.length) query=query.not("sellerId","in",`(${blockedSellerIds.join(",")})`);
    query=query.range(skip,skip+take-1);
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
      db.from("Product").select("category,categoryId").eq("approvalStatus","APPROVED"),
    ]);
    if (error) throw error;
    return reply((categories ?? []).map(c=>{const itemCount=(products ?? []).filter(p=>p.categoryId===c.id || p.category===c.name).length;return {...c,itemCount,_count:{products:itemCount}};}),200,origin);
  }
  const productMatch = path.match(/^\/products\/([^/]+)$/);
  if (method === "GET" && productMatch) {
    await runSubscriptionExpiry();
    const {data,error} = await db.from("Product").select("*").eq("id",decodeURIComponent(productMatch[1])).eq("approvalStatus","APPROVED").maybeSingle();
    if (error) throw error;
    if (!data) fail("Product not found.",404);
    const blockedSellerIds=await expiredSubscriptionSellerIds();
    if(blockedSellerIds.includes(data.sellerId)) fail("Product not found.",404);
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
    return reply((data ?? []).map((review:any)=>({...review,buyerName:review.buyer?.fullName ?? "Buyer"})),200,origin);
  }
  if (reviewsMatch && method === "POST") {
    const auth = await requireRole(req,["BUYER"]);
    const reviewInput = z.object({rating:z.number().int().min(1).max(5),comment:z.string().trim().min(1).max(2000)}).strict().parse(await bodyJson(req));
    const productId = decodeURIComponent(reviewsMatch[1]);
    const {data:product} = await db.from("Product").select("id").eq("id",productId).eq("approvalStatus","APPROVED").maybeSingle();
    if (!product) fail("Product not found.",404);
    const {data:purchase} = await db.from("OrderItem").select("id,order:Order!OrderItem_orderId_fkey!inner(id)").eq("productId",productId).eq("order.buyerId",auth.user.id).eq("order.status","delivered").maybeSingle();
    if (!purchase) fail("A completed purchase is required to review this product.",403);
    const {data:review,error} = await db.from("ProductReview").insert({id:crypto.randomUUID(),productId,buyerId:auth.user.id,...reviewInput}).select("*,buyer:User!ProductReview_buyerId_fkey(fullName)").single();
    if (error) throw error;
    return reply({...review,buyerName:review.buyer?.fullName ?? "Buyer"},201,origin);
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
    if(update.phone) update.phone=String(update.phone).replace(/[\s()-]/g,"");
    if(update.whatsAppNumber) update.whatsAppNumber=String(update.whatsAppNumber).replace(/[\s()-]/g,"");
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
  const sellerProductMatch=path.match(/^\/seller\/products\/([^/]+)$/);
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
    const {data:category}=await db.from("Category").select("id").eq("name",s.category).maybeSingle();
    const row={id:crypto.randomUUID(),...s,categoryId:category?.id??null,originalPrice:s.originalPrice??0,discountPercentage:s.discountPercentage??0,images:s.images??[],colors:s.colors??[],sizes:s.sizes??[],variations:s.variations??[],isFlashSale:s.isFlashSale??false,isPopular:s.isPopular??false,isNew:true,isSpecialOffer:s.isSpecialOffer??false,description:s.description??"",sellerId:auth.user.id,approvalStatus:"PENDING_APPROVAL",createdAt:now,updatedAt:now};
    const {data,error}=await db.from("Product").insert(row).select("*").single(); if(error) throw error;
    return reply(serializeProduct(data),201,origin);
  }
  if(sellerProductMatch && method==="PATCH") {
    const auth=await requireRole(req,["SELLER"]); const id=decodeURIComponent(sellerProductMatch[1]);
    const input=await bodyJson(req); const allowed=["name","category","price","originalPrice","discountPercentage","image","images","colors","sizes","variations","badge","stockQuantity","isFlashSale","isPopular","isNew","isSpecialOffer","description"];
    const update:any={}; for(const k of allowed) if(Object.prototype.hasOwnProperty.call(input,k)) update[k]=input[k];
    if(!Object.keys(update).length) fail("At least one product field is required.",400);
    if(update.category){const {data:category}=await db.from("Category").select("id").eq("name",update.category).maybeSingle();update.categoryId=category?.id??null;}
    const {data:existing}=await db.from("Product").select("id").eq("id",id).eq("sellerId",auth.user.id).maybeSingle();
    if(!existing) fail("Product not found.",404);
    update.approvalStatus="PENDING_APPROVAL"; update.updatedAt=new Date().toISOString();
    const {data,error}=await db.from("Product").update(update).eq("id",id).select("*").single(); if(error) throw error;
    return reply(serializeProduct(data),200,origin);
  }
  if(sellerProductMatch && method==="DELETE") {
    const auth=await requireRole(req,["SELLER"]); const id=decodeURIComponent(sellerProductMatch[1]);
    const {data,error}=await db.from("Product").delete().eq("id",id).eq("sellerId",auth.user.id).select("id").maybeSingle();
    if(error) throw error; if(!data) fail("Product not found.",404); await recordUserActivity(auth.user.id,"PRODUCT_DELETED","Deleted a product",{productId:id}); return reply({success:true},200,origin);
  }

  // Buyer/Seller profile APIs. Only profile fields are writable; role, status and password stay server-controlled.
  const profilePath = path === "/buyer/profile" || path === "/seller/profile";
  if (profilePath && (method === "GET" || method === "PATCH")) {
    const expectedRole = path.startsWith("/buyer/") ? "BUYER" : "SELLER";
    const auth = await requireRole(req, [expectedRole]);
    if (method === "GET") return reply({ user: safeUser(auth.user) }, 200, origin);
    const profileSchema = z.object({
      fullName: z.string().trim().min(2).max(120).optional(),
      phone: z.string().trim().min(7).max(24).optional(),
      whatsAppNumber: z.string().trim().min(7).max(24).nullable().optional(),
      address: z.string().trim().max(300).optional(),
      businessAddress: z.string().trim().max(300).nullable().optional(),
      businessName: z.string().trim().max(120).nullable().optional(),
      city: z.string().trim().max(100).optional(),
      state: z.string().trim().max(100).optional(),
      area: z.string().trim().max(100).optional(),
      productCategory: z.string().trim().max(120).nullable().optional(),
      profileImage: z.string().url().max(1000).nullable().optional(),
    }).strict();
    const patch = profileSchema.parse(await bodyJson(req));
    if (Object.keys(patch).length === 0) fail("Provide at least one profile field to update.", 400);
    const update: Record<string, unknown> = { ...patch, updatedAt: new Date().toISOString() };
    if (typeof update.phone === "string") update.phone = update.phone.replace(/[\\s()-]/g, "");
    if (typeof update.whatsAppNumber === "string") update.whatsAppNumber = update.whatsAppNumber.replace(/[\\s()-]/g, "");
    if (expectedRole === "BUYER") {
      delete update.businessName; delete update.businessAddress; delete update.productCategory;
    }
    if (expectedRole === "SELLER") {
      if (update.businessName === null || update.businessName === "") fail("Business name cannot be empty.", 400);
    }
    const { data, error } = await db.from("User").update(update).eq("id", auth.user.id).select("*").single();
    if (error) {
      if (error.code === "23505") fail("That phone number is already registered.", 409);
      throw error;
    }
    return reply({ user: safeUser(data) }, 200, origin);
  }

  // Public storefront content is read-only and exposes only active/published records.
  if (path === "/content/advertisements" && method === "GET") {
    const { data, error } = await db.from("Advertisement").select("*").eq("isActive", true).order("createdAt", { ascending: false });
    if (error) throw error;
    return reply(data ?? [], 200, origin);
  }
  if (path === "/content/flash-sales" && method === "GET") {
    const now = new Date().toISOString();
    const { data, error } = await db.from("FlashSale").select("*,products:FlashSaleProduct(productId)").eq("isActive", true).lte("startTime", now).gt("endTime", now).order("endTime", { ascending: true });
    if (error) throw error;
    return reply((data ?? []).map((sale: any) => ({
      id: sale.id, title: sale.title, description: sale.description ?? undefined,
      bannerImage: sale.bannerImage ?? undefined, discountPercentage: sale.discountPercentage,
      startTime: sale.startTime, endTime: sale.endTime,
      productIds: (sale.products ?? []).map((item: any) => item.productId),
      isActive: sale.isActive, createdAt: sale.createdAt,
    })), 200, origin);
  }
  if (path === "/content/announcements" && method === "GET") {
    const { data, error } = await db.from("Announcement").select("*").eq("isPublished", true).order("createdAt", { ascending: false }).limit(50);
    if (error) throw error;
    return reply(data ?? [], 200, origin);
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


  // Phase 10: seller subscriptions, admin approvals, and in-app notifications.
  if(path==="/seller/subscription" && method==="GET") {
    const auth=await requireRole(req,["SELLER"]);
    await runSubscriptionExpiry();
    const [{data:plans,error:planError},{data:rows,error:subError},{data:notifications,error:notificationError},{data:paymentAccount,error:paymentAccountError}]=await Promise.all([
      db.from("SellerSubscriptionPlan").select("*").eq("isActive",true).order("price",{ascending:true}),
      db.from("SellerSubscription").select("*,plan:SellerSubscriptionPlan(*)").eq("sellerId",auth.user.id).order("createdAt",{ascending:false}).limit(10),
      db.from("UserNotification").select("*").eq("userId",auth.user.id).order("createdAt",{ascending:false}).limit(30),
      db.from("MarketplacePayoutSettings").select("bankName,accountName,accountNumber").eq("id","default").maybeSingle()
    ]);
    if(planError)throw planError;if(subError)throw subError;if(notificationError)throw notificationError;if(paymentAccountError)throw paymentAccountError;
    const current=(rows??[]).find((row:any)=>["active","grace","pending_payment","pending_approval"].includes(row.status))??null;
    if(current?.status==="active" && current.expiresAt) {
      const days=Math.ceil((new Date(current.expiresAt).getTime()-Date.now())/86400000);
      for(const threshold of [7,3,1]) if(days<=threshold && days>=0) await notifySubscriptionSeller(auth.user.id,"subscription_expiry","Subscription ending soon",`WARNING: Your seller subscription expires in ${days} day(s). If you do not renew, it will enter a 7-day grace period. If payment is not approved before that grace period ends, your seller selling access will be suspended and all listings hidden from buyers. Your saved products and account data will not be deleted.`,`subscription:${current.id}:expiry:${threshold}`,{subscriptionId:current.id,expiresAt:current.expiresAt});
    }
    return reply({plans:plans??[],subscription:current,subscriptions:rows??[],notifications:notifications??[],paymentAccount:paymentAccount??null},200,origin);
  }
  if(path==="/seller/subscription" && method==="POST") {
    const auth=await requireRole(req,["SELLER"]);
    const b=z.object({planId:z.string().min(1).max(120),paymentMethod:z.enum(["bank_transfer","paystack"]),paymentReference:z.string().trim().max(160).optional()}).strict().parse(await bodyJson(req));
    const {data:plan,error:planError}=await db.from("SellerSubscriptionPlan").select("*").eq("id",b.planId).eq("isActive",true).maybeSingle();
    if(planError)throw planError;if(!plan)fail("This subscription plan is not available.",404);
    const {data:existing,error:existingError}=await db.from("SellerSubscription").select("id,status").eq("sellerId",auth.user.id).in("status",["pending_payment","pending_approval"]).limit(1).maybeSingle();
    if(existingError)throw existingError;if(existing)fail("You already have a subscription request awaiting payment or approval.",409);
    const now=new Date().toISOString();
    const {data,error}=await db.from("SellerSubscription").insert({
      id:crypto.randomUUID(),sellerId:auth.user.id,planId:plan.id,status:"pending_payment",amountPaid:plan.price,
      paymentMethod:b.paymentMethod,paymentReference:b.paymentReference??null,createdAt:now,updatedAt:now
    }).select("*,plan:SellerSubscriptionPlan(*)").single();
    if(error)throw error;
    await notifySubscriptionSeller(auth.user.id,"subscription_request","Subscription request created","Your subscription request was created. Submit payment proof and wait for Admin approval.",`subscription:${data.id}:created`,{subscriptionId:data.id});
    return reply(data,201,origin);
  }
  const sellerSubReceiptMatch=path.match(/^\/seller\/subscription\/([^/]+)\/receipt$/);
  if(sellerSubReceiptMatch && method==="POST") {
    const auth=await requireRole(req,["SELLER"]);
    const id=decodeURIComponent(sellerSubReceiptMatch[1]);
    const {data:sub,error:subError}=await db.from("SellerSubscription").select("id,sellerId,status").eq("id",id).maybeSingle();
    if(subError)throw subError;if(!sub || sub.sellerId!==auth.user.id)fail("Subscription request not found.",404);
    if(!["pending_payment","pending_approval"].includes(sub.status))fail("This subscription request no longer accepts payment proof.",409);
    const contentType=req.headers.get("content-type")??"";
    const extension=contentType.includes("png")?"png":contentType.includes("webp")?"webp":contentType.includes("pdf")?"pdf":"jpg";
    if(!["image/jpeg","image/png","image/webp","application/pdf"].includes(contentType))fail("Upload a JPG, PNG, WebP or PDF receipt.",415);
    const bytes=new Uint8Array(await req.arrayBuffer());if(bytes.length===0 || bytes.length>5*1024*1024)fail("Receipt must be between 1 byte and 5MB.",413);
    const objectPath=`subscriptions/${auth.user.id}/${id}-${crypto.randomUUID()}.${extension}`;
    const {error:uploadError}=await db.storage.from("payment-receipts").upload(objectPath,bytes,{contentType,upsert:false});
    if(uploadError)throw uploadError;
    const {data,error}=await db.from("SellerSubscription").update({paymentReceiptPath:objectPath,status:"pending_approval",updatedAt:new Date().toISOString()}).eq("id",id).select("id,status,paymentReceiptPath,updatedAt").single();
    if(error){await db.storage.from("payment-receipts").remove([objectPath]);throw error;}
    return reply(data,200,origin);
  }
  if(path==="/admin/subscriptions/plans" && method==="GET") {
    await requireRole(req,["SUPER_ADMIN"]);
    const {data,error}=await db.from("SellerSubscriptionPlan").select("*").order("createdAt",{ascending:false});
    if(error)throw error;return reply(data??[],200,origin);
  }
  if(path==="/admin/subscriptions/plans" && method==="POST") {
    await requireRole(req,["SUPER_ADMIN"]);
    const b=z.object({name:z.string().trim().min(2).max(100),description:z.string().trim().max(1000).default(""),price:z.number().nonnegative(),durationDays:z.number().int().min(1).max(3660),graceDays:z.number().int().min(0).max(30).default(7),isActive:z.boolean().default(true)}).strict().parse(await bodyJson(req));
    const now=new Date().toISOString();
    const {data,error}=await db.from("SellerSubscriptionPlan").insert({id:crypto.randomUUID(),...b,createdAt:now,updatedAt:now}).select("*").single();
    if(error)throw error;return reply(data,201,origin);
  }
  const adminPlanMatch=path.match(/^\/admin\/subscriptions\/plans\/([^/]+)$/);
  if(adminPlanMatch && method==="PATCH") {
    await requireRole(req,["SUPER_ADMIN"]);
    const b=z.object({name:z.string().trim().min(2).max(100).optional(),description:z.string().trim().max(1000).optional(),price:z.number().nonnegative().optional(),durationDays:z.number().int().min(1).max(3660).optional(),graceDays:z.number().int().min(0).max(30).optional(),isActive:z.boolean().optional()}).strict().parse(await bodyJson(req));
    const {data,error}=await db.from("SellerSubscriptionPlan").update({...b,updatedAt:new Date().toISOString()}).eq("id",decodeURIComponent(adminPlanMatch[1])).select("*").single();
    if(error)throw error;return reply(data,200,origin);
  }
  if(path==="/admin/subscriptions" && method==="GET") {
    await requireRole(req,["SUPER_ADMIN"]);await runSubscriptionExpiry();
    const {data,error}=await db.from("SellerSubscription").select("*,plan:SellerSubscriptionPlan(*),seller:User!SellerSubscription_sellerId_fkey(id,fullName,businessName,email,phone)").order("createdAt",{ascending:false}).limit(300);
    if(error)throw error;return reply(data??[],200,origin);
  }
  const adminSubReceiptMatch=path.match(/^\/admin\/subscriptions\/([^/]+)\/receipt$/);
  if(adminSubReceiptMatch && method==="GET") {
    await requireRole(req,["SUPER_ADMIN"]);
    const {data:sub,error}=await db.from("SellerSubscription").select("paymentReceiptPath").eq("id",decodeURIComponent(adminSubReceiptMatch[1])).maybeSingle();
    if(error)throw error;if(!sub)fail("Subscription request not found.",404);if(!sub.paymentReceiptPath)fail("No payment receipt has been uploaded.",404);
    const {data:signed,error:signedError}=await db.storage.from("payment-receipts").createSignedUrl(sub.paymentReceiptPath,300);
    if(signedError || !signed?.signedUrl)throw signedError??new Error("Could not create subscription receipt link.");
    return reply({url:signed.signedUrl,expiresIn:300},200,origin);
  }
  const adminSubDecisionMatch=path.match(/^\/admin\/subscriptions\/([^/]+)\/decision$/);
  if(adminSubDecisionMatch && method==="PATCH") {
    const admin=await requireRole(req,["SUPER_ADMIN"]);
    const b=z.object({decision:z.enum(["approve","reject"]),adminNotes:z.string().trim().max(1000).optional()}).strict().parse(await bodyJson(req));
    const id=decodeURIComponent(adminSubDecisionMatch[1]);
    const {data:sub,error:subError}=await db.from("SellerSubscription").select("*,plan:SellerSubscriptionPlan(*)").eq("id",id).maybeSingle();
    if(subError)throw subError;if(!sub)fail("Subscription request not found.",404);
    if(!["pending_payment","pending_approval"].includes(sub.status))fail("Only pending subscription requests can be decided.",409);
    const now=new Date(),nowIso=now.toISOString();
    if(b.decision==="approve") {
      const {error:cancelError}=await db.from("SellerSubscription").update({status:"cancelled",updatedAt:nowIso}).eq("sellerId",sub.sellerId).in("status",["active","grace"]);
      if(cancelError)throw cancelError;
      const joinedPlan=Array.isArray(sub.plan)?sub.plan[0]:sub.plan;
      if(!joinedPlan) fail("Subscription plan could not be loaded.",500);
      const expiresAt=new Date(now.getTime()+Number(joinedPlan.durationDays)*86400000).toISOString();
      const {data,error}=await db.from("SellerSubscription").update({status:"active",startsAt:nowIso,expiresAt,graceEndsAt:null,approvedBy:admin.user.id,approvedAt:nowIso,updatedAt:nowIso}).eq("id",id).select("*,plan:SellerSubscriptionPlan(*)").single();
      if(error)throw error;
      await notifySubscriptionSeller(sub.sellerId,"subscription_approved","Subscription approved","Your seller subscription is active. You can continue selling on Kasuwar Kanawa.",`subscription:${id}:approved`,{subscriptionId:id,expiresAt});
      return reply(data,200,origin);
    }
    const {data,error}=await db.from("SellerSubscription").update({status:"rejected",updatedAt:nowIso}).eq("id",id).select("*,plan:SellerSubscriptionPlan(*)").single();
    if(error)throw error;
    await notifySubscriptionSeller(sub.sellerId,"subscription_rejected","Subscription request declined",b.adminNotes||"Your subscription request was declined. Contact Admin for details.",`subscription:${id}:rejected`,{subscriptionId:id});
    return reply(data,200,origin);
  }
  if(path==="/notifications/mine" && method==="GET") {
    const auth=await requireRole(req,["BUYER","SELLER","LOGISTICS","SUPER_ADMIN"]);
    const {data,error}=await db.from("UserNotification").select("*").eq("userId",auth.user.id).order("createdAt",{ascending:false}).limit(50);
    if(error)throw error;return reply(data??[],200,origin);
  }
  const notificationReadMatch=path.match(/^\/notifications\/([^/]+)\/read$/);
  if(notificationReadMatch && method==="PATCH") {
    const auth=await requireRole(req,["BUYER","SELLER","LOGISTICS","SUPER_ADMIN"]);
    const {data,error}=await db.from("UserNotification").update({readAt:new Date().toISOString()}).eq("id",decodeURIComponent(notificationReadMatch[1])).eq("userId",auth.user.id).select("id,readAt").single();
    if(error)throw error;return reply(data,200,origin);
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
    const {data,error}=await q;if(error)throw error;
    const rows=data??[];
    const logisticsUsers=rows.filter((u:any)=>u.role==="LOGISTICS").map((u:any)=>u.id);
    let companyByOwner:Record<string,string>={};
    if(logisticsUsers.length){const companies=await db.from("LogisticsCompany").select("id,ownerUserId").in("ownerUserId",logisticsUsers);if(companies.error)throw companies.error;companyByOwner=Object.fromEntries((companies.data??[]).map((c:any)=>[c.ownerUserId,c.id]));}
    return reply(rows.map((u:any)=>({...safeUser(u),...(companyByOwner[u.id]?{logisticsCompanyId:companyByOwner[u.id]}:{})})),200,origin);
  }
  const userActivityMatch=path.match(/^\/admin\/users\/([^/]+)\/activity$/);
  if(userActivityMatch && method==="GET") {
    await requireRole(req,["SUPER_ADMIN"]);
    const userId=decodeURIComponent(userActivityMatch[1]);
    const [{data:user,error:userError},{data:presence,error:presenceError},{data:events,error:eventsError}] = await Promise.all([
      db.from("User").select("*").eq("id",userId).maybeSingle(),
      db.from("UserPresence").select("lastSeenAt").eq("userId",userId).maybeSingle(),
      db.from("UserActivityLog").select("id,eventType,description,metadata,createdAt").eq("userId",userId).order("createdAt",{ascending:false}).limit(Math.min(500,Math.max(1,Number(url.searchParams.get("take")??200))))
    ]);
    if(userError)throw userError;if(presenceError)throw presenceError;if(eventsError)throw eventsError;
    if(!user)fail("User not found.",404);
    const activityRows=events??[];
    const lastLoginAt=activityRows.find((event:any)=>event.eventType==="LOGIN")?.createdAt??null;
    const lastLogoutAt=activityRows.find((event:any)=>event.eventType==="LOGOUT")?.createdAt??null;
    return reply({user:safeUser(user),lastSeenAt:presence?.lastSeenAt??null,lastLoginAt,lastLogoutAt,activities:activityRows},200,origin);
  }
  if(path==="/admin/users" && method==="POST") {
    await requireRole(req,["SUPER_ADMIN"]);
    const b=z.object({
      fullName:z.string().trim().min(2).max(120),
      email:z.string().trim().email().max(254),
      phone:z.string().trim().min(7).max(24),
      password:z.string().min(12).max(128),
      accountType:z.enum(["buyer","seller"]),
      businessName:z.string().trim().min(2).max(120).optional(),
      productCategory:z.string().trim().min(2).max(120).optional(),
      address:z.string().trim().max(300).optional(),
      city:z.string().trim().max(100).optional(),
      state:z.string().trim().max(100).optional(),
      area:z.string().trim().max(100).optional(),
    }).strict().parse(await bodyJson(req));
    if(b.accountType==="seller" && (!b.businessName || !b.productCategory)) fail("Seller accounts require a business name and product category.",400);
    const email=b.email.toLowerCase(), phone=b.phone.replace(/[\\s()-]/g,"");
    const [{data:byEmail},{data:byPhone}]=await Promise.all([
      db.from("User").select("id").eq("email",email).maybeSingle(),
      db.from("User").select("id").eq("phone",phone).maybeSingle(),
    ]);
    if(byEmail || byPhone) fail("An account with this email or phone already exists.",409);
    const now=new Date().toISOString(), role=b.accountType==="seller"?"SELLER":"BUYER";
    const row={
      id:crypto.randomUUID(),fullName:b.fullName,email,phone,
      whatsAppNumber:phone,passwordHash:await bcrypt.hash(b.password,12),
      businessName:role==="SELLER"?b.businessName:null,
      productCategory:role==="SELLER"?b.productCategory:null,
      address:b.address??"",businessAddress:role==="SELLER"?(b.address??null):null,
      city:b.city??"Kano City",state:b.state??"Kano State",area:b.area??"Kano Municipal",
      role,status:role==="SELLER"?"PENDING":"ACTIVE",profileImage:null,
      createdAt:now,updatedAt:now,
    };
    const {data,error}=await db.from("User").insert(row).select("*").single();
    if(error){if(error.code==="23505")fail("An account with this email or phone already exists.",409);throw error;}
    await recordUserActivity(data.id,"ACCOUNT_CREATED","Account created by Super Admin",{role:data.role,createdBy:(await currentUser(req))?.user.id??null});
    return reply({user:safeUser(data)},201,origin);
  }

  const adminUserProfileMatch=path.match(/^[/]admin[/]users[/]([^/]+)$/);
  if(adminUserProfileMatch && method==="PATCH") {
    await requireRole(req,["SUPER_ADMIN"]);const id=decodeURIComponent(adminUserProfileMatch[1]);
    const b=z.object({fullName:z.string().trim().min(2).max(120).optional(),email:z.string().trim().email().max(254).optional(),phone:z.string().trim().min(7).max(24).optional(),whatsAppNumber:z.string().trim().min(7).max(24).nullable().optional(),address:z.string().trim().max(300).optional(),businessAddress:z.string().trim().max(300).nullable().optional(),businessName:z.string().trim().max(120).nullable().optional(),city:z.string().trim().max(100).optional(),state:z.string().trim().max(100).optional(),area:z.string().trim().max(100).optional(),profileImage:z.string().url().max(1000).nullable().optional()}).strict().parse(await bodyJson(req));
    const update:any={...b,updatedAt:new Date().toISOString()};if(update.email)update.email=update.email.toLowerCase();if(update.phone)update.phone=update.phone.replace(/[\s()-]/g,"");if(update.whatsAppNumber)update.whatsAppNumber=update.whatsAppNumber.replace(/[\s()-]/g,"");
    const {data,error}=await db.from("User").update(update).eq("id",id).neq("role","SUPER_ADMIN").select("*").single();if(error)throw error;await recordUserActivity(id,"PROFILE_UPDATED","Super Admin updated the user profile",{fields:Object.keys(update)});return reply({user:safeUser(data)},200,origin);
  }

  const adminUserMatch=path.match(/^\/admin\/users\/([^/]+)\/status$/);
  if(adminUserMatch && method==="PATCH") {
    await requireRole(req,["SUPER_ADMIN"]);const id=decodeURIComponent(adminUserMatch[1]);
    const {status}=z.object({status:z.enum(["ACTIVE","SUSPENDED","REJECTED"])}).strict().parse(await bodyJson(req));
    const {data:target}=await db.from("User").select("id,role").eq("id",id).maybeSingle();if(!target)fail("User not found.",404);if(target.role==="SUPER_ADMIN")fail("Super Admin status cannot be changed through this endpoint.",403);
    const {data,error}=await db.from("User").update({status,updatedAt:new Date().toISOString()}).eq("id",id).select("*").single();if(error)throw error;
    if(target.role==="LOGISTICS") {
      const companyStatus=status==="ACTIVE"?"approved":status==="REJECTED"?"rejected":"suspended";
      const {error:companyError}=await db.from("LogisticsCompany").update({
        approvalStatus:companyStatus, approvedAt:status==="ACTIVE"?new Date().toISOString():null,
        approvedBy:status==="ACTIVE"?(await currentUser(req))?.user.id:null, updatedAt:new Date().toISOString()
      }).eq("ownerUserId",id);
      if(companyError)throw companyError;
    }
    if(status!=="ACTIVE")await db.from("Session").delete().eq("userId",id);
    await recordUserActivity(id,"ACCOUNT_STATUS_CHANGED",`Account status changed to ${status}`,{status,changedBy:(await currentUser(req))?.user.id??null});
    return reply({user:safeUser(data)},200,origin);
  }
  if(path==="/admin/products/pending" && method==="GET") {
    await requireRole(req,["SUPER_ADMIN"]);const take=Math.min(100,Math.max(1,Number(url.searchParams.get("take")??50))),skip=Math.max(0,Number(url.searchParams.get("skip")??0));
    const {data,error}=await db.from("Product").select("*").eq("approvalStatus","PENDING_APPROVAL").order("createdAt",{ascending:true}).range(skip,skip+take-1);
    if(error)throw error;return reply(await withProductDetails(data??[]),200,origin);
  }

  if(path==="/admin/products" && method==="POST") {
    await requireRole(req,["SUPER_ADMIN"]);
    const b=z.object({
      name:z.string().trim().min(2).max(180),category:z.string().trim().min(1).max(120),
      price:z.number().positive(),originalPrice:z.number().nonnegative().optional(),
      discountPercentage:z.number().int().min(0).max(100).optional(),
      image:z.string().trim().url().max(1000),description:z.string().max(10000).optional(),
      stockQuantity:z.number().int().min(0).max(100000).default(0),
      sellerId:z.string().min(1),
    }).strict().parse(await bodyJson(req));
    const {data:seller,error:sellerError}=await db.from("User").select("id,role,status").eq("id",b.sellerId).maybeSingle();
    if(sellerError)throw sellerError;
    if(!seller || seller.role!=="SELLER" || seller.status!=="ACTIVE")fail("Choose an active approved seller for this product.",400);
    const {data:category}=await db.from("Category").select("id").eq("name",b.category).maybeSingle();
    const now=new Date().toISOString();
    const row={
      id:crypto.randomUUID(),name:b.name,category:b.category,categoryId:category?.id??null,
      price:b.price,originalPrice:b.originalPrice??b.price,discountPercentage:b.discountPercentage??0,
      image:b.image,images:[],colors:[],sizes:[],variations:[],badge:null,
      stockQuantity:b.stockQuantity,isFlashSale:false,isPopular:false,isNew:true,isSpecialOffer:false,
      description:b.description??"",sellerId:b.sellerId,approvalStatus:"APPROVED",createdAt:now,updatedAt:now,
    };
    const {data,error}=await db.from("Product").insert(row).select("*").single();
    if(error)throw error;
    return reply(serializeProduct(data),201,origin);
  }

  const adminProductMatch=path.match(/^[/]admin[/]products[/]([^/]+)$/);
  if(adminProductMatch && method==="PATCH") {
    await requireRole(req,["SUPER_ADMIN"]);const id=decodeURIComponent(adminProductMatch[1]);
    const b=z.object({name:z.string().trim().min(2).max(180).optional(),category:z.string().trim().min(1).max(120).optional(),price:z.number().positive().optional(),originalPrice:z.number().nonnegative().optional(),discountPercentage:z.number().int().min(0).max(100).optional(),image:z.string().trim().min(1).max(1000).optional(),description:z.string().max(10000).optional(),stockQuantity:z.number().int().min(0).max(100000).optional(),isFlashSale:z.boolean().optional(),isPopular:z.boolean().optional(),isNew:z.boolean().optional(),isSpecialOffer:z.boolean().optional()}).strict().parse(await bodyJson(req));
    const update:any={...b,updatedAt:new Date().toISOString()};if(update.category){const {data:category}=await db.from("Category").select("id").eq("name",update.category).maybeSingle();update.categoryId=category?.id??null;}
    const {data,error}=await db.from("Product").update(update).eq("id",id).select("*").single();if(error)throw error;return reply(serializeProduct(data),200,origin);
  }
  if(adminProductMatch && method==="DELETE") {
    await requireRole(req,["SUPER_ADMIN"]);const id=decodeURIComponent(adminProductMatch[1]);
    const {data,error}=await db.from("Product").update({approvalStatus:"REJECTED",updatedAt:new Date().toISOString()}).eq("id",id).select("id").single();if(error)throw error;return reply({success:true,removedId:data.id},200,origin);
  }

    const approvalMatch=path.match(/^\/admin\/products\/([^/]+)\/approval$/);
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
  const reportUpdate=path.match(/^\/admin\/reports\/(product|buyer|seller)\/([^/]+)$/);
  if(reportUpdate && method==="PATCH") {
    await requireRole(req,["SUPER_ADMIN"]);const [,type,id]=reportUpdate;
    const b=z.object({status:z.enum(["pending","reviewed","resolved","approved","rejected"]),adminNotes:z.string().trim().max(2000).optional()}).strict().parse(await bodyJson(req));
    const table=type==="product"?"ProductReport":type==="buyer"?"BuyerReport":"SellerReport";
    const {data,error}=await db.from(table).update(b).eq("id",decodeURIComponent(id)).select("*").single();if(error)throw error;return reply(data,200,origin);
  }


  if(path==="/admin/categories" && method==="GET") {
    await requireRole(req,["SUPER_ADMIN"]);
    const [{data:categories,error},{data:products,error:productError}]=await Promise.all([
      db.from("Category").select("*").order("name"),
      db.from("Product").select("category,categoryId"),
    ]);
    if(error)throw error;if(productError)throw productError;
    return reply((categories??[]).map(c=>{const itemCount=(products??[]).filter(p=>p.categoryId===c.id||p.category===c.name).length;return {...c,itemCount,_count:{products:itemCount}};}),200,origin);
  }
  if(path==="/admin/categories" && method==="POST") {
    await requireRole(req,["SUPER_ADMIN"]);const b=z.object({name:z.string().trim().min(2).max(120),hausaName:z.string().trim().max(120).optional(),description:z.string().trim().max(1000).optional(),iconName:z.string().trim().max(80).optional(),image:z.string().trim().max(1000).optional()}).strict().parse(await bodyJson(req));
    const id=crypto.randomUUID();const {data,error}=await db.from("Category").insert({id,...b,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}).select("*").single();if(error)throw error;return reply({...data,itemCount:0,_count:{products:0}},201,origin);
  }
  const categoryAdminMatch=path.match(/^\/admin\/categories\/([^/]+)$/);
  if(categoryAdminMatch && method==="PATCH") {
    await requireRole(req,["SUPER_ADMIN"]);const b=z.object({name:z.string().trim().min(2).max(120).optional(),hausaName:z.string().trim().max(120).nullable().optional(),description:z.string().trim().max(1000).nullable().optional(),iconName:z.string().trim().max(80).nullable().optional(),image:z.string().trim().max(1000).nullable().optional()}).strict().parse(await bodyJson(req));
    const {data,error}=await db.from("Category").update({...b,updatedAt:new Date().toISOString()}).eq("id",decodeURIComponent(categoryAdminMatch[1])).select("*").single();if(error)throw error;return reply(data,200,origin);
  }
  if(categoryAdminMatch && method==="DELETE") {
    await requireRole(req,["SUPER_ADMIN"]);const id=decodeURIComponent(categoryAdminMatch[1]);const {count,error}=await db.from("Product").select("id",{count:"exact",head:true}).eq("categoryId",id);if(error)throw error;if((count??0)>0)fail("This category still has products and cannot be deleted.",409);
    const {error:deleteError}=await db.from("Category").delete().eq("id",id);if(deleteError)throw deleteError;return reply({success:true},200,origin);
  }

  // Admin content-management APIs (persisted in Supabase, not browser storage).
  if(path==="/content/admin/announcements" && method==="GET") {
    await requireRole(req,["SUPER_ADMIN"]);const {data,error}=await db.from("Announcement").select("*").order("createdAt",{ascending:false});if(error)throw error;return reply(data??[],200,origin);
  }
  if(path==="/content/admin/announcements" && method==="POST") {
    await requireRole(req,["SUPER_ADMIN"]);const b=z.object({title:z.string().trim().min(1).max(200),description:z.string().trim().min(1).max(5000),type:z.string().trim().max(40).default("info"),isPublished:z.boolean().default(false)}).parse(await bodyJson(req));
    const {data,error}=await db.from("Announcement").insert({id:crypto.randomUUID(),...b,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}).select("*").single();if(error)throw error;return reply(data,201,origin);
  }
  const annMatch=path.match(/^\/content\/admin\/announcements\/([^/]+)$/);
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
    const {data,error}=await db.from("Advertisement").insert({id:crypto.randomUUID(),...b,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}).select("*").single();if(error)throw error;return reply(data,201,origin);
  }
  const adMatch=path.match(/^\/content\/admin\/advertisements\/([^/]+)$/);
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
    let {data:cart,error:cartError}=await db.from("Cart").select("id").eq("userId",auth.user.id).maybeSingle();
    if(cartError)throw cartError;
    if(!cart) {
      const created=await db.from("Cart").insert({id:crypto.randomUUID(),userId:auth.user.id,updatedAt:new Date().toISOString()}).select("id").single();
      if(created.error && created.error.code!=="23505")throw created.error;
      if(created.data)cart=created.data;
      else {
        const retry=await db.from("Cart").select("id").eq("userId",auth.user.id).single();
        if(retry.error)throw retry.error;cart=retry.data;
      }
    }
    let q=db.from("CartItem").select("*").eq("cartId",cart.id).eq("productId",b.productId);
    q=b.selectedColor===undefined?q.is("selectedColor",null):q.eq("selectedColor",b.selectedColor);
    q=b.selectedSize===undefined?q.is("selectedSize",null):q.eq("selectedSize",b.selectedSize);
    q=b.selectedVariation===undefined?q.is("selectedVariation",null):q.eq("selectedVariation",b.selectedVariation);
    const {data:match,error}=await q.maybeSingle();if(error)throw error;
    if(match){if(match.quantity+b.quantity>product.stockQuantity)fail("Requested quantity is not available in stock.",409);const r=await db.from("CartItem").update({quantity:match.quantity+b.quantity}).eq("id",match.id);if(r.error)throw r.error;}
    else {const r=await db.from("CartItem").insert({id:crypto.randomUUID(),cartId:cart.id,productId:b.productId,quantity:b.quantity,selectedColor:b.selectedColor??null,selectedSize:b.selectedSize??null,selectedVariation:b.selectedVariation??null});if(r.error)throw r.error;}
    return reply({success:true},201,origin);
  }
  const cartItemMatch=path.match(/^\/cart\/items\/([^/]+)$/);
  if(cartItemMatch && method==="PATCH") {
    const auth=await requireRole(req,["BUYER"]);const id=decodeURIComponent(cartItemMatch[1]);
    const {quantity}=z.object({quantity:z.number().int().min(1).max(100)}).strict().parse(await bodyJson(req));
    const {data:item}=await db.from("CartItem").select("*,cart:Cart!CartItem_cartId_fkey(userId),product:Product!CartItem_productId_fkey(stockQuantity,approvalStatus)").eq("id",id).maybeSingle();
    const cartRelation:any = item?.cart;
    const cartOwnerId = Array.isArray(cartRelation) ? cartRelation[0]?.userId : cartRelation?.userId;
    if(!item || cartOwnerId!==auth.user.id)fail("Cart item not found.",404);
    const productRelation:any = item.product;const cartProduct = Array.isArray(productRelation) ? productRelation[0] : productRelation;
    if(cartProduct?.approvalStatus!=="APPROVED" || cartProduct.stockQuantity<quantity)fail("Product is unavailable or requested quantity exceeds stock.",409);
    const {error}=await db.from("CartItem").update({quantity}).eq("id",id);if(error)throw error;return reply({success:true},200,origin);
  }
  if(cartItemMatch && method==="DELETE") {
    const auth=await requireRole(req,["BUYER"]);const id=decodeURIComponent(cartItemMatch[1]);
    const {data:item}=await db.from("CartItem").select("id,cart:Cart!CartItem_cartId_fkey(userId)").eq("id",id).maybeSingle();
    const cartOwnerId = item?.cart?.[0]?.userId;
    if(!item || cartOwnerId!==auth.user.id)fail("Cart item not found.",404);
    const {error}=await db.from("CartItem").delete().eq("id",id);if(error)throw error;return reply({success:true},200,origin);
  }
  if(path==="/cart" && method==="DELETE") {
    const auth=await requireRole(req,["BUYER"]);const {data:cart}=await db.from("Cart").select("id").eq("userId",auth.user.id).maybeSingle();
    if(cart){const {error}=await db.from("CartItem").delete().eq("cartId",cart.id);if(error)throw error;}
    return reply({items:[]},200,origin);
  }


  if (path === "/shipping/quote" && method === "GET") {
    await requireRole(req,["BUYER"]);
    const state=(url.searchParams.get("state") ?? "").trim();
    const city=(url.searchParams.get("city") ?? "").trim();
    const subtotal=Number(url.searchParams.get("subtotal"));
    if(!state || !city || !Number.isFinite(subtotal) || subtotal < 0) fail("A valid state, city and subtotal are required.",400);
    const {data,error}=await db.rpc("edge_resolve_delivery_quote",{p_state:state,p_city:city,p_subtotal:subtotal});
    if(error)throw error;
    const quote=Array.isArray(data)?data[0]:data;
    if(!quote?.logistics_company_id) fail("Delivery is not available for the selected state and city. Please choose a supported delivery location.",404);
    return reply({
      companyId:quote.logistics_company_id,
      companyName:quote.logistics_company_name,
      deliveryFee:Number(quote.delivery_fee),
      freeDelivery:subtotal>=25000,
      state,city,subtotal
    },200,origin);
  }

  if(path==="/orders" && method==="POST") {
    const auth=await requireRole(req,["BUYER"]);
    const b=z.object({
      items:z.array(z.object({productId:z.string().min(1),quantity:z.number().int().min(1).max(100),selectedColor:z.string().trim().max(120).optional(),selectedSize:z.string().trim().max(120).optional(),selectedVariation:z.string().trim().max(120).optional()}).strict()).min(1).max(50),
      paymentMethod:z.enum(["opay","cod"]),
      shippingAddress:z.object({fullName:z.string().trim().min(2).max(120),phoneNumber:z.string().trim().min(7).max(24),state:z.string().trim().min(1).max(100),city:z.string().trim().min(1).max(100),area:z.string().trim().min(1).max(100),completeAddress:z.string().trim().min(5).max(500)}).strict(),
    }).strict().parse(await bodyJson(req));
    await runSubscriptionExpiry();
    const productIds=b.items.map(item=>item.productId);
    const {data:checkoutProducts,error:productReadError}=await db.from("Product").select("id,sellerId,approvalStatus").in("id",productIds);
    if(productReadError)throw productReadError;
    const blockedSellerIds=await expiredSubscriptionSellerIds();
    const unavailable=(checkoutProducts??[]).filter((product:any)=>product.approvalStatus!=="APPROVED" || blockedSellerIds.includes(product.sellerId));
    if(unavailable.length)fail("One or more products are no longer available because the seller subscription has expired or the product is not approved.",409);
    const {data:orderId,error}=await db.rpc("edge_checkout_order",{p_buyer_id:auth.user.id,p_items:b.items,p_payment_method:b.paymentMethod,p_shipping_address:b.shippingAddress});
    if(error) {
      if(error.message?.includes("different sellers"))fail(error.message,400);
      if(error.message?.includes("no longer available") || error.message?.includes("stock"))fail(error.message,409);
      throw error;
    }
    const order=await getOrder(orderId);if(!order)throw new Error("Order creation did not return an order.");
    return reply(orderForBuyer(order),201,origin);
  }


  async function runOrderAction(orderId:string,auth:any,action:string,payload:any={}) {
    const {data,error}=await db.rpc("edge_order_action",{p_order_id:orderId,p_actor_id:auth.user.id,p_action:action,p_payload:payload});
    if(error) {
      const msg=String(error.message??"");
      if(msg.includes("not found"))fail(msg,404);
      if(msg.includes("permission") || msg.includes("Authentication"))fail(msg,403);
      if(msg.includes("required") || msg.includes("Invalid"))fail(msg,400);
      if(msg.includes("already") || msg.includes("cannot") || msg.includes("not available") || msg.includes("must be") || msg.includes("awaiting") || msg.includes("transition") || msg.includes("no longer"))fail(msg,409);
      throw error;
    }
    const order=await getOrder(data);if(!order)throw new Error("Updated order could not be loaded.");
    return order;
  }
  const paymentConfirmMatch=path.match(/^\/orders\/([^/]+)\/payment-confirmation$/);
  if(paymentConfirmMatch && method==="POST") {
    const auth=await requireRole(req,["BUYER"]);const b=z.object({senderName:z.string().trim().min(2).max(120),transactionReference:z.string().trim().min(3).max(160)}).strict().parse(await bodyJson(req));
    const order=await runOrderAction(decodeURIComponent(paymentConfirmMatch[1]),auth,"submit_payment",b);
    return reply(orderForBuyer(order),200,origin);
  }
  const receiptUploadMatch=path.match(/^\/orders\/([^/]+)\/payment-receipt$/);
  if(receiptUploadMatch && method==="POST") {
    const auth=await requireRole(req,["BUYER"]);const orderId=decodeURIComponent(receiptUploadMatch[1]);
    const {data:existing}=await db.from("Order").select("id,buyerId,paymentMethod,status,paymentConfirmation").eq("id",orderId).maybeSingle();
    if(!existing || existing.buyerId!==auth.user.id)fail("Order not found.",404);
    if(existing.paymentMethod!=="opay" || !["pending_payment","pending_verification","rejected"].includes(existing.status))fail("Receipt upload is not available for this order.",409);
    if((existing.paymentConfirmation??{}).senderName?.trim?.().length<2 || (existing.paymentConfirmation??{}).transactionReference?.trim?.().length<3)fail("Submit your sender name and transaction reference before uploading the receipt.",409);
    const contentType=(req.headers.get("content-type")??"").split(";")[0].trim().toLowerCase();
    const allowed=["image/jpeg","image/png","image/webp","application/pdf"];const bytes=new Uint8Array(await req.arrayBuffer());
    if(!allowed.includes(contentType) || bytes.length<12 || bytes.length>5*1024*1024)fail("Upload JPG, PNG, WEBP or PDF up to 5 MB.",400);
    const starts=(arr:number[])=>arr.every((v,i)=>bytes[i]===v);
    const valid=contentType==="image/jpeg"?starts([255,216]):contentType==="image/png"?starts([137,80,78,71,13,10,26,10]):contentType==="image/webp"?new TextDecoder().decode(bytes.slice(0,4))==="RIFF" && new TextDecoder().decode(bytes.slice(8,12))==="WEBP":new TextDecoder().decode(bytes.slice(0,5))==="%PDF-";
    if(!valid)fail("File content does not match its selected type.",400);
    const ext=contentType==="image/jpeg"?"jpg":contentType==="image/png"?"png":contentType==="image/webp"?"webp":"pdf";
    const receiptPath=orderId+"/"+crypto.randomUUID().replaceAll("-","")+"."+ext;
    const {error:uploadError}=await db.storage.from("payment-receipts").upload(receiptPath,bytes,{contentType,upsert:false});
    if(uploadError)throw uploadError;
    try {
      const order=await runOrderAction(orderId,auth,"receipt_uploaded",{receiptPath,receiptMimeType:contentType});
      return reply(orderForBuyer(order),200,origin);
    } catch(error) {
      await db.storage.from("payment-receipts").remove([receiptPath]);
      throw error;
    }
  }
  const receiptAdminMatch=path.match(/^\/orders\/admin\/([^/]+)\/payment-receipt$/);
  if(receiptAdminMatch && method==="GET") {
    await requireRole(req,["SUPER_ADMIN"]);const orderId=decodeURIComponent(receiptAdminMatch[1]);
    const {data:order}=await db.from("Order").select("id,paymentConfirmation").eq("id",orderId).maybeSingle();
    if(!order)fail("Order not found.",404);const receiptPath=order.paymentConfirmation?.receiptPath;
    if(typeof receiptPath!=="string" || !receiptPath.startsWith(orderId+"/"))fail("Payment receipt not found.",404);
    const {data,error}=await db.storage.from("payment-receipts").createSignedUrl(receiptPath,300);
    if(error || !data?.signedUrl)throw error??new Error("Could not create secure receipt link.");
    return reply({url:data.signedUrl,expiresIn:300},200,origin);
  }
  const codApprovalMatch=path.match(/^\/orders\/admin\/([^/]+)\/cod-approval$/);
  if(codApprovalMatch && method==="PATCH") {
    const auth=await requireRole(req,["SUPER_ADMIN"]);const b=z.object({decision:z.enum(["approve","reject"]),adminNotes:z.string().trim().min(2).max(1000).optional()}).strict().parse(await bodyJson(req));
    if(b.decision==="reject"&&!b.adminNotes)fail("A rejection reason is required.",400);
    const order=await runOrderAction(decodeURIComponent(codApprovalMatch[1]),auth,"cod_approval",b);return reply(serializeOrder(order),200,origin);
  }
  if(path==="/seller/fulfillments" && method==="GET") {
    const auth=await requireRole(req,["SELLER"]);
    const {data,error}=await db.from("SellerFulfillment").select("*,order:Order!SellerFulfillment_orderId_fkey(id,orderNumber,status,createdAt)").eq("sellerId",auth.user.id).order("updatedAt",{ascending:false}).limit(100);
    if(error)throw error;
    return reply(data??[],200,origin);
  }
  if(path==="/seller/fulfillment-centres" && method==="GET") {
    await requireRole(req,["SELLER"]);
    const {data,error}=await db.from("LogisticsPickupCentre").select("id,logisticsCompanyId,centreName,centreType,address,state,city,area,openingHours,company:LogisticsCompany!LogisticsPickupCentre_logisticsCompanyId_fkey(companyName)").eq("isActive",true).in("centreType",["dropoff","both"]).order("state").limit(300);
    if(error)throw error;
    return reply(data??[],200,origin);
  }
  const sellerFulfillmentMatch=path.match(/^\/seller\/orders\/([^/]+)\/fulfillment$/);
  if(sellerFulfillmentMatch && method==="POST") {
    const auth=await requireRole(req,["SELLER"]);
    const b=z.object({
      packageWeightKg:z.number().positive().max(1000),
      lengthCm:z.number().positive().max(1000).nullable().optional(),
      widthCm:z.number().positive().max(1000).nullable().optional(),
      heightCm:z.number().positive().max(1000).nullable().optional(),
      parcelCount:z.number().int().min(1).max(100),
      fulfillmentMethod:z.enum(["logistics_pickup","centre_dropoff","seller_delivery"]),
      pickupCentreId:z.string().min(1).optional(),
      sellerNotes:z.string().trim().max(1000).optional()
    }).strict().parse(await bodyJson(req));
    const orderId=decodeURIComponent(sellerFulfillmentMatch[1]);
    const {data:order,error:orderError}=await db.from("Order").select("id,sellerId,status,paymentMethod,paymentConfirmation").eq("id",orderId).eq("sellerId",auth.user.id).maybeSingle();
    if(orderError)throw orderError;
    if(!order)fail("Order not found.",404);
    if(order.status!=="processing")fail("Accept the order and complete payment checks before saving package details.",409);
    const payment=order.paymentConfirmation??{};
    if((order.paymentMethod==="cod" && payment.adminApproved!==true) || (order.paymentMethod==="opay" && payment.verifiedByAdmin!==true)) fail("Admin payment approval is required before fulfillment.",403);
    if(b.fulfillmentMethod==="centre_dropoff") {
      if(!b.pickupCentreId)fail("Select an active drop-off centre.",400);
      const {data:centre,error}=await db.from("LogisticsPickupCentre").select("id,logisticsCompanyId,LogisticsCompany!inner(approvalStatus)").eq("id",b.pickupCentreId).eq("isActive",true).in("centreType",["dropoff","both"]).eq("LogisticsCompany.approvalStatus","approved").maybeSingle();
      if(error)throw error;
      if(!centre)fail("Selected drop-off centre is unavailable.",404);
    } else if(b.pickupCentreId) fail("A drop-off centre can only be selected for centre drop-off.",400);
    const now=new Date().toISOString();
    const payload={id:crypto.randomUUID(),orderId,sellerId:auth.user.id,packageWeightKg:b.packageWeightKg,lengthCm:b.lengthCm??null,widthCm:b.widthCm??null,heightCm:b.heightCm??null,parcelCount:b.parcelCount,fulfillmentMethod:b.fulfillmentMethod,pickupCentreId:b.pickupCentreId??null,sellerNotes:b.sellerNotes??"",status:b.fulfillmentMethod==="seller_delivery"?"seller_delivery":"prepared",updatedAt:now};
    const {data,error}=await db.from("SellerFulfillment").upsert(payload,{onConflict:"orderId"}).select("*").single();
    if(error)throw error;
    return reply(data,201,origin);
  }
  const sellerStatusMatch=path.match(/^\/orders\/([^/]+)\/status$/);
  if(sellerStatusMatch && method==="PATCH") {
    const auth=await requireRole(req,["SELLER"]);const b=z.object({status:z.enum(["processing","rejected"]),reason:z.string().trim().max(1000).optional()}).strict().parse(await bodyJson(req));
    if(b.status==="rejected"&&!b.reason)fail("A reason is required to reject an order.",400);
    const order=await runOrderAction(decodeURIComponent(sellerStatusMatch[1]),auth,"seller_status",{status:b.status,notes:b.reason});
    return reply(orderForSeller(order),200,origin);
  }
  const handoffMatch=path.match(/^\/orders\/([^/]+)\/logistics-handoff$/);
  if(handoffMatch && method==="PATCH") {
    const auth=await requireRole(req,["SELLER"]);const b=z.object({logisticsCompanyName:z.string().trim().min(2).max(160),trackingNumber:z.string().trim().min(3).max(100),notes:z.string().trim().max(1000).optional()}).strict().parse(await bodyJson(req));
    const {data:company,error:companyError}=await db.from("LogisticsCompany").select("id,companyName").ilike("companyName",b.logisticsCompanyName).eq("approvalStatus","approved").maybeSingle();
    if(companyError)throw companyError;if(!company)fail("Choose a logistics company that has been registered and approved by Super Admin.",400);
    const orderId=decodeURIComponent(handoffMatch[1]);
    const order=await runOrderAction(orderId,auth,"logistics_handoff",b);
    const {error:assignmentError}=await db.from("Order").update({logisticsCompanyId:company.id,logisticsCompanyName:company.companyName,updatedAt:new Date().toISOString()}).eq("id",orderId).eq("sellerId",auth.user.id);
    if(assignmentError)throw assignmentError;
    return reply(orderForSeller(await getOrder(orderId)),200,origin);
  }
  const logisticsMatch=path.match(/^\/orders\/admin\/([^/]+)\/logistics-update$/);
  if(logisticsMatch && method==="PATCH") {
    const auth=await requireRole(req,["SUPER_ADMIN"]);const b=z.object({status:z.enum(["picked_up","in_transit","out_for_delivery","delivered","failed"]),notes:z.string().trim().min(2).max(1000)}).strict().parse(await bodyJson(req));
    const order=await runOrderAction(decodeURIComponent(logisticsMatch[1]),auth,"logistics_update",b);
    if(b.status==="failed") {
      const now=new Date().toISOString();
      const {error}=await db.from("Order").update({deliveryFailureStatus:"action_required",deliveryFailureReason:b.notes,deliveryFailureRequestedAction:null,deliveryFailureRequestNotes:null,deliveryFailureRequestedAt:null,deliveryFailureResolvedAt:null,deliveryAttemptCount: (Number(order.deliveryAttemptCount)||0)+1,updatedAt:now}).eq("id",order.id);
      if(error)throw error;
      if(order.shipmentId){const {error:shipmentError}=await db.from("LogisticsShipment").update({status:"failed",deliveryNotes:b.notes,updatedAt:now}).eq("id",order.shipmentId);if(shipmentError)throw shipmentError;}
    }
    if(b.status==="delivered") {
      if(order.shipmentId){const {error:shipmentError}=await db.from("LogisticsShipment").update({status:"delivered",deliveredAt:new Date().toISOString(),deliveryNotes:b.notes,updatedAt:new Date().toISOString()}).eq("id",order.shipmentId);if(shipmentError)throw shipmentError;}
      await ensureOpayTransferPayout(order.id);
    }
    const {data:latest,error:latestError}=await db.from("Order").select("*,items:OrderItem(*,product:Product(*))").eq("id",order.id).single();
    if(latestError)throw latestError;
    return reply(serializeOrder(await getOrder(order.id)??latest),200,origin);
  }
  const deliveryFailureRequestMatch=path.match(/^\/orders\/([^/]+)\/delivery-failure-request$/);
  if(deliveryFailureRequestMatch && method==="POST") {
    const auth=await requireRole(req,["BUYER"]);
    const b=z.object({action:z.enum(["retry","refund","cancel"]),notes:z.string().trim().max(1000).optional()}).strict().parse(await bodyJson(req));
    const orderId=decodeURIComponent(deliveryFailureRequestMatch[1]);
    const {data:order,error}=await db.from("Order").select("*").eq("id",orderId).eq("buyerId",auth.user.id).maybeSingle();
    if(error)throw error;if(!order)fail("Order not found.",404);
    if(order.logisticsStatus!=="failed" || !["action_required","refund_rejected"].includes(order.deliveryFailureStatus))fail("This delivery failure is not awaiting a new buyer request.",409);
    if(b.action==="refund" && (order.paymentMethod!=="opay" || order.paymentConfirmation?.verifiedByAdmin!==true))fail("Refund requests are available only for OPay orders with payment verified by Admin. COD orders can request cancellation or another delivery.",409);
    const status=b.action==="retry"?"retry_requested":b.action==="refund"?"refund_requested":"action_required";
    const now=new Date().toISOString();
    const {error:updateError}=await db.from("Order").update({deliveryFailureStatus:status,deliveryFailureRequestedAction:b.action,deliveryFailureRequestNotes:b.notes??null,deliveryFailureRequestedAt:now,updatedAt:now}).eq("id",orderId).eq("buyerId",auth.user.id);
    if(updateError)throw updateError;
    await db.from("OrderTrackingStep").insert({id:crypto.randomUUID(),orderId,title:b.action==="retry"?"Another Delivery Requested":b.action==="refund"?"Refund Requested":"Cancellation Requested",dateLabel:new Date().toLocaleString("en-NG",{timeZone:"Africa/Lagos"}),completed:false,description:b.notes??"Buyer submitted a request after failed delivery.",sortOrder:Math.floor(Date.now()/1000),createdAt:now});
    const latest=await getOrder(orderId);return reply(orderForBuyer(latest),200,origin);
  }
  const deliveryFailureAdminMatch=path.match(/^\/orders\/admin\/([^/]+)\/delivery-failure-resolution$/);
  if(deliveryFailureAdminMatch && method==="PATCH") {
    const auth=await requireRole(req,["SUPER_ADMIN"]);
    const b=z.object({decision:z.enum(["retry","refund","reject_refund","cancel"]),notes:z.string().trim().min(2).max(1000)}).strict().parse(await bodyJson(req));
    const orderId=decodeURIComponent(deliveryFailureAdminMatch[1]);
    const {data:order,error}=await db.from("Order").select("*").eq("id",orderId).maybeSingle();
    if(error)throw error;if(!order)fail("Order not found.",404);
    if(!["action_required","retry_requested","refund_requested","refund_rejected"].includes(order.deliveryFailureStatus))fail("This failed delivery case is not awaiting Admin action.",409);
    if(b.decision==="refund" && (order.paymentMethod!=="opay" || order.paymentConfirmation?.verifiedByAdmin!==true))fail("Only verified OPay payments can be approved for refund. COD cannot be refunded because no buyer payment was collected.",409);
    const now=new Date().toISOString();let patch:any={deliveryFailureResolvedAt:now,deliveryFailureRequestNotes:b.notes,updatedAt:now};
    let title="",description=b.notes;
    if(b.decision==="retry") {
      patch={...patch,deliveryFailureStatus:"retry_in_progress",deliveryFailureRequestedAction:"retry",logisticsStatus:"in_transit"};
      if(order.shipmentId){const {error:e}=await db.from("LogisticsShipment").update({status:"in_transit",deliveryNotes:b.notes,updatedAt:now}).eq("id",order.shipmentId);if(e)throw e;}
      title="Repeat Delivery Approved";
    } else if(b.decision==="refund") {
      patch={...patch,deliveryFailureStatus:"refund_approved",deliveryFailureRequestedAction:"refund"};
      title="Refund Approved - Manual Processing Required";
      description="Admin approved the refund request. Finance/Admin must complete the actual payment reversal and upload/record proof. "+b.notes;
    } else if(b.decision==="reject_refund") {
      patch={...patch,deliveryFailureStatus:"refund_rejected",deliveryFailureRequestedAction:null};
      title="Refund Request Declined";
    } else {
      patch={...patch,deliveryFailureStatus:"resolved",status:"cancelled",deliveryFailureRequestedAction:"cancel"};
      title="Order Cancelled After Failed Delivery";
      for(const item of (await db.from("OrderItem").select("productId,quantity").eq("orderId",orderId)).data??[]) {
        const {data:product}=await db.from("Product").select("stockQuantity").eq("id",item.productId).maybeSingle();
        if(product){const {error:e}=await db.from("Product").update({stockQuantity:Number(product.stockQuantity)+Number(item.quantity),updatedAt:now}).eq("id",item.productId);if(e)throw e;}
      }
    }
    const {error:updateError}=await db.from("Order").update(patch).eq("id",orderId);if(updateError)throw updateError;
    const {error:stepError}=await db.from("OrderTrackingStep").insert({id:crypto.randomUUID(),orderId,title,dateLabel:new Date().toLocaleString("en-NG",{timeZone:"Africa/Lagos"}),completed:true,description,sortOrder:Math.floor(Date.now()/1000),createdAt:now});if(stepError)throw stepError;
    return reply(serializeOrder(await getOrder(orderId)),200,origin);
  }
  const cancelMatch=path.match(/^\/orders\/([^/]+)\/cancel$/);
  if(cancelMatch && method==="POST") {
    const auth=await requireRole(req,["BUYER"]);const order=await runOrderAction(decodeURIComponent(cancelMatch[1]),auth,"cancel",{});
    return reply(orderForBuyer(order),200,origin);
  }
  const verifyMatch=path.match(/^\/orders\/admin\/([^/]+)\/payment-verification$/);
  if(verifyMatch && method==="PATCH") {
    const auth=await requireRole(req,["SUPER_ADMIN"]);const b=z.object({decision:z.enum(["approve","reject"]),adminNotes:z.string().trim().min(2).max(1000).optional()}).strict().parse(await bodyJson(req));
    if(b.decision==="reject"&&!b.adminNotes)fail("A reason is required to reject payment.",400);
    const order=await runOrderAction(decodeURIComponent(verifyMatch[1]),auth,"payment_verification",b);return reply(serializeOrder(order),200,origin);
  }


  const flashAdminPath="/content/admin/flash-sales";
  const flashSchema=z.object({title:z.string().trim().min(1).max(200),description:z.string().trim().max(2000).optional(),discountPercentage:z.number().int().min(1).max(100),startTime:z.string().datetime(),endTime:z.string().datetime(),productIds:z.array(z.string().trim().min(1).max(128)).min(1).max(100),isActive:z.boolean().default(false)});
  const serializeSale=(sale:any)=>({id:sale.id,title:sale.title,description:sale.description||undefined,discountPercentage:sale.discountPercentage,startTime:sale.startTime,endTime:sale.endTime,productIds:(sale.products??[]).map((p:any)=>p.productId),isActive:sale.isActive,createdAt:sale.createdAt});
  if(path===flashAdminPath && method==="GET") {
    await requireRole(req,["SUPER_ADMIN"]);const {data,error}=await db.from("FlashSale").select("*,products:FlashSaleProduct(productId)").order("createdAt",{ascending:false}).limit(100);
    if(error)throw error;return reply((data??[]).map(serializeSale),200,origin);
  }
  if(path===flashAdminPath && method==="POST") {
    await requireRole(req,["SUPER_ADMIN"]);const b=flashSchema.parse(await bodyJson(req));
    if(new Date(b.endTime)<=new Date(b.startTime))fail("Flash sale end time must be after its start time.",400);
    const productIds=[...new Set(b.productIds)];const {data:products,error:productError}=await db.from("Product").select("id").in("id",productIds).eq("approvalStatus","APPROVED");
    if(productError)throw productError;if((products??[]).length!==productIds.length)fail("Every selected flash sale product must exist and be approved.",400);
    const {data:sale,error}=await db.from("FlashSale").insert({id:crypto.randomUUID(),title:b.title,description:b.description??null,discountPercentage:b.discountPercentage,startTime:b.startTime,endTime:b.endTime,isActive:b.isActive}).select("*").single();
    if(error)throw error;
    const {error:linkError}=await db.from("FlashSaleProduct").insert(productIds.map(productId=>({flashSaleId:sale.id,productId})));
    if(linkError){await db.from("FlashSale").delete().eq("id",sale.id);throw linkError;}
    return reply(serializeSale({...sale,products:productIds.map(productId=>({productId}))}),201,origin);
  }
  const flashIdMatch=path.match(/^\/content\/admin\/flash-sales\/([^/]+)$/);
  if(flashIdMatch && method==="PATCH") {
    await requireRole(req,["SUPER_ADMIN"]);const id=decodeURIComponent(flashIdMatch[1]);
    const b=z.object({title:z.string().trim().min(1).max(200).optional(),description:z.string().trim().max(2000).optional(),discountPercentage:z.number().int().min(1).max(100).optional(),startTime:z.string().datetime().optional(),endTime:z.string().datetime().optional(),productIds:z.array(z.string().trim().min(1).max(128)).min(1).max(100).optional(),isActive:z.boolean().optional()}).strict().parse(await bodyJson(req));
    const {data:current}=await db.from("FlashSale").select("*").eq("id",id).maybeSingle();if(!current)fail("Flash sale not found.",404);
    if(new Date(b.endTime??current.endTime)<=new Date(b.startTime??current.startTime))fail("Flash sale end time must be after its start time.",400);
    if(b.productIds){const ids=[...new Set(b.productIds)];const {data:products,error}=await db.from("Product").select("id").in("id",ids).eq("approvalStatus","APPROVED");if(error)throw error;if((products??[]).length!==ids.length)fail("Every selected flash sale product must exist and be approved.",400);
      const del=await db.from("FlashSaleProduct").delete().eq("flashSaleId",id);if(del.error)throw del.error;const add=await db.from("FlashSaleProduct").insert(ids.map(productId=>({flashSaleId:id,productId})));if(add.error)throw add.error;}
    const patch:any={};for(const k of ["title","description","discountPercentage","startTime","endTime","isActive"])if((b as any)[k]!==undefined)patch[k]=(b as any)[k];
    const {data:sale,error}=await db.from("FlashSale").update(patch).eq("id",id).select("*").single();if(error)throw error;
    const {data:links,error:linkError}=await db.from("FlashSaleProduct").select("productId").eq("flashSaleId",id);if(linkError)throw linkError;
    return reply(serializeSale({...sale,products:links??[]}),200,origin);
  }
  if(flashIdMatch && method==="DELETE") {
    await requireRole(req,["SUPER_ADMIN"]);const id=decodeURIComponent(flashIdMatch[1]);const {error}=await db.from("FlashSale").delete().eq("id",id);if(error)throw error;return reply({success:true},200,origin);
  }

  // Logistics company workspace. Every operation is scoped to the authenticated company.
  async function approvedLogisticsCompany(req: Request) {
    const auth=await requireRole(req,["LOGISTICS"]);
    const {data:company,error}=await db.from("LogisticsCompany").select("*").eq("ownerUserId",auth.user.id).maybeSingle();
    if(error)throw error;
    if(!company || company.approvalStatus!=="approved")fail("Your logistics company is not approved yet.",403);
    return {auth,company};
  }
  const shipmentStatusLabels:Record<string,string>={awaiting_pickup:"Awaiting Pickup",picked_up:"Picked Up",in_transit:"In Transit",out_for_delivery:"Out for Delivery",delivered:"Delivered",failed:"Delivery Failed",cancelled:"Cancelled"};
  if(path==="/logistics/company" && method==="GET") {
    const auth=await requireRole(req,["LOGISTICS"]);
    const {data,error}=await db.from("LogisticsCompany").select("*").eq("ownerUserId",auth.user.id).maybeSingle();
    if(error)throw error;if(!data)fail("Logistics company profile was not found.",404);
    return reply(data,200,origin);
  }
  if(path==="/logistics/company" && method==="PATCH") {
    const {auth,company}=await approvedLogisticsCompany(req);
    const b=z.object({
      serviceAreas:z.array(z.object({
        state:z.string().trim().min(1).max(100),
        cities:z.array(z.string().trim().min(1).max(100)).min(1).max(100),
        areas:z.array(z.string().trim().min(1).max(100)).max(300).optional(),
      }).strict()).max(100),
      pricing:z.array(z.object({
        state:z.string().trim().min(1).max(100),
        city:z.string().trim().min(1).max(100),
        fee:z.number().finite().min(0).max(10000000),
        currency:z.literal("NGN").optional(),
      }).strict()).max(1000),
    }).strict().parse(await bodyJson(req));
    const normalize=(value:string)=>value.trim().toLocaleLowerCase();
    const seen=new Set<string>();
    for(const row of b.pricing) {
      const area=b.serviceAreas.find(item=>normalize(item.state)===normalize(row.state));
      if(!area || !area.cities.some(city=>normalize(city)===normalize(row.city))) fail(`Add ${row.city}, ${row.state} to service areas before setting its fee.`,400);
      const key=normalize(row.state)+"|"+normalize(row.city);
      if(seen.has(key))fail("Each state and city can have only one delivery fee.",400);
      seen.add(key);
    }
    for(const area of b.serviceAreas) {
      if(new Set(area.cities.map(normalize)).size!==area.cities.length)fail("Duplicate cities are not allowed within a state.",400);
    }
    const {data,error}=await db.from("LogisticsCompany").update({
      serviceAreas:b.serviceAreas.map(area=>({...area,state:area.state.trim(),cities:area.cities.map(city=>city.trim()),areas:area.areas?.map(value=>value.trim())})),
      pricing:b.pricing.map(row=>({...row,state:row.state.trim(),city:row.city.trim(),currency:"NGN"})),
      updatedAt:new Date().toISOString(),
    }).eq("id",company.id).eq("ownerUserId",auth.user.id).select("*").single();
    if(error)throw error;
    return reply(data,200,origin);
  }
  if(path==="/logistics/centres" && method==="GET") {
    const {company}=await approvedLogisticsCompany(req);
    const {data,error}=await db.from("LogisticsPickupCentre").select("*").eq("logisticsCompanyId",company.id).order("createdAt",{ascending:false}).limit(200);
    if(error)throw error;
    return reply(data??[],200,origin);
  }
  if(path==="/logistics/centres" && method==="POST") {
    const {company}=await approvedLogisticsCompany(req);
    const b=z.object({
      centreName:z.string().trim().min(2).max(160),
      centreType:z.enum(["pickup","dropoff","both"]),
      contactName:z.string().trim().min(2).max(120),
      phone:z.string().trim().min(7).max(24),
      address:z.string().trim().min(5).max(500),
      state:z.string().trim().min(2).max(100),
      city:z.string().trim().min(2).max(100),
      area:z.string().trim().max(120).optional(),
      openingHours:z.string().trim().min(3).max(160).optional()
    }).strict().parse(await bodyJson(req));
    const now=new Date().toISOString();
    const {data,error}=await db.from("LogisticsPickupCentre").insert({
      id:crypto.randomUUID(),logisticsCompanyId:company.id,...b,
      phone:b.phone.replace(/[\\s()-]/g,""),area:b.area??"",
      openingHours:b.openingHours??"Monday-Saturday, 8:00 AM-6:00 PM",
      isActive:true,createdAt:now,updatedAt:now
    }).select("*").single();
    if(error)throw error;
    return reply(data,201,origin);
  }
  const logisticsCentreMatch=path.match(/^\/logistics\/centres\/([^/]+)$/);
  if(logisticsCentreMatch && (method==="PATCH" || method==="DELETE")) {
    const {company}=await approvedLogisticsCompany(req);
    const id=decodeURIComponent(logisticsCentreMatch[1]);
    const {data:centre,error:centreError}=await db.from("LogisticsPickupCentre").select("*").eq("id",id).eq("logisticsCompanyId",company.id).maybeSingle();
    if(centreError)throw centreError;
    if(!centre)fail("Pickup centre not found.",404);
    if(method==="DELETE") {
      const {error}=await db.from("LogisticsPickupCentre").delete().eq("id",id).eq("logisticsCompanyId",company.id);
      if(error)throw error;
      return reply({success:true},200,origin);
    }
    const b=z.object({isActive:z.boolean()}).strict().parse(await bodyJson(req));
    const {data,error}=await db.from("LogisticsPickupCentre").update({isActive:b.isActive,updatedAt:new Date().toISOString()}).eq("id",id).eq("logisticsCompanyId",company.id).select("*").single();
    if(error)throw error;
    return reply(data,200,origin);
  }
  if(path==="/logistics/orders" && method==="GET") {
    const {company}=await approvedLogisticsCompany(req);
    const {data,error}=await db.from("Order").select("*,items:OrderItem(*),trackingTimeline:OrderTrackingStep(*)")
      .eq("logisticsCompanyId",company.id).eq("status","dispatched").order("createdAt",{ascending:false}).limit(100);
    if(error)throw error;
    const eligible=(data??[]).filter((o:any)=>o.paymentMethod==="opay"?(o.paymentConfirmation??{}).verifiedByAdmin===true:(o.paymentConfirmation??{}).adminApproved===true);
    return reply(eligible.map(serializeOrder),200,origin);
  }
  if(path==="/logistics/agents" && method==="GET") {
    const {company}=await approvedLogisticsCompany(req);
    const {data,error}=await db.from("DeliveryAgent").select("*").eq("logisticsCompanyId",company.id).order("createdAt",{ascending:false});
    if(error)throw error;return reply(data??[],200,origin);
  }
  if(path==="/logistics/agents" && method==="POST") {
    const {company}=await approvedLogisticsCompany(req);
    const b=z.object({fullName:z.string().trim().min(2).max(120),phone:z.string().trim().min(7).max(24),whatsAppNumber:z.string().trim().min(7).max(24).optional(),email:z.string().trim().email().max(254).optional(),vehicleType:z.string().trim().max(80).optional(),vehiclePlateNumber:z.string().trim().max(40).optional(),profileImage:z.string().url().max(1000).optional()}).strict().parse(await bodyJson(req));
    const {data,error}=await db.from("DeliveryAgent").insert({id:crypto.randomUUID(),logisticsCompanyId:company.id,...b,phone:b.phone.replace(/[\\s()-]/g,""),status:"active"}).select("*").single();
    if(error)throw error;return reply(data,201,origin);
  }
  const logisticsAgentMatch=path.match(/^\/logistics\/agents\/([^/]+)$/);
  if(logisticsAgentMatch && (method==="PATCH" || method==="DELETE")) {
    const {company}=await approvedLogisticsCompany(req);const id=decodeURIComponent(logisticsAgentMatch[1]);
    const {data:agent,error:agentError}=await db.from("DeliveryAgent").select("*").eq("id",id).eq("logisticsCompanyId",company.id).maybeSingle();
    if(agentError)throw agentError;if(!agent)fail("Delivery agent not found.",404);
    if(method==="DELETE") {
      const {data:active,error:activeShipmentsError}=await db.from("LogisticsShipment").select("id").eq("deliveryAgentId",id).not("status","in","(delivered,cancelled)").limit(1);
      if(activeShipmentsError)throw activeShipmentsError;if(active?.length)fail("Reassign this agent's active shipments before removing the agent.",409);
      const {error:deleteAgentError}=await db.from("DeliveryAgent").delete().eq("id",id).eq("logisticsCompanyId",company.id);if(deleteAgentError)throw deleteAgentError;
      return reply({success:true},200,origin);
    }
    const b=z.object({status:z.enum(["active","inactive","suspended"])}).strict().parse(await bodyJson(req));
    const {data,error}=await db.from("DeliveryAgent").update({status:b.status}).eq("id",id).eq("logisticsCompanyId",company.id).select("*").single();
    if(error)throw error;return reply(data,200,origin);
  }
  if(path==="/logistics/shipments" && method==="GET") {
    const {company}=await approvedLogisticsCompany(req);
    const {data,error}=await db.from("LogisticsShipment").select("*,trackingTimeline:LogisticsShipmentTrackingStep(*)")
      .eq("logisticsCompanyId",company.id).order("createdAt",{ascending:false}).limit(100);
    if(error)throw error;
    return reply((data??[]).map((shipment:any)=>({...shipment,trackingTimeline:[...(shipment.trackingTimeline??[])].sort((a:any,b:any)=>a.sortOrder-b.sortOrder).map((step:any)=>({title:step.title,date:step.dateLabel,completed:step.completed,description:step.description}))})),200,origin);
  }
  if(path==="/logistics/shipments" && method==="POST") {
    const {auth,company}=await approvedLogisticsCompany(req);
    const b=z.object({orderId:z.string().min(1).max(128),deliveryAgentId:z.string().min(1).max(128).optional()}).strict().parse(await bodyJson(req));
    const {data:order,error:orderError}=await db.from("Order").select("*").eq("id",b.orderId).eq("logisticsCompanyId",company.id).maybeSingle();
    if(orderError)throw orderError;if(!order || order.status!=="dispatched")fail("This dispatched order is not assigned to your company.",404);
    const paid=order.paymentMethod==="opay"?(order.paymentConfirmation??{}).verifiedByAdmin===true:(order.paymentConfirmation??{}).adminApproved===true;
    if(!paid)fail("The order payment must be approved before shipment creation.",409);
    let agent:any=null;
    if(b.deliveryAgentId){const result=await db.from("DeliveryAgent").select("id").eq("id",b.deliveryAgentId).eq("logisticsCompanyId",company.id).eq("status","active").maybeSingle();if(result.error)throw result.error;if(!result.data)fail("Choose an active agent belonging to your company.",400);agent=result.data;}
    const now=new Date().toISOString(),trackingNumber="KN-"+crypto.randomUUID().replace(/-/g,"").slice(0,12).toUpperCase(),shipmentId=crypto.randomUUID();
    const {data:shipment,error}=await db.from("LogisticsShipment").insert({
      id:shipmentId,trackingNumber,orderId:order.id,logisticsCompanyId:company.id,deliveryAgentId:agent?.id??null,buyerId:order.buyerId,
      recipientName:order.shippingAddress?.fullName??order.buyerName,recipientPhone:order.shippingAddress?.phoneNumber??order.buyerPhone,
      deliveryAddress:order.shippingAddress,deliveryFee:order.deliveryFee,status:"awaiting_pickup",createdAt:now,updatedAt:now
    }).select("*").single();
    if(error){if(error.code==="23505")fail("A shipment already exists for this order.",409);throw error;}
    const step={id:crypto.randomUUID(),shipmentId,title:"Awaiting Pickup",dateLabel:new Date(now).toLocaleString(),completed:true,description:"Shipment accepted by "+company.companyName,sortOrder:0,createdAt:now};
    const {error:stepError}=await db.from("LogisticsShipmentTrackingStep").insert(step);if(stepError)throw stepError;
    const {error:updateError}=await db.from("Order").update({shipmentId,trackingNumber,logisticsCompanyName:company.companyName,logisticsStatus:"handed_to_logistics",deliveryAgentId:agent?.id??null,updatedAt:now}).eq("id",order.id);
    if(updateError)throw updateError;
    const {error:buyerStepError}=await db.from("OrderTrackingStep").insert({id:crypto.randomUUID(),orderId:order.id,title:"Awaiting Pickup",dateLabel:new Date(now).toLocaleString(),completed:true,description:"Shipment created by "+company.companyName,sortOrder:900,createdAt:now});
    if(buyerStepError)throw buyerStepError;
    await recordUserActivity(auth.user.id,"SHIPMENT_CREATED","Created shipment "+trackingNumber,{shipmentId,orderId:order.id,trackingNumber});
    return reply({...shipment,trackingTimeline:[{title:"Awaiting Pickup",date:new Date(now).toLocaleString(),completed:true,description:step.description}]},201,origin);
  }
  const shipmentAgentMatch=path.match(/^\/logistics\/shipments\/([^/]+)\/agent$/);
  if(shipmentAgentMatch && method==="PATCH") {
    const {auth,company}=await approvedLogisticsCompany(req);const id=decodeURIComponent(shipmentAgentMatch[1]);
    const b=z.object({deliveryAgentId:z.string().min(1).max(128).nullable()}).strict().parse(await bodyJson(req));
    const {data:shipment,error}=await db.from("LogisticsShipment").select("*").eq("id",id).eq("logisticsCompanyId",company.id).maybeSingle();
    if(error)throw error;if(!shipment)fail("Shipment not found.",404);
    if(["delivered","cancelled"].includes(shipment.status))fail("Completed shipments cannot be reassigned.",409);
    if(b.deliveryAgentId){const a=await db.from("DeliveryAgent").select("id").eq("id",b.deliveryAgentId).eq("logisticsCompanyId",company.id).eq("status","active").maybeSingle();if(a.error)throw a.error;if(!a.data)fail("Choose an active agent belonging to your company.",400);}
    const now=new Date().toISOString();
    const {data,error:updateError}=await db.from("LogisticsShipment").update({deliveryAgentId:b.deliveryAgentId,updatedAt:now}).eq("id",id).select("*").single();
    if(updateError)throw updateError;
    await db.from("Order").update({deliveryAgentId:b.deliveryAgentId,updatedAt:now}).eq("id",shipment.orderId);
    const {data:steps}=await db.from("LogisticsShipmentTrackingStep").select("sortOrder").eq("shipmentId",id).order("sortOrder",{ascending:false}).limit(1);
    const {error:stepError}=await db.from("LogisticsShipmentTrackingStep").insert({id:crypto.randomUUID(),shipmentId:id,title:b.deliveryAgentId?"Delivery Agent Assigned":"Delivery Agent Unassigned",dateLabel:new Date(now).toLocaleString(),completed:true,description:b.deliveryAgentId?"A delivery agent has been assigned.":"The delivery agent assignment was removed.",sortOrder:(steps?.[0]?.sortOrder??0)+1,createdAt:now});
    if(stepError)throw stepError;await recordUserActivity(auth.user.id,"SHIPMENT_AGENT_CHANGED","Updated shipment delivery agent",{shipmentId:id,orderId:shipment.orderId,deliveryAgentId:b.deliveryAgentId});return reply(data,200,origin);
  }
  const shipmentStatusMatch=path.match(/^\/logistics\/shipments\/([^/]+)\/status$/);
  if(shipmentStatusMatch && method==="PATCH") {
    const {auth,company}=await approvedLogisticsCompany(req);const id=decodeURIComponent(shipmentStatusMatch[1]);
    const b=z.object({status:z.enum(["picked_up","in_transit","out_for_delivery","delivered","failed"]),notes:z.string().trim().max(1000).optional()}).strict().parse(await bodyJson(req));
    const {data:shipment,error}=await db.from("LogisticsShipment").select("*").eq("id",id).eq("logisticsCompanyId",company.id).maybeSingle();
    if(error)throw error;if(!shipment)fail("Shipment not found.",404);
    if(["delivered","cancelled"].includes(shipment.status))fail("This shipment is already closed.",409);
    if(shipment.status==="failed")fail("This failed delivery must be reviewed by Admin before another attempt. Ask Admin to approve a retry.",409);
    const {data:linkedOrder,error:linkedOrderError}=await db.from("Order").select("id,status").eq("id",shipment.orderId).maybeSingle();
    if(linkedOrderError)throw linkedOrderError;
    if(!linkedOrder)fail("Linked order not found.",404);
    if(["cancelled","rejected"].includes(linkedOrder.status))fail("Cancelled or rejected orders cannot be delivered or paid out.",409);
    const orderStatusMap:Record<string,string>={picked_up:"picked_up",in_transit:"in_transit",out_for_delivery:"out_for_delivery",delivered:"delivered",failed:"failed"};
    const now=new Date().toISOString(),label=shipmentStatusLabels[b.status];
    const {data:updated,error:updateError}=await db.from("LogisticsShipment").update({status:b.status,pickupAt:b.status==="picked_up"?(shipment.pickupAt??now):shipment.pickupAt,deliveredAt:b.status==="delivered"?now:shipment.deliveredAt,deliveryNotes:b.notes??shipment.deliveryNotes,updatedAt:now}).eq("id",id).select("*").single();
    if(updateError)throw updateError;
    const {data:steps,error:stepsError}=await db.from("LogisticsShipmentTrackingStep").select("sortOrder").eq("shipmentId",id).order("sortOrder",{ascending:false}).limit(1);
    if(stepsError)throw stepsError;
    const description=b.notes?.trim()||label;
    const {error:stepError}=await db.from("LogisticsShipmentTrackingStep").insert({id:crypto.randomUUID(),shipmentId:id,title:label,dateLabel:new Date(now).toLocaleString(),completed:true,description,sortOrder:(steps?.[0]?.sortOrder??0)+1,createdAt:now});
    if(stepError)throw stepError;
    const {data:orderSteps,error:orderStepsError}=await db.from("OrderTrackingStep").select("sortOrder").eq("orderId",shipment.orderId).order("sortOrder",{ascending:false}).limit(1);
    if(orderStepsError)throw orderStepsError;
    const orderUpdate:any={logisticsStatus:orderStatusMap[b.status],updatedAt:now};
    if(b.status==="failed") {
      const {data:currentOrder,error:currentOrderError}=await db.from("Order").select("deliveryAttemptCount").eq("id",shipment.orderId).single();
      if(currentOrderError)throw currentOrderError;
      orderUpdate.deliveryFailureStatus="action_required";
      orderUpdate.deliveryFailureReason=description;
      orderUpdate.deliveryFailureRequestedAction=null;
      orderUpdate.deliveryFailureRequestNotes=null;
      orderUpdate.deliveryFailureRequestedAt=null;
      orderUpdate.deliveryFailureResolvedAt=null;
      orderUpdate.deliveryAttemptCount=(Number(currentOrder.deliveryAttemptCount)||0)+1;
    }
    if(b.status==="delivered"){orderUpdate.status="delivered";orderUpdate.deliveredAt=now;if(orderUpdate.deliveryFailureStatus===undefined){orderUpdate.deliveryFailureStatus="resolved";orderUpdate.deliveryFailureResolvedAt=now;}}
    const {error:orderError}=await db.from("Order").update(orderUpdate).eq("id",shipment.orderId);if(orderError)throw orderError;
    const {error:buyerStepError}=await db.from("OrderTrackingStep").insert({id:crypto.randomUUID(),orderId:shipment.orderId,title:label,dateLabel:new Date(now).toLocaleString(),completed:true,description,sortOrder:(orderSteps?.[0]?.sortOrder??0)+1,createdAt:now});
    if(buyerStepError)throw buyerStepError;
    await recordUserActivity(auth.user.id,"SHIPMENT_STATUS_CHANGED",`Shipment ${shipment.trackingNumber}: ${b.status}`,{shipmentId:id,orderId:shipment.orderId,status:b.status,notes:b.notes??""});
    if(b.status==="delivered") {
      const {data:orderForSettlement,error:settlementOrderError}=await db.from("Order").select("id,sellerId,subtotal,totalAmount,paymentMethod").eq("id",shipment.orderId).single();
      if(settlementOrderError)throw settlementOrderError;
      if(orderForSettlement.paymentMethod==="cod") {
        const gross=Number(orderForSettlement.totalAmount),subtotal=Number(orderForSettlement.subtotal),commission=Number((subtotal*0.05).toFixed(2));
        const {error:settlementError}=await db.from("CODSettlement").upsert({
          id:crypto.randomUUID(),orderId:orderForSettlement.id,logisticsCompanyId:company.id,sellerId:orderForSettlement.sellerId,
          grossCollectedAmount:gross,commissionRate:5,commissionAmount:commission,sellerPayoutAmount:Number((subtotal-commission).toFixed(2)),
          status:"awaiting_logistics_transfer",createdAt:now,updatedAt:now
        },{onConflict:"orderId",ignoreDuplicates:true});
        if(settlementError)throw settlementError;
      } else if(orderForSettlement.paymentMethod==="opay") { await ensureOpayTransferPayout(orderForSettlement.id); }
    }
    return reply(updated,200,origin);
  }
  const logisticsAssignmentMatch=path.match(/^\/admin\/orders\/([^/]+)\/logistics-assignment$/);
  if(logisticsAssignmentMatch && method==="PATCH") {
    await requireRole(req,["SUPER_ADMIN"]);const orderId=decodeURIComponent(logisticsAssignmentMatch[1]);
    const b=z.object({logisticsCompanyId:z.string().min(1).max(128).nullable()}).strict().parse(await bodyJson(req));
    const {data:order,error:orderError}=await db.from("Order").select("id,status").eq("id",orderId).maybeSingle();
    if(orderError)throw orderError;if(!order)fail("Order not found.",404);
    let company:any=null;
    if(b.logisticsCompanyId){const result=await db.from("LogisticsCompany").select("id,companyName").eq("id",b.logisticsCompanyId).eq("approvalStatus","approved").maybeSingle();if(result.error)throw result.error;if(!result.data)fail("Choose an approved logistics company.",400);company=result.data;}
    const {data,error}=await db.from("Order").update({logisticsCompanyId:company?.id??null,logisticsCompanyName:company?.companyName??null,updatedAt:new Date().toISOString()}).eq("id",orderId).select("*").single();
    if(error)throw error;return reply({success:true,order:data},200,origin);
  }


  // COD settlement workflow. All money-state transitions are role-checked server-side.
  const receiptContent = async (req: Request) => {
    const contentType=(req.headers.get("content-type")??"").split(";")[0].trim().toLowerCase();
    const allowed=["image/jpeg","image/png","image/webp","application/pdf"];
    const bytes=new Uint8Array(await req.arrayBuffer());
    if(!allowed.includes(contentType) || bytes.length<12 || bytes.length>5*1024*1024)fail("Upload JPG, PNG, WEBP or PDF up to 5 MB.",400);
    const starts=(arr:number[])=>arr.every((v,i)=>bytes[i]===v);
    const valid=contentType==="image/jpeg"?starts([255,216]):contentType==="image/png"?starts([137,80,78,71,13,10,26,10]):contentType==="image/webp"?new TextDecoder().decode(bytes.slice(0,4))==="RIFF"&&new TextDecoder().decode(bytes.slice(8,12))==="WEBP":new TextDecoder().decode(bytes.slice(0,5))==="%PDF-";
    if(!valid)fail("File content does not match its selected type.",400);
    const ext=contentType==="image/jpeg"?"jpg":contentType==="image/png"?"png":contentType==="image/webp"?"webp":"pdf";
    return {bytes,contentType,ext};
  };
  const settlementDetails = async (row:any) => {
    const {data:order,error}=await db.from("Order").select("id,orderNumber,buyerName,buyerPhone,subtotal,deliveryFee,totalAmount,paymentMethod,items:OrderItem(productSnapshot,quantity,unitPrice)").eq("id",row.orderId).single();
    if(error)throw error;
    const {data:seller,error:sellerError}=await db.from("User").select("id,fullName,businessName,phone,payoutBankName,payoutAccountName,payoutAccountNumber").eq("id",row.sellerId).single();
    if(sellerError)throw sellerError;
    return {...row,order,seller:{id:seller.id,fullName:seller.fullName,businessName:seller.businessName,phone:seller.phone,payoutBankName:seller.payoutBankName,payoutAccountName:seller.payoutAccountName,payoutAccountNumber:seller.payoutAccountNumber}};
  };
  if(path==="/logistics/remittance-account" && method==="GET") {
    await approvedLogisticsCompany(req);
    const {data,error}=await db.from("MarketplacePayoutSettings").select("bankName,accountName,accountNumber").eq("id","default").single();
    if(error)throw error;
    if(!data.bankName||!data.accountName||!data.accountNumber)fail("Marketplace COD remittance bank details have not been configured by Super Admin.",409);
    return reply(data,200,origin);
  }
  if(path==="/logistics/cod-settlements" && method==="GET") {
    const {company}=await approvedLogisticsCompany(req);
    const {data,error}=await db.from("CODSettlement").select("*").eq("logisticsCompanyId",company.id).order("createdAt",{ascending:false}).limit(100);
    if(error)throw error;
    const rows=await Promise.all((data??[]).map(settlementDetails));
    return reply(rows.map((row:any)=>({...row,seller:{id:row.seller.id,fullName:row.seller.fullName,businessName:row.seller.businessName,phone:row.seller.phone}})),200,origin);
  }
  const logisticsSettlementReceipt=path.match(/^\/logistics\/cod-settlements\/([^/]+)\/receipt$/);
  if(logisticsSettlementReceipt && method==="POST") {
    const {company}=await approvedLogisticsCompany(req);const id=decodeURIComponent(logisticsSettlementReceipt[1]);
    const {data:row,error}=await db.from("CODSettlement").select("*").eq("id",id).eq("logisticsCompanyId",company.id).maybeSingle();
    if(error)throw error;if(!row)fail("COD settlement not found.",404);
    if(!["awaiting_logistics_transfer","logistics_receipt_rejected"].includes(row.status))fail("This COD transfer is not awaiting a receipt.",409);
    const {bytes,contentType,ext}=await receiptContent(req),now=new Date().toISOString();
    const objectPath="cod-settlements/"+id+"/logistics/"+crypto.randomUUID().replaceAll("-","")+"."+ext;
    const {error:uploadError}=await db.storage.from("payment-receipts").upload(objectPath,bytes,{contentType,upsert:false});
    if(uploadError)throw uploadError;
    const {data:updated,error:updateError}=await db.from("CODSettlement").update({logisticsTransferReceiptPath:objectPath,status:"awaiting_admin_logistics_confirmation","logisticsTransferredAt":now,updatedAt:now,adminNotes:null}).eq("id",id).select("*").single();
    if(updateError){await db.storage.from("payment-receipts").remove([objectPath]);throw updateError;}
    return reply(updated,200,origin);
  }
  if(path==="/admin/cod-settlements" && method==="GET") {
    await requireRole(req,["SUPER_ADMIN"]);
    const {data,error}=await db.from("CODSettlement").select("*").order("createdAt",{ascending:false}).limit(200);
    if(error)throw error;
    return reply(await Promise.all((data??[]).map(settlementDetails)),200,origin);
  }
  if(path==="/admin/payout-settings" && method==="GET") {
    await requireRole(req,["SUPER_ADMIN"]);
    const {data,error}=await db.from("MarketplacePayoutSettings").select("*").eq("id","default").single();
    if(error)throw error;return reply(data,200,origin);
  }
  if(path==="/admin/payout-settings" && method==="PATCH") {
    await requireRole(req,["SUPER_ADMIN"]);
    const b=z.object({bankName:z.string().trim().min(2).max(100),accountName:z.string().trim().min(2).max(120),accountNumber:z.string().trim().regex(/^\d{10}$/)}).strict().parse(await bodyJson(req));
    const {data,error}=await db.from("MarketplacePayoutSettings").upsert({id:"default",...b,updatedAt:new Date().toISOString()}).select("*").single();
    if(error)throw error;return reply(data,200,origin);
  }
  const adminSettlementReceipt=path.match(/^\/admin\/cod-settlements\/([^/]+)\/logistics-receipt$/);
  if(adminSettlementReceipt && method==="GET") {
    await requireRole(req,["SUPER_ADMIN"]);const id=decodeURIComponent(adminSettlementReceipt[1]);
    const {data:row,error}=await db.from("CODSettlement").select("logisticsTransferReceiptPath").eq("id",id).maybeSingle();
    if(error)throw error;if(!row?.logisticsTransferReceiptPath)fail("Logistics transfer receipt not found.",404);
    const {data,error:signedError}=await db.storage.from("payment-receipts").createSignedUrl(row.logisticsTransferReceiptPath,300);
    if(signedError||!data?.signedUrl)throw signedError??new Error("Could not create receipt link.");
    return reply({url:data.signedUrl,expiresIn:300},200,origin);
  }
  const adminSettlementDecision=path.match(/^\/admin\/cod-settlements\/([^/]+)\/logistics-confirmation$/);
  if(adminSettlementDecision && method==="PATCH") {
    await requireRole(req,["SUPER_ADMIN"]);const id=decodeURIComponent(adminSettlementDecision[1]);
    const b=z.object({decision:z.enum(["confirm","reject"]),notes:z.string().trim().max(1000).optional()}).strict().parse(await bodyJson(req));
    const {data:row,error}=await db.from("CODSettlement").select("*").eq("id",id).maybeSingle();
    if(error)throw error;if(!row)fail("COD settlement not found.",404);
    if(row.status!=="awaiting_admin_logistics_confirmation")fail("This Logistics receipt is not awaiting Admin confirmation.",409);
    if(b.decision==="reject"&&!b.notes)fail("Add a reason before rejecting the receipt.",400);
    const now=new Date().toISOString();
    const {data:updated,error:updateError}=await db.from("CODSettlement").update({status:b.decision==="confirm"?"awaiting_seller_payout":"logistics_receipt_rejected",logisticsConfirmedAt:b.decision==="confirm"?now:null,adminNotes:b.notes??null,updatedAt:now}).eq("id",id).select("*").single();
    if(updateError)throw updateError;return reply(await settlementDetails(updated),200,origin);
  }
  const adminSellerReceipt=path.match(/^\/admin\/cod-settlements\/([^/]+)\/seller-receipt$/);
  if(adminSellerReceipt && method==="POST") {
    await requireRole(req,["SUPER_ADMIN"]);const id=decodeURIComponent(adminSellerReceipt[1]);
    const {data:row,error}=await db.from("CODSettlement").select("*").eq("id",id).maybeSingle();
    if(error)throw error;if(!row)fail("COD settlement not found.",404);
    if(row.status!=="awaiting_seller_payout" && row.status!=="seller_receipt_rejected")fail("Seller payout cannot be uploaded at this stage.",409);
    const {bytes,contentType,ext}=await receiptContent(req),now=new Date().toISOString();
    const objectPath="cod-settlements/"+id+"/seller/"+crypto.randomUUID().replaceAll("-","")+"."+ext;
    const {error:uploadError}=await db.storage.from("payment-receipts").upload(objectPath,bytes,{contentType,upsert:false});
    if(uploadError)throw uploadError;
    const {data:updated,error:updateError}=await db.from("CODSettlement").update({sellerTransferReceiptPath:objectPath,status:"awaiting_seller_confirmation",sellerTransferredAt:now,updatedAt:now,adminNotes:null}).eq("id",id).select("*").single();
    if(updateError){await db.storage.from("payment-receipts").remove([objectPath]);throw updateError;}
    return reply(await settlementDetails(updated),200,origin);
  }
  const sellerSettlementReceipt=path.match(/^\/seller\/cod-settlements\/([^/]+)\/receipt$/);
  if(sellerSettlementReceipt && method==="GET") {
    const auth=await requireRole(req,["SELLER"]);const id=decodeURIComponent(sellerSettlementReceipt[1]);
    const {data:row,error}=await db.from("CODSettlement").select("sellerTransferReceiptPath").eq("id",id).eq("sellerId",auth.user.id).maybeSingle();
    if(error)throw error;if(!row?.sellerTransferReceiptPath)fail("Seller transfer receipt not found.",404);
    const {data,error:signedError}=await db.storage.from("payment-receipts").createSignedUrl(row.sellerTransferReceiptPath,300);
    if(signedError||!data?.signedUrl)throw signedError??new Error("Could not create receipt link.");
    return reply({url:data.signedUrl,expiresIn:300},200,origin);
  }
  if(path==="/seller/cod-settlements" && method==="GET") {
    const auth=await requireRole(req,["SELLER"]);
    // Seller sees only the payout stages that require or confirm seller action.
    // Logistics-to-marketplace remittance is an internal Logistics/Admin workflow.
    const {data,error}=await db.from("CODSettlement").select("*").eq("sellerId",auth.user.id).in("status",["awaiting_seller_payout","seller_receipt_rejected","awaiting_seller_confirmation","completed"]).order("createdAt",{ascending:false}).limit(100);
    if(error)throw error;return reply(await Promise.all((data??[]).map(settlementDetails)),200,origin);
  }
  if(path==="/seller/payout-account" && method==="PATCH") {
    const auth=await requireRole(req,["SELLER"]);
    const b=z.object({bankName:z.string().trim().min(2).max(100),accountName:z.string().trim().min(2).max(120),accountNumber:z.string().trim().regex(/^\d{10}$/)}).strict().parse(await bodyJson(req));
    const {data,error}=await db.from("User").update({payoutBankName:b.bankName,payoutAccountName:b.accountName,payoutAccountNumber:b.accountNumber,updatedAt:new Date().toISOString()}).eq("id",auth.user.id).select("payoutBankName,payoutAccountName,payoutAccountNumber").single();
    if(error)throw error;return reply(data,200,origin);
  }
  const sellerSettlementAccept=path.match(/^\/seller\/cod-settlements\/([^/]+)\/accept$/);
  if(sellerSettlementAccept && method==="POST") {
    const auth=await requireRole(req,["SELLER"]);const id=decodeURIComponent(sellerSettlementAccept[1]);
    const {data:row,error}=await db.from("CODSettlement").select("*").eq("id",id).eq("sellerId",auth.user.id).maybeSingle();
    if(error)throw error;if(!row)fail("COD settlement not found.",404);
    if(row.status!=="awaiting_seller_confirmation")fail("There is no seller transfer awaiting your acceptance.",409);
    const now=new Date().toISOString();
    const {data:updated,error:updateError}=await db.from("CODSettlement").update({status:"completed",sellerAcceptedAt:now,updatedAt:now}).eq("id",id).select("*").single();
    if(updateError)throw updateError;return reply(await settlementDetails(updated),200,origin);
  }

  const transferPayoutDetails=async(row:any)=>{
    const [{data:order,error:orderError},{data:seller,error:sellerError}]=await Promise.all([
      db.from("Order").select("id,orderNumber,subtotal,totalAmount,paymentMethod,items:OrderItem(productSnapshot,quantity,unitPrice)").eq("id",row.orderId).single(),
      db.from("User").select("id,fullName,businessName,phone,payoutBankName,payoutAccountName,payoutAccountNumber").eq("id",row.sellerId).single()
    ]);
    if(orderError)throw orderError;if(sellerError)throw sellerError;return {...row,order,seller};
  };
  if(path==="/admin/transfer-payouts" && method==="GET") {
    await requireRole(req,["SUPER_ADMIN"]);const {data,error}=await db.from("TransferPayout").select("*").order("createdAt",{ascending:false}).limit(200);
    if(error)throw error;return reply(await Promise.all((data??[]).map(transferPayoutDetails)),200,origin);
  }
  if(path==="/seller/transfer-payouts" && method==="GET") {
    const auth=await requireRole(req,["SELLER"]);const {data,error}=await db.from("TransferPayout").select("*").eq("sellerId",auth.user.id).order("createdAt",{ascending:false}).limit(100);
    if(error)throw error;return reply(await Promise.all((data??[]).map(transferPayoutDetails)),200,origin);
  }
  const adminTransferReceipt=path.match(/^\/admin\/transfer-payouts\/([^/]+)\/receipt$/);
  if(adminTransferReceipt && method==="POST") {
    await requireRole(req,["SUPER_ADMIN"]);const id=decodeURIComponent(adminTransferReceipt[1]);
    const {data:row,error}=await db.from("TransferPayout").select("*").eq("id",id).maybeSingle();
    if(error)throw error;if(!row)fail("Transfer payout not found.",404);
    if(!["awaiting_admin_payout","seller_receipt_rejected"].includes(row.status))fail("This seller payout is not awaiting an Admin transfer receipt.",409);
    const {bytes,contentType,ext}=await receiptContent(req),now=new Date().toISOString(),objectPath="transfer-payouts/"+id+"/seller/"+crypto.randomUUID().replaceAll("-","")+"."+ext;
    const {error:uploadError}=await db.storage.from("payment-receipts").upload(objectPath,bytes,{contentType,upsert:false});if(uploadError)throw uploadError;
    const {data:updated,error:updateError}=await db.from("TransferPayout").update({sellerTransferReceiptPath:objectPath,status:"awaiting_seller_confirmation",sellerTransferredAt:now,updatedAt:now,adminNotes:null}).eq("id",id).select("*").single();
    if(updateError){await db.storage.from("payment-receipts").remove([objectPath]);throw updateError;}return reply(await transferPayoutDetails(updated),200,origin);
  }
  const adminTransferReceiptView=path.match(/^\/admin\/transfer-payouts\/([^/]+)\/receipt$/);
  if(adminTransferReceiptView && method==="GET") {
    await requireRole(req,["SUPER_ADMIN"]);const id=decodeURIComponent(adminTransferReceiptView[1]);
    const {data:row,error}=await db.from("TransferPayout").select("sellerTransferReceiptPath").eq("id",id).maybeSingle();
    if(error)throw error;if(!row?.sellerTransferReceiptPath)fail("Seller transfer receipt not found.",404);
    const {data,error:signedError}=await db.storage.from("payment-receipts").createSignedUrl(row.sellerTransferReceiptPath,300);
    if(signedError||!data?.signedUrl)throw signedError??new Error("Could not create receipt link.");return reply({url:data.signedUrl,expiresIn:300},200,origin);
  }
  const sellerTransferReceiptView=path.match(/^\/seller\/transfer-payouts\/([^/]+)\/receipt$/);
  if(sellerTransferReceiptView && method==="GET") {
    const auth=await requireRole(req,["SELLER"]);const id=decodeURIComponent(sellerTransferReceiptView[1]);
    const {data:row,error}=await db.from("TransferPayout").select("sellerTransferReceiptPath").eq("id",id).eq("sellerId",auth.user.id).maybeSingle();
    if(error)throw error;if(!row?.sellerTransferReceiptPath)fail("Seller transfer receipt not found.",404);
    const {data,error:signedError}=await db.storage.from("payment-receipts").createSignedUrl(row.sellerTransferReceiptPath,300);
    if(signedError||!data?.signedUrl)throw signedError??new Error("Could not create receipt link.");return reply({url:data.signedUrl,expiresIn:300},200,origin);
  }
  const sellerTransferAccept=path.match(/^\/seller\/transfer-payouts\/([^/]+)\/accept$/);
  if(sellerTransferAccept && method==="POST") {
    const auth=await requireRole(req,["SELLER"]);const id=decodeURIComponent(sellerTransferAccept[1]);
    const {data:row,error}=await db.from("TransferPayout").select("*").eq("id",id).eq("sellerId",auth.user.id).maybeSingle();
    if(error)throw error;if(!row)fail("Transfer payout not found.",404);
    if(row.status!=="awaiting_seller_confirmation")fail("There is no Bank Transfer payout awaiting your confirmation.",409);
    const now=new Date().toISOString(),{data:updated,error:updateError}=await db.from("TransferPayout").update({status:"completed",sellerAcceptedAt:now,updatedAt:now}).eq("id",id).select("*").single();
    if(updateError)throw updateError;return reply(await transferPayoutDetails(updated),200,origin);
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
  const orderIdMatch=path.match(/^\/orders\/([^/]+)$/);
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
  const apiKey = req.headers.get("apikey");
  if (!apiKey || !configuredPublishableKeys.has(apiKey)) return reply({error:"A valid Supabase publishable key is required."},401,origin);
  if (["POST","PUT","PATCH","DELETE"].includes(req.method) && origin && !allowedOrigins.has(origin)) return reply({error:"Request origin is not allowed."},403,origin);
  try { return await dispatch(req,origin); }
  catch (error) {
    if (error instanceof z.ZodError) {
      return reply({error:error.issues[0]?.message ?? "Invalid request."},400,origin);
    }
    const status = Number((error as any)?.status ?? ((error as any)?.code === "23505" ? 409 : 500));
    const message = status >= 500 ? "The service could not complete this request." : String((error as Error)?.message ?? "Request failed.");
    if (status >= 500) console.error("Edge API error:",error);
    return reply({error:message},status,origin);
  }
});
