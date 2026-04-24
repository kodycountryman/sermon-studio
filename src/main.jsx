// ─── SERMON STUDIO — VITE ENTRY POINT ────────────────────────────────────────
// This file is the module entry for npm/Vite builds.
// Load order matters: utils.js initializes Firebase/Supabase/PDFjs,
// then config.js and prompts.js populate window globals used by app.jsx.

// 1. Load utilities + cloud providers (initializes firebase, supabase, sets window.pdfjsLib)
import '../js/utils.js';

// 2. Load config (populates window.THEMES, window.LENGTHS, etc.)
import '../js/config.js';

// 3. Load prompts (populates window.KODY_VOICE, window.MANUSCRIPT_SYSTEM, etc.)
import '../js/prompts.js';

// 4. Mount the React app
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../js/app.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
);
