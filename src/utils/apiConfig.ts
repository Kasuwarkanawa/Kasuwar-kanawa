const viteEnv = (import.meta as ImportMeta & { env?: { VITE_API_URL?: string; VITE_SUPABASE_ANON_KEY?: string; DEV?: boolean } }).env;

export const API_BASE_URL = (
  viteEnv?.VITE_API_URL?.trim() ||
  (viteEnv?.DEV
    ? "http://localhost:4000/api"
    : "https://efirbpzfimzmpchsovbz.supabase.co/functions/v1/api")
).replace(/\/$/, "");

// This is the public Supabase publishable key. It is safe to ship in browser code;
// the service-role key is never exposed to the frontend.
export const SUPABASE_PUBLIC_KEY =
  viteEnv?.VITE_SUPABASE_ANON_KEY?.trim() ||
  "sb_publishable_Z5Dj-_1weCpFUi1aNeyigg_uaEDIuVr";
