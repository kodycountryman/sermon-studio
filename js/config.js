// ─── SERMON STUDIO CONFIG ────────────────────────────────────────────────────
// Themes, lengths, tune options, and all static configuration.

// ─── THEMES ──────────────────────────────────────────────────────────────────
const THEMES = {
  burnt:    { name:"Default",    emoji:"🔶", bg:"#212121", surface:"rgba(255,255,255,0.06)", surfaceBorder:"#383838", text:"#ececec", textMuted:"#8e8e8e", textFaint:"#444", accent:"#c8622a", accentHover:"#e07030", accentGrad:"linear-gradient(135deg,#a84e1a,#c8622a)", btnActiveBg:"linear-gradient(135deg,#a84e1a,#c8622a)", btnInactiveBg:"rgba(255,255,255,0.05)", btnInactiveBorder:"#383838", btnInactiveText:"#8e8e8e", divider:"linear-gradient(90deg,transparent,#383838,transparent)", badge:"rgba(200,98,42,0.14)", badgeBorder:"rgba(200,98,42,0.32)", badgeText:"#e07a3a", inputBg:"rgba(255,255,255,0.05)", inputBorder:"#404040", inputText:"#ececec", inputPlaceholder:"#555", panelBg:"#171717", panelBorder:"#2e2e2e", titleColor:"#ececec", titleAccent:"#c8622a" },
  ember:    { name:"Ember",    emoji:"🔥", bg:"linear-gradient(160deg,#080808 0%,#160800 60%,#080808 100%)", surface:"rgba(255,255,255,0.06)", surfaceBorder:"#3a2010", text:"#f5ead8", textMuted:"#b08060", textFaint:"#5a3a20", accent:"#e08030", accentHover:"#f09040", accentGrad:"linear-gradient(135deg,#c8722a,#e08030)", btnActiveBg:"linear-gradient(135deg,#c8722a,#e08030)", btnInactiveBg:"rgba(255,255,255,0.05)", btnInactiveBorder:"#3a2010", btnInactiveText:"#c09070", divider:"linear-gradient(90deg,transparent,#3a2010,transparent)", badge:"rgba(200,114,42,0.15)", badgeBorder:"rgba(200,114,42,0.35)", badgeText:"#f0a060", inputBg:"rgba(255,255,255,0.05)", inputBorder:"#3a2010", inputText:"#f5ead8", inputPlaceholder:"#6a3e20", panelBg:"#100804", panelBorder:"#3a2010", titleColor:"#f5ead8", titleAccent:"#e08030" },
  dark:     { name:"Dark",     emoji:"🌑", bg:"#111", surface:"rgba(255,255,255,0.07)", surfaceBorder:"#2e2e2e", text:"#f0f0f0", textMuted:"#999", textFaint:"#444", accent:"#d0d0d0", accentHover:"#fff", accentGrad:"linear-gradient(135deg,#666,#aaa)", btnActiveBg:"linear-gradient(135deg,#555,#999)", btnInactiveBg:"rgba(255,255,255,0.06)", btnInactiveBorder:"#333", btnInactiveText:"#888", divider:"linear-gradient(90deg,transparent,#2e2e2e,transparent)", badge:"rgba(255,255,255,0.08)", badgeBorder:"rgba(255,255,255,0.18)", badgeText:"#bbb", inputBg:"rgba(255,255,255,0.07)", inputBorder:"#333", inputText:"#f0f0f0", inputPlaceholder:"#555", panelBg:"#0a0a0a", panelBorder:"#2a2a2a", titleColor:"#f0f0f0", titleAccent:"#ccc" },
  light:    { name:"Light",    emoji:"☀️", bg:"#ffffff", surface:"#ffffff", surfaceBorder:"#e0e0e0", text:"#111111", textMuted:"#555555", textFaint:"#aaaaaa", accent:"#111111", accentHover:"#333333", accentGrad:"linear-gradient(135deg,#111111,#444444)", btnActiveBg:"linear-gradient(135deg,#111111,#444444)", btnInactiveBg:"#ffffff", btnInactiveBorder:"#cccccc", btnInactiveText:"#555555", divider:"linear-gradient(90deg,transparent,#dddddd,transparent)", badge:"rgba(0,0,0,0.06)", badgeBorder:"rgba(0,0,0,0.14)", badgeText:"#333333", inputBg:"#ffffff", inputBorder:"#cccccc", inputText:"#111111", inputPlaceholder:"#aaaaaa", panelBg:"#f5f5f5", panelBorder:"#e0e0e0", titleColor:"#000000", titleAccent:"#444444" },
  slate:    { name:"Slate",    emoji:"💙", bg:"#10131a", surface:"rgba(255,255,255,0.07)", surfaceBorder:"#2e3448", text:"#eef1ff", textMuted:"#8a96b8", textFaint:"#3a3f58", accent:"#7b94f0", accentHover:"#9fb0ff", accentGrad:"linear-gradient(135deg,#5570d8,#8fa0f5)", btnActiveBg:"linear-gradient(135deg,#5570d8,#8fa0f5)", btnInactiveBg:"rgba(255,255,255,0.05)", btnInactiveBorder:"#2e3448", btnInactiveText:"#7a86a8", divider:"linear-gradient(90deg,transparent,#2e3448,transparent)", badge:"rgba(110,130,232,0.15)", badgeBorder:"rgba(110,130,232,0.35)", badgeText:"#a0b0ff", inputBg:"rgba(255,255,255,0.06)", inputBorder:"#2e3448", inputText:"#eef1ff", inputPlaceholder:"#3a4060", panelBg:"#0b0e15", panelBorder:"#2e3448", titleColor:"#eef1ff", titleAccent:"#9fb0ff" },
  violet:   { name:"Violet",   emoji:"💜", bg:"linear-gradient(160deg,#0c0814 0%,#140b1f 60%,#0c0814 100%)", surface:"rgba(160,80,255,0.08)", surfaceBorder:"#3a2058", text:"#f0e8ff", textMuted:"#a080c8", textFaint:"#3e2460", accent:"#c07aff", accentHover:"#d4a0ff", accentGrad:"linear-gradient(135deg,#8b35d8,#c084fc)", btnActiveBg:"linear-gradient(135deg,#8b35d8,#c084fc)", btnInactiveBg:"rgba(160,80,255,0.06)", btnInactiveBorder:"#3a2058", btnInactiveText:"#9070b8", divider:"linear-gradient(90deg,transparent,#3a2058,transparent)", badge:"rgba(168,85,247,0.15)", badgeBorder:"rgba(168,85,247,0.35)", badgeText:"#d0a0ff", inputBg:"rgba(160,80,255,0.07)", inputBorder:"#3a2058", inputText:"#f0e8ff", inputPlaceholder:"#4a2870", panelBg:"#090610", panelBorder:"#3a2058", titleColor:"#f0e8ff", titleAccent:"#d0a0ff" },
  ocean:    { name:"Ocean",    emoji:"🌊", bg:"linear-gradient(160deg,#030d1a 0%,#061625 60%,#030d1a 100%)", surface:"rgba(20,100,200,0.09)", surfaceBorder:"#123058", text:"#e0f2ff", textMuted:"#6a9cc0", textFaint:"#0c2840", accent:"#40b0f8", accentHover:"#60c8ff", accentGrad:"linear-gradient(135deg,#1070b0,#3aaaf0)", btnActiveBg:"linear-gradient(135deg,#1070b0,#3aaaf0)", btnInactiveBg:"rgba(20,100,200,0.07)", btnInactiveBorder:"#123058", btnInactiveText:"#4a7898", divider:"linear-gradient(90deg,transparent,#123058,transparent)", badge:"rgba(30,144,216,0.15)", badgeBorder:"rgba(30,144,216,0.35)", badgeText:"#60c0ff", inputBg:"rgba(20,100,200,0.07)", inputBorder:"#123058", inputText:"#e0f2ff", inputPlaceholder:"#0e2840", panelBg:"#020a14", panelBorder:"#123058", titleColor:"#e0f2ff", titleAccent:"#60c0ff" },
  forest:   { name:"Forest",   emoji:"🌿", bg:"linear-gradient(160deg,#050d07 0%,#0a180d 60%,#050d07 100%)", surface:"rgba(40,140,70,0.08)", surfaceBorder:"#163020", text:"#e0f5e8", textMuted:"#70a880", textFaint:"#142818", accent:"#4cc870", accentHover:"#68e088", accentGrad:"linear-gradient(135deg,#1e7a3e,#3dbc68)", btnActiveBg:"linear-gradient(135deg,#1e7a3e,#3dbc68)", btnInactiveBg:"rgba(40,140,70,0.07)", btnInactiveBorder:"#163020", btnInactiveText:"#508860", divider:"linear-gradient(90deg,transparent,#163020,transparent)", badge:"rgba(42,154,82,0.15)", badgeBorder:"rgba(42,154,82,0.35)", badgeText:"#60d878", inputBg:"rgba(40,140,70,0.07)", inputBorder:"#163020", inputText:"#e0f5e8", inputPlaceholder:"#163020", panelBg:"#030a05", panelBorder:"#163020", titleColor:"#e0f5e8", titleAccent:"#60d878" },
  studio:   { name:"Studio",   emoji:"⬛", bg:"#212121", surface:"rgba(255,255,255,0.06)", surfaceBorder:"#383838", text:"#ececec", textMuted:"#8e8e8e", textFaint:"#444", accent:"#10a37f", accentHover:"#1ac99a", accentGrad:"linear-gradient(135deg,#0d8f6e,#10a37f)", btnActiveBg:"linear-gradient(135deg,#0d8f6e,#10a37f)", btnInactiveBg:"rgba(255,255,255,0.05)", btnInactiveBorder:"#383838", btnInactiveText:"#8e8e8e", divider:"linear-gradient(90deg,transparent,#383838,transparent)", badge:"rgba(16,163,127,0.12)", badgeBorder:"rgba(16,163,127,0.28)", badgeText:"#1ac99a", inputBg:"rgba(255,255,255,0.05)", inputBorder:"#404040", inputText:"#ececec", inputPlaceholder:"#555", panelBg:"#171717", panelBorder:"#2e2e2e", titleColor:"#ececec", titleAccent:"#10a37f" },
  parchment:{ name:"Parchment",emoji:"📜", bg:"#f7f3ec", surface:"#fefcf8", surfaceBorder:"#e0d8cc", text:"#2c2016", textMuted:"#7a6a54", textFaint:"#c8b89a", accent:"#9b5e28", accentHover:"#b87030", accentGrad:"linear-gradient(135deg,#7a4418,#b06828)", btnActiveBg:"linear-gradient(135deg,#7a4418,#b06828)", btnInactiveBg:"#fefcf8", btnInactiveBorder:"#d8ccc0", btnInactiveText:"#8a7a64", divider:"linear-gradient(90deg,transparent,#d8ccc0,transparent)", badge:"rgba(155,94,40,0.1)", badgeBorder:"rgba(155,94,40,0.22)", badgeText:"#9b5e28", inputBg:"#fefcf8", inputBorder:"#d8ccc0", inputText:"#2c2016", inputPlaceholder:"#b8a890", panelBg:"#f2ede4", panelBorder:"#e0d4c4", titleColor:"#2c2016", titleAccent:"#9b5e28" },
  crimson:  { name:"Crimson",  emoji:"❤️", bg:"linear-gradient(160deg,#0e0608 0%,#1a0508 60%,#0e0608 100%)", surface:"rgba(220,40,60,0.07)", surfaceBorder:"#3a1018", text:"#fce8ea", textMuted:"#c07080", textFaint:"#4a1520", accent:"#e8364a", accentHover:"#ff4f62", accentGrad:"linear-gradient(135deg,#b8182c,#e8364a)", btnActiveBg:"linear-gradient(135deg,#b8182c,#e8364a)", btnInactiveBg:"rgba(220,40,60,0.06)", btnInactiveBorder:"#3a1018", btnInactiveText:"#a06070", divider:"linear-gradient(90deg,transparent,#3a1018,transparent)", badge:"rgba(220,40,60,0.14)", badgeBorder:"rgba(220,40,60,0.3)", badgeText:"#ff6070", inputBg:"rgba(220,40,60,0.06)", inputBorder:"#3a1018", inputText:"#fce8ea", inputPlaceholder:"#5a2030", panelBg:"#0a0406", panelBorder:"#3a1018", titleColor:"#fce8ea", titleAccent:"#e8364a" },
  gold:     { name:"Gold",     emoji:"✨", bg:"linear-gradient(160deg,#0c0900 0%,#1a1400 60%,#0c0900 100%)", surface:"rgba(200,160,20,0.07)", surfaceBorder:"#3a3000", text:"#fdf5d8", textMuted:"#b0a060", textFaint:"#4a3a00", accent:"#d4a820", accentHover:"#f0c030", accentGrad:"linear-gradient(135deg,#a87c10,#d4a820)", btnActiveBg:"linear-gradient(135deg,#a87c10,#d4a820)", btnInactiveBg:"rgba(200,160,20,0.06)", btnInactiveBorder:"#3a3000", btnInactiveText:"#908040", divider:"linear-gradient(90deg,transparent,#3a3000,transparent)", badge:"rgba(200,160,20,0.14)", badgeBorder:"rgba(200,160,20,0.3)", badgeText:"#e0c040", inputBg:"rgba(200,160,20,0.06)", inputBorder:"#3a3000", inputText:"#fdf5d8", inputPlaceholder:"#504000", panelBg:"#090700", panelBorder:"#3a3000", titleColor:"#fdf5d8", titleAccent:"#d4a820" },
  rose:     { name:"Rose",     emoji:"🌸", bg:"#fdf4f6", surface:"#fff", surfaceBorder:"#f0d8df", text:"#2a1418", textMuted:"#9a6070", textFaint:"#e0c0c8", accent:"#c0405a", accentHover:"#d85070", accentGrad:"linear-gradient(135deg,#a02840,#c0405a)", btnActiveBg:"linear-gradient(135deg,#a02840,#c0405a)", btnInactiveBg:"#fff", btnInactiveBorder:"#ecd0d8", btnInactiveText:"#a07080", divider:"linear-gradient(90deg,transparent,#f0d8df,transparent)", badge:"rgba(192,64,90,0.08)", badgeBorder:"rgba(192,64,90,0.2)", badgeText:"#c0405a", inputBg:"#fff", inputBorder:"#ead0d8", inputText:"#2a1418", inputPlaceholder:"#d0a8b4", panelBg:"#f9eef1", panelBorder:"#f0d8df", titleColor:"#2a1418", titleAccent:"#c0405a" },
};

// ─── BIBLE DATA ──────────────────────────────────────────────────────────────
const TRANS_LIST = ["KJV","NKJV","WEB","ASV","YLT","DARBY"];
const TRANS_MAP  = { KJV:"kjv", NKJV:"nkjv", WEB:"web", ASV:"asv", YLT:"ylt", DARBY:"darby" };

// ─── LENGTH CONFIG ───────────────────────────────────────────────────────────
const LENGTHS = {
  "5":  { label:"5 min",  desc:"Lightning",    wMin:500,  wMax:600,  estApiSecs:35,  msgs:["Opening the scroll...","Finding the hook...","Almost ready..."] },
  "10": { label:"10 min", desc:"Sharp",        wMin:1000, wMax:1100, estApiSecs:55,  msgs:["Searching the scriptures...","Building the points...","Tightening the landing..."] },
  "25": { label:"25 min", desc:"Sunday standard", wMin:2500, wMax:2700, estApiSecs:90,  msgs:["Diving deep...","Writing your main points...","Adding illustrations...","Tightening the gospel turn...","Almost there..."] },
  "40": { label:"40 min", desc:"Full message", wMin:4000, wMax:4200, estApiSecs:150, msgs:["Getting into the Word...","Building your structure...","Writing main points...","Adding stories and illustrations...","Crafting the gospel turn...","Finishing strong...","Final polish..."] },
};
const THEOLOGY_EST_SECS = 130;
const ILLUS_EST_SECS = 55;

// ─── TUNE OPTIONS ────────────────────────────────────────────────────────────
const TUNE_PASTORS = [
  { id:"kody",    name:"Kody Countryman", desc:"Your voice — personal, warm, punchy" },
  { id:"rich",    name:"Rich Wilkerson Jr", desc:"Cultural, emotional, urban style" },
  { id:"carl",    name:"Carl Lentz",      desc:"Bold, street-smart, confrontational grace" },
  { id:"charles", name:"Charles Metcalf", desc:"Prophetic, fiery, Spirit-led" },
  { id:"steven",  name:"Steven Furtick",  desc:"High energy, narrative-driven" },
  { id:"td",      name:"T.D. Jakes",      desc:"Masterful storytelling, gravitas" },
  { id:"craig",   name:"Craig Groeschel", desc:"Practical, systems-thinker, accessible" },
  { id:"louie",   name:"Louie Giglio",    desc:"Cosmic scale, wonder, science and Scripture" },
];

const OUTLINE_METHODS = [
  { id:"kody",    name:"Kody's Method",        desc:"Crowd opener, story, tension, scripture, 3 punchy points, gospel turn" },
  { id:"expository", name:"Expository",        desc:"Verse-by-verse deep dive through a passage" },
  { id:"topical", name:"Topical",              desc:"Theme-based, multiple scriptures supporting one big idea" },
  { id:"narrative", name:"Narrative",          desc:"Story arc structure — setup, conflict, resolution, invitation" },
  { id:"inductive", name:"Inductive",          desc:"Observation, interpretation, application (OIA method)" },
  { id:"problem",  name:"Problem/Solution",    desc:"Name the problem, show Jesus as the answer" },
  { id:"firstlast", name:"First/Last Points Strong", desc:"Killer opening point and killer closing point, bridges in between" },
];

const VENUE_TYPES = [
  { id:"home",    label:"Home Church",     desc:"Regular congregation, intimate" },
  { id:"guest",   label:"Guest Speaking",  desc:"New crowd, make a first impression" },
  { id:"camp",    label:"Camp / Retreat",  desc:"Youth or young adults, extended setting" },
  { id:"conf",    label:"Conference",      desc:"Larger event, limited context" },
  { id:"online",  label:"Online Service",  desc:"Camera-first, shorter attention span" },
  { id:"outdoor", label:"Outdoor / Rally", desc:"Casual, distractions, mobile crowd" },
];

const AUDIENCE_TYPES = [
  { id:"kids",    label:"Kids" },
  { id:"teens",   label:"Teenagers" },
  { id:"young",   label:"Young Adults" },
  { id:"adults",  label:"Adults" },
  { id:"mixed",   label:"Mixed" },
];

// ─── THEOLOGY SECTIONS ───────────────────────────────────────────────────────
const THEO_SECS = [
  { key:"all",        label:"All",          marker:null },
  { key:"overview",   label:"Overview",     marker:"SECTION:OVERVIEW" },
  { key:"hebrew",     label:"Greek & Hebrew", marker:"SECTION:HEBREW_GREEK" },
  { key:"historical", label:"Historical",   marker:"SECTION:HISTORICAL" },
  { key:"scholars",   label:"Scholars",     marker:"SECTION:SCHOLARS" },
  { key:"tensions",   label:"Tensions",     marker:"SECTION:TENSIONS" },
  { key:"crossref",   label:"Cross-Ref",    marker:"SECTION:CROSSREF" },
  { key:"preaching",  label:"Preaching",    marker:"SECTION:PREACHING" },
  { key:"cautions",   label:"Cautions",     marker:"SECTION:CAUTIONS" },
];

// ─── EDITOR CONFIG ───────────────────────────────────────────────────────────
const EDITOR_FONTS = ["Arial","Times New Roman","Georgia","Courier New","Verdana"];
const EDITOR_SIZES = ["8pt","9pt","10pt","11pt","12pt","14pt","16pt","18pt","24pt","28pt","32pt"];
const EDITOR_COLORS = ["#000000","#cc0000","#1a4fcc","#1a7a2a","#cc2080","#6a1acc","#e08030","#0099aa","#555","#c8722a","#cc6600","#006633"];

// ─── HISTORY / MODE COLORS ───────────────────────────────────────────────────
const MODE_COLORS = { outline:"#5b9bd5", manuscript:"#7dc47d", illustration:"#d4a84b", theology:"#b07dd4", idea:"#e07070" };

const HIST_TABS = [
  { key:"all",          label:"All",          icon:null,   color:null },
  { key:"outline",      label:"Outlines",     icon:"outline",  color:"#5b9bd5" },
  { key:"manuscript",   label:"Manuscripts",  icon:"manuscript", color:"#7dc47d" },
  { key:"illustration", label:"Illustrations",icon:"illustration", color:"#d4a84b" },
  { key:"theology",     label:"Deep Study",   icon:"theology", color:"#b07dd4" },
  { key:"idea",         label:"Ideas",        icon:"idea", color:"#e07070" },
];

// ─── CRITIQUE SECTIONS ───────────────────────────────────────────────────────
const CRITIQUE_SECTIONS = [
  {key:"all",       label:"Full Critique"},
  {key:"hook",      label:"Hook"},
  {key:"structure", label:"Structure"},
  {key:"gospel",    label:"Gospel Turn"},
  {key:"stories",   label:"Stories"},
  {key:"landing",   label:"Landing"},
];
