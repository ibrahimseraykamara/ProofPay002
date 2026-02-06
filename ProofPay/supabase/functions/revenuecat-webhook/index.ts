import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RC_WEBHOOK_SECRET = Deno.env.get("RC_WEBHOOK_SECRET") ?? "";
const RC_ENTITLEMENT_ID = Deno.env.get("RC_ENTITLEMENT_ID") ?? "pro";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type RevenueCatEvent = {
  app_user_id?: string;
  event?: {
    type?: string;
    app_user_id?: string;
    entitlements?: Record<string, { expires_date?: string | null }>;
    expiration_at_ms?: number | null;
  };
  subscriber?: {
    entitlements?: Record<string, { expires_date?: string | null }>;
  };
};

const isAuthorized = (req: Request) => {
  if (!RC_WEBHOOK_SECRET) return true;
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${RC_WEBHOOK_SECRET}`;
};

const resolveAppUserId = (payload: RevenueCatEvent) => {
  return payload.event?.app_user_id ?? payload.app_user_id ?? "";
};

const isEntitled = (payload: RevenueCatEvent) => {
  const entitlements =
    payload.event?.entitlements ?? payload.subscriber?.entitlements ?? {};
  const entitlement = entitlements[RC_ENTITLEMENT_ID];
  if (!entitlement) return false;
  if (!entitlement.expires_date) return true;
  const expiresAt = Date.parse(entitlement.expires_date);
  return Number.isNaN(expiresAt) ? false : expiresAt > Date.now();
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!isAuthorized(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: RevenueCatEvent;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const userId = resolveAppUserId(payload);
  if (!userId) {
    return new Response("Missing app_user_id", { status: 400 });
  }

  const pro = isEntitled(payload);
  const { error } = await supabase
    .from("profiles")
    .update({ plan: pro ? "pro" : "free" })
    .eq("id", userId);

  if (error) {
    return new Response(`Update failed: ${error.message}`, { status: 500 });
  }

  return new Response("OK", { status: 200 });
});
