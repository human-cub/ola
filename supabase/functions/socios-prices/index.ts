// socios-prices — wholesale catalog (con buy_price) SOLO para socios autenticados.
// Vive en ola-app (puede validar la sesion del usuario, cosa que pim-pum no puede).
// Comprueba rol 'mayorista'/'admin' y, si pasa, pide el catalogo a pim-pum
// catalog-products con el secreto server-to-server (que incluye buy_price).
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const CATALOG_PRODUCTS_URL = "https://bqbywleogtdelcmpmnny.supabase.co/functions/v1/catalog-products";
const WHOLESALE_SECRET = "c13506777cc23ac6d36afa3e6021793f95d8c07695658a72";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json(401, { error: "auth required", products: [] });

    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json(401, { error: "auth required", products: [] });

    const svc = createClient(url, service, { auth: { persistSession: false } });
    const { data: roles } = await svc.from("user_roles").select("role").eq("user_id", user.id);
    const allowed = (roles ?? []).some((r: { role: string }) => r.role === "mayorista" || r.role === "admin");
    if (!allowed) return json(403, { error: "mayorista access required", products: [] });

    const r = await fetch(CATALOG_PRODUCTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-wholesale-secret": WHOLESALE_SECRET },
      body: "{}",
    });
    const data = await r.json().catch(() => ({ products: [] }));
    return new Response(JSON.stringify(data), { headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : String(e), products: [] });
  }
});
