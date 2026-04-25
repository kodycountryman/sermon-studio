// ─── SERMON STUDIO UTILITIES ─────────────────────────────────────────────────
// Storage shim, text helpers, and parsing functions.
// In Vite/npm builds, npm packages are imported directly.
// In legacy CDN mode, window.supabase / window.firebase are used as fallback.

import { createClient } from '@supabase/supabase-js';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker?url';

// ─── PDF.js worker setup ──────────────────────────────────────────────────────
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;
window.pdfjsLib = pdfjsLib; // app.jsx uses window.pdfjsLib

// ─── SUPABASE CLIENT ─────────────────────────────────────────────────────────
const SUPABASE_URL  = "https://vpkbabjvjkiyvowdboul.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwa2JhYmp2amtpeXZvd2Rib3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNDQxNjYsImV4cCI6MjA5MDkyMDE2Nn0.50PU9TJIsn5LOFnZKCvo2EC3qSsz7zW43IQyJnU4Q68";
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─── CLOUD SERMON HISTORY ─────────────────────────────────────────────────────
window.cloudHistory = {
  save: async (item) => {
    if (!sb) return null;
    try {
      const { error } = await sb.from("sermon_history").upsert({
        id: item.id,
        timestamp: item.timestamp,
        mode_id: item.modeId,
        mode_label: item.modeLabel,
        title: item.title,
        input: item.input,
        output: item.output,
        length: item.length || null,
      });
      if (error) console.warn("Supabase save error:", error.message);
    } catch(e) { console.warn("Supabase save failed:", e.message); }
  },
  load: async () => {
    if (!sb) return [];
    try {
      const { data, error } = await sb.from("sermon_history")
        .select("*").order("timestamp", { ascending: false }).limit(200);
      if (error) { console.warn("Supabase load error:", error.message); return []; }
      return (data || []).map(r => ({
        id: r.id, timestamp: r.timestamp, modeId: r.mode_id, modeLabel: r.mode_label,
        title: r.title, input: r.input, output: r.output, length: r.length,
      }));
    } catch(e) { console.warn("Supabase load failed:", e.message); return []; }
  },
  delete: async (id) => {
    if (!sb) return;
    try {
      const { error } = await sb.from("sermon_history").delete().eq("id", id);
      if (error) console.warn("Supabase delete error:", error.message);
    } catch(e) { console.warn("Supabase delete failed:", e.message); }
  },
};

// ─── CLOUD STORIES ────────────────────────────────────────────────────────────
window.cloudStories = {
  save: async (story) => {
    if (!sb) return;
    try {
      await sb.from("sermon_stories").upsert({
        id: story.id, title: story.title, story_text: story.text, tags: story.tags || [],
      });
    } catch(e) { console.warn("Supabase story save failed:", e.message); }
  },
  load: async () => {
    if (!sb) return [];
    try {
      const { data, error } = await sb.from("sermon_stories").select("*").order("created_at", { ascending: false });
      if (error) return [];
      return (data || []).map(r => ({ id: r.id, title: r.title, text: r.story_text, tags: r.tags || [] }));
    } catch(e) { return []; }
  },
  delete: async (id) => {
    if (!sb) return;
    try { await sb.from("sermon_stories").delete().eq("id", id); } catch(e) {}
  },
};

// ─── CLOUD VOICE PROFILE ─────────────────────────────────────────────────────
window.cloudVoiceProfile = {
  save: async (profile) => {
    if (!sb) return;
    try {
      await sb.from("sermon_voice_profile").upsert({
        id: "kody",
        profile_json: JSON.stringify(profile),
        sermon_count: profile.sermonCount || 0,
        updated_at: new Date().toISOString(),
      });
    } catch(e) { console.warn("Supabase voice profile save failed:", e.message); }
  },
  load: async () => {
    if (!sb) return null;
    try {
      const { data, error } = await sb.from("sermon_voice_profile").select("*").eq("id", "kody").single();
      if (error || !data) return null;
      return JSON.parse(data.profile_json);
    } catch(e) { console.warn("Supabase voice profile load failed:", e.message); return null; }
  },
};

// ─── PERSISTENT STORAGE (localStorage-backed for device settings) ─────────────
window.storage = {
  get: async (key) => {
    try {
      const val = localStorage.getItem('sermon_' + key);
      return val !== null ? { key, value: val } : null;
    } catch(e) { return null; }
  },
  set: async (key, value) => {
    try {
      localStorage.setItem('sermon_' + key, value);
      return { key, value };
    } catch(e) { return null; }
  },
  delete: async (key) => {
    try {
      localStorage.removeItem('sermon_' + key);
      return { key, deleted: true };
    } catch(e) { return null; }
  },
  list: async (prefix) => {
    try {
      const keys = Object.keys(localStorage)
        .filter(k => k.startsWith('sermon_' + (prefix||'')))
        .map(k => k.replace('sermon_', ''));
      return { keys };
    } catch(e) { return { keys: [] }; }
  }
};

// ─── TEXT HELPERS ─────────────────────────────────────────────────────────────
function countWords(text) {
  if (!text) return 0;
  const stripped = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!stripped) return 0;
  return stripped.split(" ").length;
}

function stripTags(text) {
  if (!text) return "";
  return text
    .replace(/<HEADER>([\s\S]*?)<\/HEADER>/g, "\n\n$1\n")
    .replace(/<SCREEN>([\s\S]*?)<\/SCREEN>/g, "\n$1\n")
    .replace(/<(BOLD|ITALIC|ONELINER|STORY|SUMMARY|JOKE|EXAMPLE)>([\s\S]*?)<\/\1>/g, "$2")
    .replace(/<SCRIPTURE(?:\s+ref="[^"]*")?>([\s\S]*?)<\/SCRIPTURE>/g, "$1")
    .replace(/<[^>]+>/g, "").replace(/\n{3,}/g, "\n\n").trim();
}

function extractTitle(input, modeId) {
  const first = (input || "").split("\n").filter(l => l.trim())[0]?.slice(0, 60) || "Untitled";
  const labels = { outline:"Outline", manuscript:"Manuscript", illustration:"Illustrations", theology:"Study", idea:"Idea" };
  return `${labels[modeId] || modeId}: ${first}`;
}

const esc = s => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

function parseLineToHtml(str) {
  const rx = /<(BOLD|ITALIC|SCRIPTURE|ONELINER|SCREEN|HEADER|STORY|SUMMARY|JOKE|EXAMPLE|CLOSING)(?:\s+ref="[^"]*")?>([\s\S]*?)<\/\1>/g;
  let result = "", last = 0, m;
  while ((m = rx.exec(str)) !== null) {
    if (m.index > last) result += esc(str.slice(last, m.index));
    const [, tag, content] = m;
    // Kody's color coding system:
    if (tag === "SCREEN")         result += `<span style="font-weight:700;text-decoration:underline;background:#ffe066;color:#000;padding:1px 3px;">${esc(content)}</span>`;       // Yellow highlight + bold + underline = slide point
    else if (tag === "HEADER")    result += `<div style="font-weight:700;text-decoration:underline;background:#ffe066;color:#000;padding:2px 4px;margin:20px 0 8px;font-size:12pt;display:inline-block;">${esc(content)}</div>`;
    else if (tag === "ONELINER")  result += `<strong style="font-weight:700;text-decoration:underline;background:#ffe066;color:#000;padding:1px 3px;">${esc(content)}</strong>`;   // Yellow highlight + bold + underline
    else if (tag === "BOLD")      result += `<strong>${esc(content)}</strong>`;                                                                                                     // Bold = point to hit
    else if (tag === "ITALIC")    result += `<em>${esc(content)}</em>`;
    else if (tag === "SCRIPTURE") result += `<span style="color:#cc0000;font-style:italic;">${esc(content)}</span>`;                                                                // Red italic = scripture
    else if (tag === "STORY")     result += `<span style="color:#00b4d8;">${esc(content)}</span>`;                                                                                  // Aqua blue = story/illustration
    else if (tag === "SUMMARY")   result += `<span style="color:#2d9b2d;">${esc(content)}</span>`;                                                                                  // Green = breakdown/summary of scripture
    else if (tag === "EXAMPLE")   result += `<span style="color:#7b2fbe;">${esc(content)}</span>`;                                                                                  // Purple = examples
    else if (tag === "JOKE")      result += `<span style="color:#00b4d8;">${esc(content)}</span>`;                                                                                  // Aqua blue (same as story)
    else if (tag === "CLOSING")   result += `<span style="color:#e67e00;">${esc(content)}</span>`;                                                                                  // Orange = closing
    last = m.index + m[0].length;
  }
  if (last < str.length) result += esc(str.slice(last));
  return result;
}

function rawToHtml(text) {
  if (!text) return "";
  // First, resolve multi-line tags by collapsing them into per-line tags.
  // e.g. <STORY>\nline1\nline2\n</STORY> → <STORY>line1</STORY>\n<STORY>line2</STORY>
  const multiRx = /<(BOLD|ITALIC|SCRIPTURE|ONELINER|SCREEN|HEADER|STORY|SUMMARY|JOKE|EXAMPLE|CLOSING)(?:\s+ref="([^"]*)")?>([\s\S]*?)<\/\1>/g;
  let resolved = text.replace(multiRx, (match, tag, ref, content) => {
    // If content spans multiple lines, wrap each line in its own tag
    const refAttr = ref ? ` ref="${ref}"` : "";
    return content.split("\n").map(line =>
      line.trim() ? `<${tag}${refAttr}>${line}</${tag}>` : ""
    ).join("\n");
  });
  // Also handle orphaned opening tags (AI sometimes outputs <STORY> on its own line)
  // Remove standalone opening/closing tags that have no content
  resolved = resolved.replace(/^<(BOLD|ITALIC|SCRIPTURE|ONELINER|SCREEN|HEADER|STORY|SUMMARY|JOKE|EXAMPLE|CLOSING)>\s*$/gm, "");
  resolved = resolved.replace(/^<\/(BOLD|ITALIC|SCRIPTURE|ONELINER|SCREEN|HEADER|STORY|SUMMARY|JOKE|EXAMPLE|CLOSING)>\s*$/gm, "");
  // Handle case where opening tag is alone on a line: apply tag to ALL following lines until closing tag
  const tags = ["BOLD","ITALIC","SCRIPTURE","ONELINER","SCREEN","HEADER","STORY","SUMMARY","JOKE","EXAMPLE","CLOSING"];
  for (const tag of tags) {
    const openRx = new RegExp(`^<${tag}>\\s*$`, "m");
    const closeRx = new RegExp(`^<\\/${tag}>\\s*$`, "m");
    let safety = 0;
    while (openRx.test(resolved) && closeRx.test(resolved) && safety++ < 20) {
      const openIdx = resolved.search(openRx);
      const closeIdx = resolved.search(closeRx);
      if (openIdx === -1 || closeIdx === -1 || closeIdx <= openIdx) break;
      const before = resolved.slice(0, openIdx);
      const between = resolved.slice(openIdx, closeIdx).replace(openRx, "");
      const after = resolved.slice(closeIdx).replace(closeRx, "");
      const tagged = between.split("\n").map(line =>
        line.trim() ? `<${tag}>${line}</${tag}>` : ""
      ).join("\n");
      resolved = before + tagged + after;
    }
  }
  return resolved.split("\n").map(line =>
    `<div style="margin:0 0 8px;padding:0;line-height:1.55;font-family:Arial,sans-serif;font-size:12pt;color:#111;">${parseLineToHtml(line) || "<br>"}</div>`
  ).join("");
}

// ─── AI PROVIDER (Cloudflare Worker Proxy) ───────────────────────────────────
// All AI requests go through /api/ai — API keys are stored as Cloudflare secrets.
// No API keys in the browser.

async function callAI({ system, messages, maxTokens = 4000, model = null }) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: system || undefined,
      messages: (messages || []).map(m => ({ role: m.role, content: m.content })),
      maxTokens,
      model: model || undefined,
      stream: false,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || data.error);
  if (!data.content || !data.content[0]) throw new Error("No response received.");
  return data.content[0].text || "";
}

// Streaming version — calls onChunk(textDelta) as text arrives, returns full text
async function callAIStream({ system, messages, maxTokens = 4000, model = null, onChunk, signal }) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: system || undefined,
      messages: (messages || []).map(m => ({ role: m.role, content: m.content })),
      maxTokens,
      model: model || undefined,
      stream: true,
    }),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Stream request failed." }));
    throw new Error(err.error?.message || err.error || "Stream error.");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") continue;
      try {
        const evt = JSON.parse(payload);
        // Anthropic streaming events
        if (evt.type === "content_block_delta" && evt.delta?.text) {
          full += evt.delta.text;
          if (onChunk) onChunk(evt.delta.text);
        }
      } catch { /* skip unparseable lines */ }
    }
  }
  return full;
}

// ─── FIREBASE CLIENT ─────────────────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCIYOKdo5MwSY8H7cCrk5OfyfOI2vL4e1E",
  authDomain: "sermon-studio-f06c2.firebaseapp.com",
  projectId: "sermon-studio-f06c2",
  storageBucket: "sermon-studio-f06c2.firebasestorage.app",
  messagingSenderId: "287738824362",
  appId: "1:287738824362:web:85fb5d22120c513dfaf2d3",
};
// Initialize Firebase (firebase/compat allows the existing API style)
const fbApp = firebase.apps.length === 0
  ? firebase.initializeApp(FIREBASE_CONFIG)
  : firebase.apps[0];
const db = firebase.firestore();

// ─── CLOUD PROJECTS (Firebase Firestore) ─────────────────────────────────────
window.cloudProjects = {
  save: async (project) => {
    if (!db) return;
    try {
      await db.collection("sermon_projects").doc(project.id).set({
        id: project.id,
        title: project.title || "Untitled",
        content: project.content || "",
        sourceType: project.sourceType || "manual",
        sourceFile: project.sourceFile || null,
        analysisJson: project.analysisJson || null,
        coachMessages: project.coachMessages || [],
        createdAt: project.createdAt || firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch(e) { console.warn("Firebase project save failed:", e.message); }
  },
  load: async () => {
    if (!db) return [];
    try {
      const snap = await db.collection("sermon_projects").orderBy("updatedAt", "desc").limit(50).get();
      return snap.docs.map(d => d.data());
    } catch(e) { console.warn("Firebase projects load failed:", e.message); return []; }
  },
  get: async (id) => {
    if (!db) return null;
    try {
      const doc = await db.collection("sermon_projects").doc(id).get();
      return doc.exists ? doc.data() : null;
    } catch(e) { console.warn("Firebase project get failed:", e.message); return null; }
  },
  delete: async (id) => {
    if (!db) return;
    try { await db.collection("sermon_projects").doc(id).delete(); }
    catch(e) { console.warn("Firebase project delete failed:", e.message); }
  },
  updateMessages: async (id, messages) => {
    if (!db) return;
    try {
      await db.collection("sermon_projects").doc(id).update({
        coachMessages: messages,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch(e) { console.warn("Firebase messages update failed:", e.message); }
  },
  updateContent: async (id, content) => {
    if (!db) return;
    try {
      await db.collection("sermon_projects").doc(id).update({
        content,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch(e) { console.warn("Firebase content update failed:", e.message); }
  },
};

// ─── THEOLOGY SECTION PARSER ─────────────────────────────────────────────────
function parseTheoSections(text, secs) {
  const out = {}; let key = "overview", lines = [];
  (text || "").split("\n").forEach(line => {
    const found = secs.find(s => s.marker && line.includes(s.marker));
    if (found) { if (lines.length) out[key] = lines.join("\n").trim(); key = found.key; lines = []; }
    else lines.push(line);
  });
  if (lines.length) out[key] = lines.join("\n").trim();
  return out;
}

// ─── ES MODULE COMPAT ─────────────────────────────────────────────────────────
// When loaded as an ES module via Vite, function declarations are module-scoped.
// Assigning to window makes them accessible to app.jsx without explicit imports.
if (typeof window !== 'undefined') {
  Object.assign(window, {
    stripTags, rawToHtml, callAI, callAIStream,
    countWords, extractTitle, parseTheoSections, esc, parseLineToHtml,
  });
}
