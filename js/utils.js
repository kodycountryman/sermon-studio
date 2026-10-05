// ─── SERMON STUDIO UTILITIES ─────────────────────────────────────────────────
// Storage shim, text helpers, and parsing functions.
// In Vite/npm builds, npm packages are imported directly.
// In legacy CDN mode, window.supabase / window.firebase are used as fallback.

import { createClient } from '@supabase/supabase-js';
import { createSermonStorage } from './sermon-storage.js';
import { createManuscriptCloud } from './sermon-cloud.js';
import { createPersonalLibrary } from './personal-library.js';
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
        .select("*").not("mode_id", "in", "(saved-sermon,saved-sermon-version,preparation-library,preparation-library-version)").order("timestamp", { ascending: false }).limit(200);
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
        id: story.id, title: story.title, story_text: story.text || story.content, tags: Array.isArray(story.tags)?story.tags:(story.tags || "").split(",").map(tag=>tag.trim()).filter(Boolean),
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

// Collapse multi-line / orphaned formatting tags into clean per-line tags so
// parseLineToHtml can render one line at a time. Shared by rawToHtml + cadenceToHtml.
function resolveFormatTags(text) {
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
  return resolved;
}

const MANUSCRIPT_LINE_STYLE = "margin:0 0 8px;padding:0;line-height:1.55;font-family:Arial,sans-serif;font-size:12pt;color:#111;";

function rawToHtml(text) {
  if (!text) return "";
  return resolveFormatTags(text).split("\n").map(line =>
    `<div style="${MANUSCRIPT_LINE_STYLE}">${parseLineToHtml(line) || "<br>"}</div>`
  ).join("");
}

// Like rawToHtml, but tuned for the coach's short-line preacher cadence: a SINGLE
// newline becomes a soft <br> (tight, no paragraph gap), and a blank line starts a
// new paragraph <div>. Keeps applied rewrites from ballooning into "crazy line
// breaks" while still honoring formatting tags and beat spacing.
function cadenceToHtml(text) {
  if (!text) return "";
  const resolved = resolveFormatTags(text.replace(/\r/g, ""));
  // Split into paragraphs on one-or-more blank lines.
  const paragraphs = resolved.split(/\n[ \t]*\n+/);
  return paragraphs.map(p => {
    const inner = p.split("\n")
      .map(line => parseLineToHtml(line))
      .join("<br>");
    return `<div style="${MANUSCRIPT_LINE_STYLE}">${inner || "<br>"}</div>`;
  }).join("");
}

// Inverse of parseLineToHtml: turn the editor's inline-styled HTML back into the
// app's formatting-tag vocabulary so the AI coach can SEE what is scripture vs
// header vs prose (and re-tag its rewrites to preserve formatting).
function htmlToTags(html) {
  if (!html) return "";
  if (typeof document === "undefined") return html;
  const root = document.createElement("div");
  root.innerHTML = html;

  // Map a single element's signature inline style → tag name (or null = plain).
  const styleToTag = (el) => {
    const s = (el.getAttribute && el.getAttribute("style") || "").toLowerCase();
    if (!s) return null;
    if (s.includes("background:#ffe066") || s.includes("background: #ffe066")) {
      // Block header div vs inline one-liner/landing line.
      return el.tagName === "DIV" ? "HEADER" : "ONELINER";
    }
    if (s.includes("color:#cc0000")) return "SCRIPTURE";
    if (s.includes("color:#2d9b2d")) return "SUMMARY";
    if (s.includes("color:#7b2fbe")) return "EXAMPLE";
    if (s.includes("color:#00b4d8")) return "STORY";
    if (s.includes("color:#e67e00")) return "CLOSING";
    return null;
  };

  // Walk children, emitting text with tags. Block-level <div>s become their own
  // line (matching how rawToHtml splits the manuscript on "\n").
  const lineWrapperRx = /line-height:1\.55/;
  const isLineWrapper = (el) =>
    el.tagName === "DIV" && lineWrapperRx.test((el.getAttribute("style") || "")) &&
    !/background:#ffe066/i.test(el.getAttribute("style") || "");

  const renderInline = (node) => {
    let out = "";
    node.childNodes.forEach((child) => {
      if (child.nodeType === 3) { out += child.textContent; return; }
      if (child.nodeType !== 1) return;
      if (child.tagName === "BR") { out += "\n"; return; }
      const tag = styleToTag(child);
      const inner = renderInline(child);
      if (tag && inner.trim()) out += `<${tag}>${inner}</${tag}>`;
      else out += inner;
    });
    return out;
  };

  const lines = [];
  root.childNodes.forEach((node) => {
    if (node.nodeType === 3) { if (node.textContent.trim()) lines.push(node.textContent); return; }
    if (node.nodeType !== 1) return;
    if (isLineWrapper(node)) { lines.push(renderInline(node)); return; }
    // Non-wrapper element at top level (rare) — render and split on its own <br>s.
    lines.push(renderInline(node));
  });

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// ─── AI PROVIDER (Cloudflare Worker Proxy) ───────────────────────────────────
// All AI requests go through /api/ai — API keys are stored as Cloudflare secrets.
// No API keys in the browser.

async function callAI({ system, messages, maxTokens = 4000, model = null, signal }) {
  const res = await fetch("/api/ai", {
    signal,
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
      let evt;
      try { evt=JSON.parse(payload); } catch { continue; }
      if(evt.type==='error')throw new Error(evt.error?.message || 'AI streaming failed.');
      if(evt.type==='content_block_delta' && evt.delta?.text){
        full+=evt.delta.text;
        onChunk?.(evt.delta.text);
      }
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

// Saved Sermons: preview stays local; published builds use the existing Supabase sermon table.
const SAVED_SERMON_KEY = "ss_saved_sermons_v1";
function cleanSermonHtml(html) {
  const template = document.createElement("template");
  template.innerHTML = html || "";
  const allowed = new Set(["P","DIV","SPAN","STRONG","B","EM","I","U","BR","UL","OL","LI","H1","H2","H3","H4","BLOCKQUOTE","FONT"]);
  for (const el of [...template.content.querySelectorAll("*")]) {
    if (["SCRIPT","STYLE","IFRAME","OBJECT","EMBED","SVG","MATH"].includes(el.tagName)) {el.remove();continue;}
    if (!allowed.has(el.tagName)) {el.replaceWith(...el.childNodes);continue;}
    for (const attr of [...el.attributes]) {
      if (attr.name !== "style" && !(attr.name === "data-ss-block" && /^block-[a-zA-Z0-9-]+$/.test(attr.value)) && !(el.tagName === "FONT" && ["color","face","size"].includes(attr.name))) el.removeAttribute(attr.name);
    }
    for (const property of [...el.style]) {
      if (!/^(color|background-color|background|font-family|font-size|font-weight|font-style|text-decoration|text-align|line-height|margin(-.*)?|padding(-.*)?)$/.test(property) || /url\s*\(|expression|javascript:/i.test(el.style.getPropertyValue(property))) el.style.removeProperty(property);
    }
  }
  return template.innerHTML;
}
window.savedSermons={...createSermonStorage({indexedDB:window.indexedDB,localStorage:window.localStorage,cleanHtml:cleanSermonHtml,cloud:import.meta.env.DEV?null:createManuscriptCloud(sb,cleanSermonHtml),online:()=>navigator.onLine}),cleanHtml:cleanSermonHtml};
window.addEventListener("online",()=>void window.savedSermons.syncPending().catch(()=>{}));
if(!import.meta.env.DEV)setInterval(()=>{if(navigator.onLine)void window.savedSermons.syncPending().catch(()=>{});},30000);

const libraryStorage=createSermonStorage({indexedDB:window.indexedDB,localStorage:window.localStorage,databaseName:'sermon-studio-library',emergencyKey:'ss_library_recovery_v1',activeKey:'ss_library_active_v1',legacyKey:null,cloud:import.meta.env.DEV?null:createManuscriptCloud(sb,value=>value,{mode:'preparation-library',label:'Preparation Library',versionMode:'preparation-library-version'}),online:()=>navigator.onLine});
window.personalLibrary=createPersonalLibrary(libraryStorage,async()=>{
  let saved=[];try{saved=JSON.parse(localStorage.getItem('sermon_sermon-stories') || '[]');}catch{}
  return [...(window.KODY_STORIES || []),...saved,...(!import.meta.env.DEV?await window.cloudStories.load():[])];
});
window.addEventListener('online',()=>void window.personalLibrary.syncPending().catch(()=>{}));
if(!import.meta.env.DEV)setInterval(()=>{if(navigator.onLine)void window.personalLibrary.syncPending().catch(()=>{});},30000);

// ─── LOCAL PROJECT STORE (localStorage fallback) ──────────────────────────────
// Used when Firebase is down or access-denied. Projects are always written here
// first so a page reload can restore them even without network/Firebase access.
const LOCAL_PROJ_KEY = "ss_proj_";
const LOCAL_LIST_KEY = "ss_projects_list";

function localSaveProject(project) {
  try {
    const data = { ...project, _savedAt: Date.now() };
    localStorage.setItem(LOCAL_PROJ_KEY + project.id, JSON.stringify(data));
    // Keep a lightweight metadata list so cloudProjects.load can find it
    const listRaw = localStorage.getItem(LOCAL_LIST_KEY) || "[]";
    let list = JSON.parse(listRaw);
    const meta = {
      id: project.id,
      title: project.title || "Untitled",
      sourceType: project.sourceType || "manual",
      coachMessages: project.coachMessages || [],
      createdAt: project.createdAt || new Date().toISOString(),
      _savedAt: Date.now(),
    };
    const idx = list.findIndex(p => p.id === project.id);
    if (idx >= 0) list[idx] = meta; else list.unshift(meta);
    localStorage.setItem(LOCAL_LIST_KEY, JSON.stringify(list.slice(0, 100)));
  } catch(e) {}
}

function localDeleteProject(id) {
  try {
    localStorage.removeItem(LOCAL_PROJ_KEY + id);
    const listRaw = localStorage.getItem(LOCAL_LIST_KEY) || "[]";
    const list = JSON.parse(listRaw).filter(p => p.id !== id);
    localStorage.setItem(LOCAL_LIST_KEY, JSON.stringify(list));
  } catch(e) {}
}

function localLoadProjects() {
  try {
    const listRaw = localStorage.getItem(LOCAL_LIST_KEY);
    if (!listRaw) return [];
    return JSON.parse(listRaw).map(meta => {
      try {
        const full = localStorage.getItem(LOCAL_PROJ_KEY + meta.id);
        return full ? JSON.parse(full) : meta;
      } catch(e) { return meta; }
    });
  } catch(e) { return []; }
}

// ─── CLOUD PROJECTS (Firebase Firestore + localStorage fallback) ───────────────
window.cloudProjects = {
  save: async (project) => {
    // Always write locally first — this is the guaranteed backup.
    localSaveProject(project);
    // Then try Firebase (may fail due to security rules / network).
    if (!db) throw new Error("Firebase not initialized");
    await db.collection("sermon_projects").doc(project.id).set({
      id: project.id,
      title: project.title || "Untitled",
      content: project.content || "",
      isHtml: !!project.isHtml,
      sourceType: project.sourceType || "manual",
      sourceFile: project.sourceFile || null,
      analysisJson: project.analysisJson || null,
      coachMessages: project.coachMessages || [],
      createdAt: project.createdAt || firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  },
  load: async () => {
    // Load from Firebase, fall back to (or supplement with) localStorage.
    let firebaseProjects = [];
    if (db) {
      try {
        const snap = await db.collection("sermon_projects").orderBy("updatedAt", "desc").limit(50).get();
        firebaseProjects = snap.docs.map(d => d.data());
      } catch(e) { console.warn("Firebase projects load failed:", e.message); }
    }
    // Merge: for any project in Firebase, prefer the localStorage version (newer
    // content saved after a Firebase write failure). For projects only in
    // localStorage (Firebase write never succeeded), include them too.
    const localProjects = localLoadProjects();
    const localById = new Map(localProjects.map(p => [p.id, p]));
    const firebaseIds = new Set(firebaseProjects.map(p => p.id));
    // Merge each Firebase project with its local backup (local wins on content)
    const merged = firebaseProjects.map(fbp => {
      const local = localById.get(fbp.id);
      return (local && local._savedAt) ? { ...fbp, ...local } : fbp;
    });
    // Append any local-only projects (Firebase never received them)
    const localOnly = localProjects.filter(p => !firebaseIds.has(p.id));
    const all = [...merged, ...localOnly];
    // Sort by most-recently updated
    return all.sort((a, b) => {
      const ts = p => typeof p._savedAt === 'number' ? p._savedAt
        : (typeof p.updatedAt === 'number' ? p.updatedAt : (p.updatedAt?.seconds || 0) * 1000);
      return ts(b) - ts(a);
    });
  },
  get: async (id) => {
    // Check localStorage first (may be newer than Firebase)
    try {
      const raw = localStorage.getItem(LOCAL_PROJ_KEY + id);
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    if (!db) return null;
    try {
      const doc = await db.collection("sermon_projects").doc(id).get();
      return doc.exists ? doc.data() : null;
    } catch(e) { console.warn("Firebase project get failed:", e.message); return null; }
  },
  delete: async (id) => {
    localDeleteProject(id);
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
    stripTags, rawToHtml, cadenceToHtml, htmlToTags, callAI, callAIStream,
    countWords, extractTitle, parseTheoSections, esc, parseLineToHtml,
  });
}
