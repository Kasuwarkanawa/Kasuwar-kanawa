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
