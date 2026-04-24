// Cloudflare Pages Function — AI API Proxy
// Keeps API keys server-side. Supports both standard and streaming responses.

// Simple in-memory rate limiter (per-isolate, resets on cold start)
const rateLimiter = new Map();
const RATE_LIMIT = 60; // requests per minute
const RATE_WINDOW = 60_000;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimiter.get(ip);
  if (!entry || now - entry.start > RATE_WINDOW) {
    rateLimiter.set(ip, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const ip = request.headers.get("cf-connecting-ip") || "unknown";

  // CORS
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again in a minute." }), {
      status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Server configuration error: no API key." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { system, messages, maxTokens = 4000, model, stream = false } = body;
  const resolvedModel = model || "claude-sonnet-4-6";

  const anthropicBody = {
    model: resolvedModel,
    max_tokens: Math.min(maxTokens, 16000),
    stream,
    messages: (messages || []).map(m => ({ role: m.role, content: m.content })),
  };
  if (system) anthropicBody.system = system;

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(anthropicBody),
    });

    if (stream) {
      // Pipe SSE stream directly back to the client
      return new Response(upstream.body, {
        status: upstream.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // Non-streaming: parse and return
    const data = await upstream.json();
    return new Response(JSON.stringify(data), {
      status: upstream.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || "Upstream API error." }), {
      status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
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
