// Cloudflare Pages Function — PIN Validation
// PIN stored as Cloudflare secret, never exposed to client.

const attempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW = 60_000;

function checkAttempts(ip) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now - entry.start > WINDOW) {
    attempts.set(ip, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  return entry.count <= MAX_ATTEMPTS;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const ip = request.headers.get("cf-connecting-ip") || "unknown";

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (!checkAttempts(ip)) {
    return new Response(JSON.stringify({ valid: false, error: "Too many attempts. Try again in a minute." }), {
      status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const pin = env.AUTH_PIN;
  if (!pin) {
    return new Response(JSON.stringify({ valid: false, error: "Server configuration error." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ valid: false }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const valid = body.pin === pin;
  return new Response(JSON.stringify({ valid }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
