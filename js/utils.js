// ─── SERMON STUDIO UTILITIES ─────────────────────────────────────────────────
// Storage shim, text helpers, and parsing functions.

// ─── SUPABASE CLIENT ─────────────────────────────────────────────────────────
const SUPABASE_URL  = "https://vpkbabjvjkiyvowdboul.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwa2JhYmp2amtpeXZvd2Rib3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNDQxNjYsImV4cCI6MjA5MDkyMDE2Nn0.50PU9TJIsn5LOFnZKCvo2EC3qSsz7zW43IQyJnU4Q68";
const sb = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON) : null;

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
  return (text || "").split("\n").map(line =>
    `<div style="margin:0;padding:0;line-height:1.55;font-family:Arial,sans-serif;font-size:12pt;color:#111;">${parseLineToHtml(line) || "<br>"}</div>`
  ).join("");
}

// ─── AI PROVIDER ─────────────────────────────────────────────────────────────
// Supports both Anthropic (Claude) and OpenAI (GPT-4o). Toggle in Settings.
function getProvider() {
  return localStorage.getItem("sermon_ai_provider") || "anthropic";
}
function setProvider(p) {
  localStorage.setItem("sermon_ai_provider", p);
}
function getApiKey() {
  const p = getProvider();
  return localStorage.getItem(p === "openai" ? "sermon_openai_key" : "sermon_anthropic_key") || "";
}
function setApiKey(key) {
  const p = getProvider();
  localStorage.setItem(p === "openai" ? "sermon_openai_key" : "sermon_anthropic_key", key);
}

async function callAI({ system, messages, maxTokens = 4000, model = null }) {
  const provider = getProvider();
  const apiKey = getApiKey();
  if (!apiKey) throw new Error(`No API key set. Go to Settings > API Key to add your ${provider === "openai" ? "OpenAI" : "Anthropic"} key.`);

  if (provider === "openai") {
    const resolvedModel = model || "gpt-4o";
    const apiMessages = [];
    if (system) apiMessages.push({ role: "system", content: system });
    messages.forEach(m => apiMessages.push({ role: m.role, content: m.content }));
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ model: resolvedModel, max_tokens: maxTokens, messages: apiMessages }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
    if (!data.choices || !data.choices[0]) throw new Error("No response received from OpenAI.");
    return data.choices[0].message.content || "";

  } else {
    // Anthropic Claude
    const resolvedModel = model || "claude-sonnet-4-6";
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: resolvedModel,
        max_tokens: maxTokens,
        system: system || undefined,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
    if (!data.content || !data.content[0]) throw new Error("No response received from Anthropic.");
    return data.content[0].text || "";
  }
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
const fbApp = window.firebase ? firebase.initializeApp(FIREBASE_CONFIG) : null;
const db = fbApp ? firebase.firestore() : null;

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
