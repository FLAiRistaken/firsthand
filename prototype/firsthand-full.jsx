import { useState, useRef, useEffect } from "react";

const G = "#2A5C45";
const G_LIGHT = "#E8F2ED";
const AMBER = "#9C6B1A";
const AMBER_LIGHT = "#FDF3E3";
const SIN_BG = "#FAF5EE";
const SIN_BORDER = "#E8DDD0";
const APP_BG = "#F7F6F3";
const DEFAULT_CATS = ["coding", "writing", "planning", "research", "other"];
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const PERSONAL_AVG = 61;
const SK = "firsthand-v2";

const loadData = async () => { try { const r = await window.storage.get(SK); return r ? JSON.parse(r.value) : null; } catch { return null; } };
const saveData = async d => { try { await window.storage.set(SK, JSON.stringify(d)); } catch {} };
const uid = () => Math.random().toString(36).slice(2, 10);
const todayStr = () => new Date().toDateString();

function calcStreak(logs) {
  const winDays = [...new Set(logs.filter(l => l.type === "win").map(l => new Date(l.ts).toDateString()))].sort().reverse();
  if (!winDays.length) return 0;
  const today = todayStr();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (winDays[0] !== today && winDays[0] !== yesterday) return 0;
  let s = 1;
  for (let i = 1; i < winDays.length; i++) {
    if ((new Date(winDays[i - 1]) - new Date(winDays[i])) / 86400000 === 1) s++; else break;
  }
  return s;
}

function weekRatio(logs) {
  const start = new Date(); start.setDate(start.getDate() - 7); start.setHours(0, 0, 0, 0);
  const r = logs.filter(l => new Date(l.ts) >= start);
  if (!r.length) return null;
  return Math.round(r.filter(l => l.type === "win").length / r.length * 100);
}

function streakDots(logs) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (6 - i));
    return logs.some(l => new Date(l.ts).toDateString() === d.toDateString() && l.type === "win");
  });
}

const BrainIcon = ({ size = 16, color = "white" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5C10.5 3.5 8 3.5 6.5 5S4 8.5 5 10.5C3.5 11 3 12.5 3.5 14S5.5 16 7 15.5C7.5 17.5 9.5 19 12 19s4.5-1.5 5-3.5c1.5.5 3.5-.5 3.5-2s-.5-3-2-3.5c1-2 .5-4.5-1.5-5.5S13.5 3.5 12 5z" />
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="7" y1="10" x2="12" y2="12" /><line x1="17" y1="10" x2="12" y2="12" />
  </svg>
);

const ChipIcon = ({ size = 16, color = "#888" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="7" y="7" width="10" height="10" rx="1" />
    <line x1="9" y1="7" x2="9" y2="4" /><line x1="12" y1="7" x2="12" y2="4" /><line x1="15" y1="7" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="17" /><line x1="12" y1="20" x2="12" y2="17" /><line x1="15" y1="20" x2="15" y2="17" />
    <line x1="7" y1="9" x2="4" y2="9" /><line x1="7" y1="12" x2="4" y2="12" /><line x1="7" y1="15" x2="4" y2="15" />
    <line x1="20" y1="9" x2="17" y2="9" /><line x1="20" y1="12" x2="17" y2="12" /><line x1="20" y1="15" x2="17" y2="15" />
  </svg>
);

const PersonIcon = ({ size = 17, color = "#999" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const SendIcon = ({ size = 15, color = "white" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=DM+Sans:wght@300;400;500&display=swap');`;
const ANIMS = `@keyframes p0{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}@keyframes p1{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}@keyframes p2{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`;

function Dots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
      {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#C8C4BE", animation: `p${i} 1s ease-in-out ${i * 0.15}s infinite` }} />)}
    </div>
  );
}

function Phone({ children, tab, onTab, showTabs = true }) {
  const hr = new Date().getHours(); const mn = new Date().getMinutes();
  const tabs = [
    { id: "home", label: "Home", path: "M12 3L2 12h3v8h6v-5h2v5h6v-8h3z" },
    { id: "history", label: "History", path: "M4 6h16M4 10h16M4 14h10" },
    { id: "coach", label: "Coach", path: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
  ];
  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", maxWidth: 390, margin: "0 auto", height: 780, background: APP_BG, borderRadius: 44, overflow: "hidden", position: "relative", boxShadow: "0 32px 80px rgba(0,0,0,0.2),0 0 0 10px #1a1a1a,0 0 0 12px #2a2a2a", display: "flex", flexDirection: "column" }}>
      <style>{FONTS + ANIMS}</style>
      <div style={{ padding: "16px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: "#333" }}>{String(hr).padStart(2, "0")}:{String(mn).padStart(2, "0")}</div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {[...Array(4)].map((_, i) => <div key={i} style={{ width: 3, height: 6 + i * 3, borderRadius: 1.5, background: i < 3 ? "#333" : "#CCC" }} />)}
          <div style={{ width: 16, height: 8, border: "1.5px solid #333", borderRadius: 2, marginLeft: 4, position: "relative" }}>
            <div style={{ position: "absolute", left: 1, top: 1, right: 3, bottom: 1, background: "#333", borderRadius: 1 }} />
            <div style={{ position: "absolute", right: -4, top: "50%", transform: "translateY(-50%)", width: 2.5, height: 4, background: "#333", borderRadius: 1 }} />
          </div>
        </div>
      </div>
      <div style={{ padding: "14px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: G }} />
          <span style={{ fontFamily: "Fraunces,serif", fontSize: 17, fontWeight: 600, color: "#333" }}>Firsthand</span>
        </div>
        {showTabs && <button style={{ width: 34, height: 34, borderRadius: "50%", background: "#ECEAE6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><PersonIcon /></button>}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>{children}</div>
      {showTabs && (
        <div style={{ flexShrink: 0, padding: "10px 0 26px", background: "rgba(247,246,243,0.96)", backdropFilter: "blur(12px)", borderTop: "1px solid #ECEAE6", display: "flex", justifyContent: "space-around" }}>
          {tabs.map(t => (
            <div key={t.id} onClick={() => onTab(t.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", padding: "4px 24px" }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={tab === t.id ? G : "#C8C4BE"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={t.path} /></svg>
              <span style={{ fontSize: 10, fontWeight: tab === t.id ? 500 : 400, color: tab === t.id ? G : "#C8C4BE" }}>{t.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LogModal({ type, onSave, onClose, customCats, onAddCat }) {
  const [cat, setCat] = useState(""); const [note, setNote] = useState(""); const [ctx, setCtx] = useState("");
  const [addingCat, setAddingCat] = useState(false); const [newCat, setNewCat] = useState("");
  const isWin = type === "win"; const col = isWin ? G : AMBER; const lightCol = isWin ? G_LIGHT : AMBER_LIGHT;
  const allCats = [...DEFAULT_CATS, ...customCats];
  const handleAddCat = () => { const t = newCat.trim().toLowerCase(); if (t && !allCats.includes(t)) { onAddCat(t); setCat(t); } setNewCat(""); setAddingCat(false); };
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 50, background: "rgba(15,25,20,0.5)", display: "flex", alignItems: "flex-end", backdropFilter: "blur(3px)" }}>
      <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "26px 24px 34px", width: "100%", boxSizing: "border-box", boxShadow: "0 -8px 40px rgba(0,0,0,0.12)" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "#E4E0DA", margin: "0 auto 22px" }} />
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: "Fraunces,serif", fontSize: 22, fontWeight: 600, color: col, marginBottom: 3 }}>{isWin ? "I did it myself" : "I used AI"}</div>
          <div style={{ fontSize: 14, color: "#AAA", lineHeight: 1.5 }}>{isWin ? "A rep for your brain. What did you work on?" : "No judgment — awareness is the whole point."}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "#C4C0BB", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 9 }}>Category</div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {allCats.map(c => <button key={c} onClick={() => setCat(cat === c ? "" : c)} style={{ padding: "7px 15px", borderRadius: 20, fontSize: 13, cursor: "pointer", fontFamily: "inherit", border: `1.5px solid ${cat === c ? col : "#EBEBEB"}`, background: cat === c ? lightCol : "transparent", color: cat === c ? col : "#888", fontWeight: cat === c ? 500 : 400 }}>{c}</button>)}
            {addingCat ? (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input autoFocus value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleAddCat(); if (e.key === "Escape") setAddingCat(false); }} placeholder="new category" style={{ padding: "6px 12px", borderRadius: 20, fontSize: 13, border: `1.5px solid ${col}`, outline: "none", fontFamily: "inherit", width: 110, color: "#333", background: lightCol }} />
                <button onClick={handleAddCat} style={{ padding: "6px 12px", borderRadius: 20, fontSize: 13, background: col, color: "white", border: "none", cursor: "pointer", fontFamily: "inherit" }}>add</button>
              </div>
            ) : <button onClick={() => setAddingCat(true)} style={{ padding: "7px 13px", borderRadius: 20, fontSize: 13, border: "1.5px dashed #DDD", background: "transparent", color: "#CCC", cursor: "pointer", fontFamily: "inherit" }}>+ new</button>}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "#C4C0BB", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 9 }}>Context</div>
          <div style={{ display: "flex", gap: 8 }}>
            {["work", "personal"].map(c => <button key={c} onClick={() => setCtx(ctx === c ? "" : c)} style={{ flex: 1, padding: "10px", borderRadius: 12, fontSize: 14, cursor: "pointer", fontFamily: "inherit", border: `1.5px solid ${ctx === c ? col : "#EBEBEB"}`, background: ctx === c ? lightCol : "transparent", color: ctx === c ? col : "#AAA", fontWeight: ctx === c ? 500 : 400 }}>{c}</button>)}
          </div>
        </div>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Quick note… (optional)" style={{ width: "100%", boxSizing: "border-box", padding: "12px 15px", border: "1.5px solid #EBEBEB", borderRadius: 13, fontSize: 14, fontFamily: "inherit", background: "#FAFAFA", color: "#333", marginBottom: 18, outline: "none" }} />
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 14, borderRadius: 13, border: "1.5px solid #EBEBEB", background: "transparent", color: "#BBB", fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={() => onSave({ type, cat, note, ctx })} style={{ flex: 2.5, padding: 14, borderRadius: 13, border: "none", background: col, color: "white", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Save</button>
        </div>
      </div>
    </div>
  );
}

function Home({ data, onLog, customCats, onAddCat }) {
  const [modal, setModal] = useState(null);
  const [saved, setSaved] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  const today = todayStr();
  const todayLogs = data.logs.filter(l => new Date(l.ts).toDateString() === today);
  const wins = todayLogs.filter(l => l.type === "win").length;
  const sins = todayLogs.filter(l => l.type === "sin").length;
  const streak = calcStreak(data.logs);
  const ratio = weekRatio(data.logs);
  const dots = streakDots(data.logs);
  const aboveAvg = ratio != null && ratio > PERSONAL_AVG;
  const diff = ratio != null ? Math.abs(ratio - PERSONAL_AVG) : 0;
  const name = data.profile?.name || "";
  const hr = new Date().getHours();
  const greeting = hr < 12 ? "Morning" : hr < 17 ? "Afternoon" : "Evening";
  const sub = wins === 0 && sins === 0 ? "What are you working on today?" : wins > sins ? `${wins} win${wins !== 1 ? "s" : ""} today. Your brain is working.` : sins > wins ? `${sins} AI use${sins !== 1 ? "s" : ""} today. Awareness is the start.` : "Balanced day so far.";

  const handleSave = e => { onLog(e); setSaved(e.type); setModal(null); setTimeout(() => setSaved(null), 2000); };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px 0" }}>
      {modal && <LogModal type={modal} onSave={handleSave} onClose={() => setModal(null)} customCats={customCats} onAddCat={onAddCat} />}
      {saved && <div style={{ position: "absolute", top: 78, left: "50%", transform: "translateX(-50%)", background: saved === "win" ? G : "#7A5520", color: "white", padding: "9px 20px", borderRadius: 20, fontSize: 13, fontWeight: 500, zIndex: 100, whiteSpace: "nowrap", boxShadow: "0 4px 20px rgba(0,0,0,0.18)", display: "flex", alignItems: "center", gap: 7 }}>
        {saved === "win" ? <><BrainIcon size={12} color="white" /> Win logged</> : <><ChipIcon size={12} color="rgba(255,255,255,0.8)" /> Logged</>}
      </div>}

      <div style={{ marginBottom: 22 }}>
        <div style={{ fontFamily: "Fraunces,serif", fontSize: 30, fontWeight: 600, color: "#1A1A1A", lineHeight: 1.1, marginBottom: 5 }}>{greeting}{name ? `, ${name}` : ""}.</div>
        <div style={{ fontSize: 15, color: "#AAA", lineHeight: 1.5, fontWeight: 300 }}>{sub}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
        <button onClick={() => setModal("win")} style={{ padding: "24px 22px", borderRadius: 20, border: "none", background: G, color: "white", cursor: "pointer", textAlign: "left", fontFamily: "inherit", boxShadow: `0 6px 24px ${G}44`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -8, top: -8, width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
          <div style={{ position: "absolute", right: 22, top: "50%", transform: "translateY(-50%)", opacity: 0.1 }}><BrainIcon size={52} color="white" /></div>
          <div style={{ marginBottom: 9, position: "relative" }}><BrainIcon size={19} color="rgba(255,255,255,0.8)" /></div>
          <div style={{ fontFamily: "Fraunces,serif", fontSize: 21, fontWeight: 600, marginBottom: 2, position: "relative" }}>I did it myself</div>
          <div style={{ fontSize: 13, opacity: 0.55, fontWeight: 300, position: "relative" }}>A rep for your brain</div>
        </button>
        <button onClick={() => setModal("sin")} style={{ padding: "18px 22px", borderRadius: 20, border: `1.5px solid ${SIN_BORDER}`, background: SIN_BG, color: "#555", cursor: "pointer", textAlign: "left", fontFamily: "inherit", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: 22, top: "50%", transform: "translateY(-50%)", opacity: 0.1 }}><ChipIcon size={46} color="#8B6914" /></div>
          <div style={{ marginBottom: 8, position: "relative" }}><ChipIcon size={18} color="#C4A882" /></div>
          <div style={{ fontFamily: "Fraunces,serif", fontSize: 19, fontWeight: 500, marginBottom: 2, color: "#5A4A38", position: "relative" }}>I used AI</div>
          <div style={{ fontSize: 13, color: "#B8A898", fontWeight: 300, position: "relative" }}>No judgment — just awareness</div>
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", marginBottom: 10, padding: "12px 16px", background: "white", borderRadius: 14, border: "1px solid #F0EEE9" }}>
        {[{ label: "wins", value: wins, color: G }, { label: "AI uses", value: sins, color: AMBER }, { label: "streak", value: `${streak}d`, color: "#555" }].map((s, i) => (
          <div key={s.label} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? "1px solid #F0EEE9" : "none" }}>
            <div style={{ fontFamily: "Fraunces,serif", fontSize: 22, fontWeight: 600, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#C4C0BB", marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "12px 14px 14px", background: "white", borderRadius: 14, border: "1px solid #F0EEE9", marginBottom: 10 }}>
        {ratio != null ? <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
            <div style={{ fontSize: 11, color: "#C4C0BB" }}>Own work — 7 days</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 500, padding: "2px 7px", borderRadius: 8, background: aboveAvg ? G_LIGHT : "#FFF3E0", color: aboveAvg ? G : AMBER }}>{aboveAvg ? `↑${diff}% above avg` : `↓${diff}% below avg`}</span>
              <span style={{ fontFamily: "Fraunces,serif", fontSize: 20, fontWeight: 600, color: G }}>{ratio}%</span>
            </div>
          </div>
          <div style={{ height: 4, background: "#F0EEE9", borderRadius: 2, overflow: "hidden", marginBottom: 4 }}>
            <div style={{ height: "100%", width: `${ratio}%`, background: G, borderRadius: 2 }} />
          </div>
        </> : <div style={{ fontSize: 12, color: "#C4C0BB", marginBottom: 10 }}>Log wins and sins to see your ratio</div>}
        <div style={{ height: 1, background: "#F4F2EE", margin: "10px 0" }} />
        <div style={{ display: "flex", gap: 6 }}>
          {dots.map((hasWin, i) => {
            const isToday = i === 6;
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: "100%", aspectRatio: "1", borderRadius: "50%", background: hasWin ? G : "transparent", border: `1.5px solid ${hasWin ? G : isToday ? "#CCCCCC" : "#EBEBEB"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {hasWin ? <svg width="7" height="7" viewBox="0 0 10 10" fill="none"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> : isToday ? <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#CCCCCC" }} /> : null}
                </div>
                <span style={{ fontSize: 9, color: isToday ? G : hasWin ? "#AAAAAA" : "#DDDDDD", fontWeight: isToday ? 500 : 400 }}>{DAY_LABELS[i]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {todayLogs.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <button onClick={() => setShowLogs(v => !v)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2px", marginBottom: showLogs ? 10 : 0 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "#C8C4BE", textTransform: "uppercase", letterSpacing: "0.08em" }}>Today · {todayLogs.length} logged</div>
            <div style={{ fontSize: 11, color: "#C8C4BE" }}>{showLogs ? "hide" : "show"}</div>
          </button>
          {showLogs && <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {[...todayLogs].reverse().map(l => (
              <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 12, background: l.type === "win" ? G_LIGHT : SIN_BG, border: `1px solid ${l.type === "win" ? "#C8E2D5" : SIN_BORDER}` }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: l.type === "win" ? G : "#DDD5C8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {l.type === "win" ? <BrainIcon size={11} color="white" /> : <ChipIcon size={11} color="#AAA" />}
                </div>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: l.type === "win" ? G : "#7A6654" }}>{l.category || "general"}{l.note ? <span style={{ fontWeight: 400, color: "#AAA" }}> — {l.note}</span> : null}</span>
                <span style={{ fontSize: 11, color: "#C8C4BE" }}>{new Date(l.ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            ))}
          </div>}
        </div>
      )}
      <div style={{ height: 24 }} />
    </div>
  );
}

function History({ logs }) {
  const [filter, setFilter] = useState("all");
  const grouped = {};
  [...logs].reverse().forEach(l => {
    const d = new Date(l.ts).toDateString();
    const today = todayStr(); const yesterday = new Date(Date.now() - 86400000).toDateString();
    const label = d === today ? "Today" : d === yesterday ? "Yesterday" : new Date(l.ts).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(l);
  });
  const keys = Object.keys(grouped);
  const [open, setOpen] = useState(() => Object.fromEntries(keys.map(k => [k, k === "Today" || k === "Yesterday"])));
  const toggle = day => setOpen(e => ({ ...e, [day]: !e[day] }));
  const filtered = entries => entries.filter(e => filter === "all" ? true : filter === "wins" ? e.type === "win" : e.type === "sin");

  if (!logs.length) return <div style={{ padding: "3rem 1.25rem", textAlign: "center", color: "#C4C0BB", fontSize: 15, lineHeight: 1.7, fontStyle: "italic" }}>Nothing logged yet.<br />Hit one of the big buttons to start.</div>;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{ padding: "16px 24px 12px", flexShrink: 0 }}>
        <div style={{ fontFamily: "Fraunces,serif", fontSize: 24, fontWeight: 600, color: "#1A1A1A", marginBottom: 12 }}>History</div>
        <div style={{ display: "flex", gap: 7 }}>
          {["all", "wins", "AI uses"].map(f => <button key={f} onClick={() => setFilter(f)} style={{ padding: "7px 16px", borderRadius: 20, fontSize: 13, cursor: "pointer", fontFamily: "inherit", border: `1.5px solid ${filter === f ? G : "#E4E0DA"}`, background: filter === f ? G_LIGHT : "transparent", color: filter === f ? G : "#AAA", fontWeight: filter === f ? 500 : 400 }}>{f}</button>)}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>
        {Object.entries(grouped).map(([day, entries]) => {
          const vis = filtered(entries); const isOpen = open[day] ?? false;
          const w = entries.filter(e => e.type === "win").length; const s = entries.filter(e => e.type === "sin").length;
          const pct = Math.round(w / (w + s) * 100);
          return (
            <div key={day} style={{ marginBottom: 16 }}>
              <button onClick={() => toggle(day)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "0 2px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "Fraunces,serif", fontSize: 17, fontWeight: 600, color: "#2A2A2A" }}>{day}</span>
                  <span style={{ fontSize: 12, color: "#C4C0BB" }}>{w}W · {s}A</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 48, display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ flex: 1, height: 3, background: "#F0EEE9", borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: G, borderRadius: 2 }} /></div>
                    <span style={{ fontSize: 11, color: pct >= 50 ? G : AMBER, fontWeight: 500 }}>{pct}%</span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C4C0BB" strokeWidth="2" strokeLinecap="round"><path d={isOpen ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} /></svg>
                </div>
              </button>
              {isOpen && <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {vis.length === 0 ? <div style={{ padding: "12px 0", fontSize: 13, color: "#C4C0BB", textAlign: "center" }}>No {filter} for this day</div> :
                  vis.map(l => (
                    <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 14px", borderRadius: 14, background: l.type === "win" ? G_LIGHT : SIN_BG, border: `1px solid ${l.type === "win" ? "#C8E2D5" : SIN_BORDER}` }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: l.type === "win" ? G : "#DDD5C8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {l.type === "win" ? <BrainIcon size={13} color="white" /> : <ChipIcon size={13} color="#AAA" />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: l.note ? 2 : 0 }}>
                          <span style={{ fontSize: 14, fontWeight: 500, color: l.type === "win" ? G : "#7A6654" }}>{l.category || "general"}</span>
                          {l.ctx && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 6, background: l.type === "win" ? "#C8E2D5" : "#EDE0CE", color: l.type === "win" ? "#3A7A60" : "#A08060" }}>{l.ctx}</span>}
                        </div>
                        {l.note && <div style={{ fontSize: 12, color: "#AAAAAA", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.note}</div>}
                      </div>
                      <div style={{ fontSize: 11, color: "#C4C0BB", flexShrink: 0 }}>{new Date(l.ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  ))}
              </div>}
            </div>
          );
        })}
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}

const COACH_SYSTEM = name => `You are a warm Socratic coach inside Firsthand — an app helping people be more intentional about AI use and rebuild their own thinking. The user's name is ${name || "there"}.
Your ONLY role: ask one short thoughtful question per turn. Never give advice. Never suggest solutions. Never tell them what to do. Warm and human. One question, always.`;

const COACH_PROMPTS = ["I used AI when I didn't need to", "I want to talk about a win", "I'm struggling with a habit", "I feel like I'm getting worse at thinking"];

function Coach({ profile }) {
  const [msgs, setMsgs] = useState([{ role: "assistant", content: "What's on your mind about your AI use today?" }]);
  const [input, setInput] = useState(""); const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null); const inputRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  const send = async text => {
    const content = (text || input).trim();
    if (!content || loading) return;
    const userMsg = { role: "user", content };
    const updated = [...msgs, userMsg];
    setMsgs(updated); setInput(""); setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 120, system: COACH_SYSTEM(profile?.name), messages: updated }) });
      const d = await res.json();
      setMsgs([...updated, { role: "assistant", content: d.content?.map(c => c.text || "").join("") || "What made you reach for AI in that moment?" }]);
    } catch { setMsgs([...updated, { role: "assistant", content: "What made you reach for AI in that moment?" }]); }
    setLoading(false);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{ padding: "12px 22px 10px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", background: "white", borderRadius: 14, border: "1px solid #F0EEE9" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: G, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5" /></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#333", marginBottom: 1 }}>The Coach</div>
            <div style={{ fontSize: 11, color: "#C4C0BB" }}>Only asks questions. Never answers them.</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34C759" }} /><span style={{ fontSize: 11, color: "#AAA" }}>ready</span></div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 22px 8px", display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
            {m.role === "assistant" && (i === 0 || msgs[i - 1].role === "user") && <div style={{ fontSize: 10, color: "#C4C0BB", marginBottom: 4, paddingLeft: 2 }}>The Coach</div>}
            <div style={{ maxWidth: "82%", padding: m.role === "user" ? "11px 16px" : "13px 16px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px", background: m.role === "user" ? G : "white", border: m.role === "user" ? "none" : "1px solid #EDE9E3", color: m.role === "user" ? "white" : "#2A2A2A", fontSize: 15, lineHeight: 1.65, fontWeight: 300, boxShadow: m.role === "user" ? `0 2px 12px ${G}33` : "0 1px 4px rgba(0,0,0,0.05)" }}>{m.content}</div>
          </div>
        ))}
        {loading && <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <div style={{ fontSize: 10, color: "#C4C0BB", marginBottom: 4, paddingLeft: 2 }}>The Coach</div>
          <div style={{ padding: "13px 16px", borderRadius: "4px 18px 18px 18px", background: "white", border: "1px solid #EDE9E3" }}><Dots /></div>
        </div>}
        {msgs.length <= 1 && <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, color: "#C4C0BB", marginBottom: 8, paddingLeft: 2 }}>Or start with something specific</div>
          {COACH_PROMPTS.map(p => <button key={p} onClick={() => send(p)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid #EDE9E3", background: "white", color: "#666", fontSize: 13, cursor: "pointer", fontFamily: "inherit", textAlign: "left", marginBottom: 6, boxSizing: "border-box" }}>{p}<span style={{ color: "#C4C0BB", fontSize: 16 }}>→</span></button>)}
        </div>}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: "10px 16px 14px", borderTop: "1px solid #ECEAE6", background: "rgba(247,246,243,0.98)", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
          <div style={{ flex: 1, background: "white", border: "1.5px solid #E4E0DA", borderRadius: 20, padding: "10px 16px" }}>
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="What's on your mind…" style={{ width: "100%", border: "none", outline: "none", fontSize: 15, background: "transparent", color: "#333", fontFamily: "inherit" }} />
          </div>
          <button onClick={() => send()} disabled={!input.trim() || loading} style={{ width: 42, height: 42, borderRadius: "50%", border: "none", cursor: "pointer", background: input.trim() && !loading ? G : "#ECEAE6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: input.trim() && !loading ? `0 2px 12px ${G}44` : "none" }}>
            <SendIcon size={14} color={input.trim() && !loading ? "white" : "#C4C0BB"} />
          </button>
        </div>
      </div>
    </div>
  );
}

const ONBOARD_SYS = `You are warmly onboarding someone to Firsthand — an app helping people be more intentional about AI use. Tone: warm, honest, human. Not preachy.
6-question conversation. ONE question at a time. 1-2 sentences max. No lists.
Sequence:
1. Welcome (one warm sentence) and ask their first name.
2. Use their name, ask what they do for work.
3. Ask which AI tools they use most.
4. Ask what they use AI for most day to day.
5. Ask what's one thing they wish they could do without AI.
6. Ask what success would look like in a month.
After Q6: warm 2-sentence personalised reflection using what they shared, then end with exactly: ONBOARDING_COMPLETE`;

function Onboarding({ onComplete }) {
  const [msgs, setMsgs] = useState([]); const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true); const [step, setStep] = useState(0); const [done, setDone] = useState(false);
  const bottomRef = useRef(null); const inputRef = useRef(null);
  const profile = useRef({});

  useEffect(() => {
    callClaude([{ role: "user", content: "begin" }]).then(text => { setMsgs([{ role: "assistant", content: text }]); setLoading(false); });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    if (!loading && !done) setTimeout(() => inputRef.current?.focus(), 100);
  }, [msgs, loading]);

  async function callClaude(messages) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 150, system: ONBOARD_SYS, messages }) });
      const d = await res.json();
      return d.content?.map(c => c.text || "").join("") || "";
    } catch { return "Tell me a bit more about that."; }
  }

  const HINTS = [null, null, "e.g. Claude, ChatGPT, Copilot…", "e.g. coding, writing, planning…", null, null];

  const send = async () => {
    const content = input.trim();
    if (!content || loading || done) return;
    if (step === 0) profile.current.name = content.trim().split(" ")[0];
    if (step === 1) profile.current.occupation = content;
    if (step === 2) profile.current.ai_tools = content;
    if (step === 3) profile.current.primary_uses = content;
    if (step === 4) profile.current.goal = content;
    if (step === 5) profile.current.success_definition = content;
    const userMsg = { role: "user", content };
    const updated = [...msgs, userMsg];
    setMsgs(updated); setInput(""); setLoading(true); setStep(s => s + 1);
    const text = await callClaude(updated);
    const isDone = text.includes("ONBOARDING_COMPLETE");
    const clean = text.replace("ONBOARDING_COMPLETE", "").trim();
    setMsgs([...updated, { role: "assistant", content: clean }]);
    if (isDone) { setDone(true); setTimeout(() => onComplete({ ...profile.current, onboarded: true }), 2200); }
    setLoading(false);
  };

  const progress = Math.min(step / 6, 1);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{ padding: "14px 24px 16px", flexShrink: 0 }}>
        <div style={{ height: 3, background: "#ECEAE6", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress * 100}%`, background: G, borderRadius: 2, transition: "width 0.5s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <div style={{ fontSize: 11, color: "#C4C0BB" }}>Getting to know you</div>
          <div style={{ fontSize: 11, color: step >= 6 ? G : "#C4C0BB", fontWeight: step >= 6 ? 500 : 400 }}>{step >= 6 ? "done" : `${step} of 6`}</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 22px 8px", display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "84%", padding: m.role === "user" ? "11px 16px" : "14px 18px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px", background: m.role === "user" ? G : "white", border: m.role === "user" ? "none" : "1px solid #EDE9E3", color: m.role === "user" ? "white" : "#2A2A2A", fontSize: 15, lineHeight: 1.65, fontWeight: 300, boxShadow: m.role === "user" ? `0 2px 12px ${G}33` : "0 1px 6px rgba(0,0,0,0.04)" }}>{m.content}</div>
          </div>
        ))}
        {loading && <div style={{ alignSelf: "flex-start", padding: "14px 18px", borderRadius: "4px 18px 18px 18px", background: "white", border: "1px solid #EDE9E3" }}><Dots /></div>}
        <div ref={bottomRef} />
      </div>
      {!done && <div style={{ padding: "10px 18px 20px", borderTop: "1px solid #ECEAE6", background: "rgba(247,246,243,0.98)", flexShrink: 0 }}>
        {HINTS[step] && <div style={{ fontSize: 11, color: "#C4C0BB", marginBottom: 6, paddingLeft: 4 }}>{HINTS[step]}</div>}
        <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
          <div style={{ flex: 1, background: "white", border: "1.5px solid #E4E0DA", borderRadius: 22, padding: "11px 18px" }}>
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); send(); } }} placeholder="Type your answer…" style={{ width: "100%", border: "none", outline: "none", fontSize: 15, background: "transparent", color: "#333", fontFamily: "inherit" }} />
          </div>
          <button onClick={send} disabled={!input.trim() || loading} style={{ width: 44, height: 44, borderRadius: "50%", border: "none", cursor: input.trim() && !loading ? "pointer" : "default", background: input.trim() && !loading ? G : "#ECEAE6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: input.trim() && !loading ? `0 2px 14px ${G}44` : "none" }}>
            <SendIcon size={14} color={input.trim() && !loading ? "white" : "#C4C0BB"} />
          </button>
        </div>
      </div>}
    </div>
  );
}

export default function App() {
  const [appData, setAppData] = useState(null);
  const [tab, setTab] = useState("home");
  const [customCats, setCustomCats] = useState([]);

  useEffect(() => { loadData().then(d => setAppData(d || { profile: {}, logs: [], onboarded: false })); }, []);

  const handleLog = async entry => {
    const log = { id: uid(), ts: new Date().toISOString(), ...entry };
    const d = { ...appData, logs: [...appData.logs, log] };
    setAppData(d); await saveData(d);
  };

  const handleOnboarded = async profile => {
    const d = { ...appData, profile, onboarded: true };
    setAppData(d); await saveData(d);
  };

  if (!appData) return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", maxWidth: 390, margin: "0 auto", height: 780, background: APP_BG, borderRadius: 44, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 32px 80px rgba(0,0,0,0.2),0 0 0 10px #1a1a1a,0 0 0 12px #2a2a2a" }}>
      <style>{FONTS}</style>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: G }} />
    </div>
  );

  if (!appData.onboarded) return (
    <Phone showTabs={false}>
      <Onboarding onComplete={handleOnboarded} />
    </Phone>
  );

  return (
    <Phone tab={tab} onTab={setTab}>
      {tab === "home" && <Home data={appData} onLog={handleLog} customCats={customCats} onAddCat={c => setCustomCats(cs => [...cs, c])} />}
      {tab === "history" && <History logs={appData.logs} />}
      {tab === "coach" && <Coach profile={appData.profile} />}
    </Phone>
  );
}
