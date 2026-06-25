import React, { useState, useEffect, useMemo, useRef } from "react";

/* ------------------------------------------------------------------ *
 *  Sahlen's Six Hours of the Glen — On-Track Schedule
 *  Watkins Glen International · June 25–28, 2026
 *  On-track sessions only, grouped by series, with a live "Next Up".
 * ------------------------------------------------------------------ */

// All times are ET (track local). Year/month/day, 24h.
// type: practice | qualifying | race | other
const SERIES = {
  WTSC: {
    key: "WTSC",
    name: "WeatherTech SportsCar Championship",
    short: "WeatherTech Championship",
    logo: "https://www.imsa.com/wp-content/uploads/sites/32/2022/01/IWSC_Logo_White.png",
    accent: "#E11A2C",
    sub: "GTP · LMP2 · GTD PRO · GTD",
  },
  IMPC: {
    key: "IMPC",
    name: "Michelin Pilot Challenge",
    short: "Michelin Challenge",
    logo: "https://www.imsa.com/wp-content/uploads/sites/32/2022/01/IMPC_Logo_White.png",
    accent: "#1B62B0",
    sub: "GS · TCR",
  },
  LST: {
    key: "LST",
    name: "Lamborghini Super Trofeo",
    short: "Super Trofeo",
    logo: "https://www.imsa.com/wp-content/uploads/sites/32/2022/02/LBST_Logo_White.png",
    accent: "#C8A23C",
    sub: "North America",
  },
  PCCNA: {
    key: "PCCNA",
    name: "Porsche Carrera Cup North America",
    short: "Carrera Cup",
    logo: "https://www.imsa.com/wp-content/uploads/sites/32/2023/02/PCCNA_Logo_White.png",
    accent: "#D5001C",
    sub: "Rounds 7 & 8",
  },
  MC: {
    key: "MC",
    name: "Mustang Challenge",
    short: "Mustang Challenge",
    logo: "https://www.imsa.com/wp-content/uploads/sites/32/2024/01/Mustang_Challenge_Logo_White.png",
    accent: "#0033A0",
    sub: "North America",
  },
};

// Helper to build a Date in ET. Track runs in America/New_York (EDT, -04:00 in June).
const et = (d, hh, mm) => new Date(`2026-06-${d}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00-04:00`);

// On-track sessions only (practice / qualifying / race). Pulled from the
// provisional schedule. end is best-effort from listed windows.
const SESSIONS = [
  // ---- Thursday, June 25 ----
  { s: "MC",    type: "practice",   label: "Practice 1",    start: et(25, 8, 15),  end: et(25, 8, 45) },
  { s: "PCCNA", type: "practice",   label: "Practice 1",    start: et(25, 9, 0),   end: et(25, 9, 45) },
  { s: "LST",   type: "practice",   label: "Practice 1",    start: et(25, 10, 0),  end: et(25, 10, 45) },
  { s: "MC",    type: "practice",   label: "Practice 2",    start: et(25, 12, 15), end: et(25, 12, 45) },
  { s: "PCCNA", type: "practice",   label: "Practice 2",    start: et(25, 13, 0),  end: et(25, 13, 40) },
  { s: "LST",   type: "practice",   label: "Practice 2",    start: et(25, 13, 55), end: et(25, 14, 40) },
  { s: "IMPC",  type: "practice",   label: "Practice 1",    start: et(25, 14, 55), end: et(25, 15, 55) },

  // ---- Friday, June 26 ----
  { s: "MC",    type: "qualifying", label: "Qualifying",    start: et(26, 8, 0),   end: et(26, 8, 15) },
  { s: "PCCNA", type: "qualifying", label: "Qualifying",    start: et(26, 8, 30),  end: et(26, 9, 0) },
  { s: "IMPC",  type: "practice",   label: "Practice 2",    start: et(26, 9, 15),  end: et(26, 10, 15) },
  { s: "LST",   type: "qualifying", label: "Qualifying 1",  start: et(26, 10, 30), end: et(26, 10, 45) },
  { s: "LST",   type: "qualifying", label: "Qualifying 2",  start: et(26, 10, 50), end: et(26, 11, 5) },
  { s: "WTSC",  type: "practice",   label: "Practice 1 (All Classes)", start: et(26, 11, 25), end: et(26, 12, 55) },
  { s: "MC",    type: "race",       label: "Race 1 · 45 min", start: et(26, 13, 55), end: et(26, 14, 40) },
  { s: "PCCNA", type: "race",       label: "Race 1 · 40 min", start: et(26, 15, 0),  end: et(26, 15, 40) },
  { s: "LST",   type: "race",       label: "Race 1 · 50 min", start: et(26, 16, 0),  end: et(26, 16, 50) },
  { s: "IMPC",  type: "qualifying", label: "Qualifying · TCR", start: et(26, 17, 10), end: et(26, 17, 25) },
  { s: "IMPC",  type: "qualifying", label: "Qualifying · GS",  start: et(26, 17, 30), end: et(26, 17, 45) },

  // ---- Saturday, June 27 ----
  { s: "MC",    type: "race",       label: "Race 2 · 45 min", start: et(27, 8, 0),   end: et(27, 8, 45) },
  { s: "PCCNA", type: "race",       label: "Race 2 · 40 min", start: et(27, 9, 5),   end: et(27, 9, 45) },
  { s: "WTSC",  type: "practice",   label: "Practice 2 (Bronze)", start: et(27, 10, 5), end: et(27, 10, 20) },
  { s: "WTSC",  type: "practice",   label: "Practice 2 (All Classes)", start: et(27, 10, 20), end: et(27, 11, 50) },
  { s: "IMPC",  type: "race",       label: "LP Building Solutions 120 · 2 Hours", start: et(27, 13, 5), end: et(27, 15, 5) },
  { s: "WTSC",  type: "qualifying", label: "Qualifying · GTD",     start: et(27, 15, 40), end: et(27, 15, 55) },
  { s: "WTSC",  type: "qualifying", label: "Qualifying · GTD PRO", start: et(27, 16, 0),  end: et(27, 16, 15) },
  { s: "WTSC",  type: "qualifying", label: "Qualifying · LMP2",    start: et(27, 16, 20), end: et(27, 16, 35) },
  { s: "WTSC",  type: "qualifying", label: "Qualifying · GTP",     start: et(27, 16, 40), end: et(27, 16, 55) },
  { s: "LST",   type: "race",       label: "Race 2 · 50 min", start: et(27, 17, 15), end: et(27, 18, 5) },

  // ---- Sunday, June 28 ----
  { s: "WTSC",  type: "race",       label: "Sahlen's Six Hours of the Glen · 6 Hours", start: et(28, 12, 10), end: et(28, 18, 10) },
];

// Fan-facing activities (anything a spectator can actually do / watch off-track).
// Pulled from the provisional schedule. icon is an emoji glyph.
const FAN = [
  { day: 25, icon: "🚶", label: "Spectator Track Walk", note: "Walk the 3.4-mile course", start: et(25, 19, 0), end: et(25, 20, 0) },
  { day: 25, icon: "🎉", label: "IMSA Preview Party", note: "Seneca Lodge", start: et(25, 17, 30), end: et(25, 19, 30) },
  { day: 26, icon: "✍️", label: "Mustang Challenge Autograph Session", note: "Series transporter", start: et(26, 11, 15), end: et(26, 11, 45) },
  { day: 26, icon: "✍️", label: "Carrera Cup Autograph Session", note: "Fan Zone at IMSA merchandise", start: et(26, 13, 0), end: et(26, 13, 30) },
  { day: 27, icon: "✍️", label: "WeatherTech Autograph Session", note: "Team transporters, the Paddock", start: et(27, 13, 15), end: et(27, 14, 15) },
  { day: 27, icon: "🚶", label: "Pit Lane Fan Walk — Pilot Challenge", note: "Open grid pre-race", start: et(27, 12, 5), end: et(27, 12, 45) },
  { day: 28, icon: "🚶", label: "Pit Lane Fan Walk — WeatherTech", note: "Open grid before the 6 Hours", start: et(28, 11, 5), end: et(28, 11, 50) },
  { day: 28, icon: "🏁", label: "WGI Hot Laps", note: "On-track hot-lap activity", start: et(28, 8, 45), end: et(28, 9, 30) },
];

const TYPE_STYLE = {
  practice:   { label: "Practice",   bg: "rgba(255,255,255,.07)", fg: "#cfd3da" },
  qualifying: { label: "Qualifying", bg: "rgba(245,197,66,.16)",  fg: "#f5c542" },
  race:       { label: "Race",       bg: "rgba(225,26,44,.18)",   fg: "#ff5566" },
};

const DAYS = [
  { d: 25, name: "Thursday", dd: "Jun 25" },
  { d: 26, name: "Friday",   dd: "Jun 26" },
  { d: 27, name: "Saturday", dd: "Jun 27" },
  { d: 28, name: "Sunday",   dd: "Jun 28" },
];

const fmtTime = (date) =>
  date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });

const dayOf = (date) =>
  Number(date.toLocaleString("en-US", { day: "numeric", timeZone: "America/New_York" }));

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function countdown(ms) {
  if (ms <= 0) return "now";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function SeriesLogo({ series, size = 26 }) {
  const [err, setErr] = useState(false);
  if (err || !series.logo) {
    return (
      <span
        style={{
          fontWeight: 800,
          fontSize: size * 0.5,
          letterSpacing: ".06em",
          color: series.accent,
          fontFamily: "'Archivo', system-ui, sans-serif",
        }}
      >
        {series.key}
      </span>
    );
  }
  return (
    <img
      src={series.logo}
      alt={series.name}
      onError={() => setErr(true)}
      style={{ height: size, width: "auto", maxWidth: 170, objectFit: "contain", display: "block" }}
    />
  );
}

function statusOf(sess, now) {
  if (now >= sess.start && now < sess.end) return "live";
  if (now >= sess.end) return "done";
  return "upcoming";
}

export default function App() {
  const now = useNow();
  const [activeDay, setActiveDay] = useState(null);
  const [series, setSeries] = useState("ALL");
  const liveRef = useRef(null);

  // Default to the current event day (or first upcoming) once.
  useEffect(() => {
    const today = dayOf(now);
    const match = DAYS.find((d) => d.d === today) || DAYS.find((d) => d.d >= today) || DAYS[0];
    setActiveDay((prev) => prev ?? match.d);
    // eslint-disable-next-line
  }, []);

  const enriched = useMemo(
    () =>
      SESSIONS.map((s) => ({ ...s, series: SERIES[s.s], status: statusOf(s, now) })).sort(
        (a, b) => a.start - b.start
      ),
    [now]
  );

  const nextUp = useMemo(() => {
    const live = enriched.filter((s) => s.status === "live");
    if (live.length) return { mode: "live", list: live };
    const up = enriched.find((s) => s.status === "upcoming");
    return up ? { mode: "next", list: [up] } : null;
  }, [enriched]);

  const visible = useMemo(
    () =>
      enriched.filter(
        (s) => dayOf(s.start) === activeDay && (series === "ALL" || s.s === series)
      ),
    [enriched, activeDay, series]
  );

  return (
    <div style={styles.root}>
      <style>{css}</style>

      <header style={styles.header}>
        <div style={styles.eyebrow}>IMSA · Official · On-Track</div>
        <h1 style={styles.h1}>Six Hours of the Glen</h1>
        <div style={styles.sub}>
          Watkins Glen International · June 25–28, 2026 · all times ET
        </div>
      </header>

      {/* NEXT UP */}
      {nextUp && (
        <section
          ref={liveRef}
          style={{
            ...styles.nextWrap,
            borderColor: nextUp.list[0].series.accent + "66",
            background: `radial-gradient(120% 140% at 0% 0%, ${nextUp.list[0].series.accent}22, transparent 60%)`,
          }}
        >
          <div style={styles.nextHead}>
            <span
              className={nextUp.mode === "live" ? "pulse" : ""}
              style={{
                ...styles.nextTag,
                background: nextUp.mode === "live" ? "#E11A2C" : "rgba(255,255,255,.1)",
                color: nextUp.mode === "live" ? "#fff" : "#cfd3da",
              }}
            >
              {nextUp.mode === "live" ? "● ON TRACK NOW" : "NEXT UP"}
            </span>
            {nextUp.mode === "next" && (
              <span style={styles.nextCountdown}>
                in {countdown(nextUp.list[0].start - now)}
              </span>
            )}
          </div>
          {nextUp.list.map((s, i) => (
            <div key={i} style={styles.nextRow}>
              <SeriesLogo series={s.series} size={30} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={styles.nextLabel}>{s.label}</div>
                <div style={styles.nextMeta}>
                  {s.series.short} · {fmtTime(s.start)}–{fmtTime(s.end)}
                </div>
              </div>
              {nextUp.mode === "live" && (
                <span style={styles.nextRemain}>{countdown(s.end - now)}<span style={styles.nextRemainLbl}>left</span></span>
              )}
            </div>
          ))}
        </section>
      )}

      {/* DAY TABS */}
      <nav style={styles.tabs}>
        {DAYS.map((d) => {
          const on = activeDay === d.d;
          const isToday = dayOf(now) === d.d;
          return (
            <button
              key={d.d}
              onClick={() => setActiveDay(d.d)}
              style={{ ...styles.tab, ...(on ? styles.tabOn : {}) }}
            >
              <span style={styles.tabName}>{d.name.slice(0, 3)}</span>
              <span style={styles.tabDate}>{d.dd.split(" ")[1]}</span>
              {isToday && <span style={styles.todayDot} />}
            </button>
          );
        })}
      </nav>

      {/* SERIES FILTER */}
      <div style={styles.filterRow}>
        <button
          onClick={() => setSeries("ALL")}
          style={{ ...styles.chip, ...(series === "ALL" ? styles.chipOn : {}) }}
        >
          All series
        </button>
        {Object.values(SERIES).map((s) => (
          <button
            key={s.key}
            onClick={() => setSeries(s.key)}
            style={{
              ...styles.chip,
              ...(series === s.key
                ? { ...styles.chipOn, borderColor: s.accent, color: "#fff", background: s.accent + "33" }
                : {}),
            }}
          >
            {s.short}
          </button>
        ))}
      </div>

      {/* SESSIONS */}
      <main style={styles.list}>
        {visible.length === 0 && (
          <div style={styles.empty}>No on-track sessions match this filter.</div>
        )}
        {visible.map((s, i) => {
          const ts = TYPE_STYLE[s.type] || TYPE_STYLE.practice;
          const live = s.status === "live";
          const done = s.status === "done";
          return (
            <article
              key={i}
              style={{
                ...styles.card,
                opacity: done ? 0.45 : 1,
                borderLeft: `3px solid ${s.series.accent}`,
                ...(live ? styles.cardLive : {}),
              }}
            >
              <div style={styles.cardTime}>
                <div style={styles.cardStart}>{fmtTime(s.start)}</div>
                <div style={styles.cardEnd}>{fmtTime(s.end)}</div>
              </div>
              <div style={styles.cardBody}>
                <div style={styles.cardTopline}>
                  <SeriesLogo series={s.series} size={18} />
                  <span style={{ ...styles.pill, background: ts.bg, color: ts.fg }}>
                    {ts.label}
                  </span>
                  {live && <span className="pulse" style={styles.livePill}>LIVE · {countdown(s.end - now)} left</span>}
                </div>
                <div style={styles.cardLabel}>{s.label}</div>
                <div style={styles.cardSeries}>{s.series.short}</div>
              </div>
            </article>
          );
        })}
      </main>

      {/* FAN ZONE — shown after all series, filtered by active day */}
      {(() => {
        const fanToday = FAN.filter((f) => f.day === activeDay).sort((a, b) => a.start - b.start);
        if (series !== "ALL" || fanToday.length === 0) return null;
        return (
          <section style={styles.fanWrap}>
            <div style={styles.fanHead}>
              <span style={styles.fanTitle}>Trackside Events</span>
              <span style={styles.fanSub}>Things to do off the track</span>
            </div>
            <div style={styles.list}>
              {fanToday.map((f, i) => {
                const done = now >= f.end;
                return (
                  <article key={i} style={{ ...styles.fanCard, opacity: done ? 0.45 : 1 }}>
                    <div style={styles.fanIcon}>{f.icon}</div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={styles.cardLabel}>{f.label}</div>
                      <div style={styles.fanNote}>{f.note}</div>
                    </div>
                    <div style={styles.fanTime}>{fmtTime(f.start)}</div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })()}

      <footer style={styles.footer}>
        On-track sessions only. Official schedule (IMSA, 06/17/26) — subject to change.
        Support and inspection sessions omitted.
      </footer>
    </div>
  );
}

/* ----------------------------- styles ----------------------------- */
const styles = {
  root: {
    maxWidth: 480,
    margin: "0 auto",
    minHeight: "100vh",
    background: "#0a0b0d",
    color: "#e9ebef",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    padding: "0 14px 40px",
    WebkitFontSmoothing: "antialiased",
  },
  header: { padding: "26px 4px 16px" },
  eyebrow: {
    fontFamily: "'Archivo', sans-serif",
    fontSize: 11,
    letterSpacing: ".22em",
    textTransform: "uppercase",
    color: "#E11A2C",
    fontWeight: 700,
  },
  h1: {
    fontFamily: "'Archivo', sans-serif",
    fontWeight: 800,
    fontSize: 30,
    lineHeight: 1.02,
    margin: "8px 0 6px",
    letterSpacing: "-.01em",
    fontStyle: "italic",
  },
  sub: { fontSize: 12.5, color: "#8b9099", letterSpacing: ".01em" },

  nextWrap: {
    border: "1px solid",
    borderRadius: 16,
    padding: "14px 15px",
    marginBottom: 18,
  },
  nextHead: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  nextTag: {
    fontFamily: "'Archivo', sans-serif",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: ".14em",
    padding: "4px 9px",
    borderRadius: 6,
  },
  nextCountdown: { fontSize: 13, color: "#cfd3da", fontWeight: 600, fontVariantNumeric: "tabular-nums" },
  nextRow: { display: "flex", alignItems: "center", gap: 13, padding: "7px 0" },
  nextRemain: {
    flex: "0 0 auto",
    fontFamily: "'Archivo', sans-serif",
    fontWeight: 800,
    fontSize: 15,
    color: "#ff8a93",
    fontVariantNumeric: "tabular-nums",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    lineHeight: 1.1,
  },
  nextRemainLbl: { fontSize: 9.5, fontWeight: 700, color: "#9aa0a8", letterSpacing: ".1em", textTransform: "uppercase" },
  fanWrap: { marginTop: 22 },
  fanHead: { display: "flex", alignItems: "baseline", gap: 9, margin: "0 4px 12px" },
  fanTitle: {
    fontFamily: "'Archivo', sans-serif",
    fontWeight: 800,
    fontStyle: "italic",
    fontSize: 19,
    letterSpacing: ".01em",
  },
  fanSub: { fontSize: 11.5, color: "#7c828b" },
  fanCard: {
    display: "flex",
    alignItems: "center",
    gap: 13,
    background: "rgba(255,255,255,.035)",
    border: "1px solid rgba(255,255,255,.06)",
    borderLeft: "3px solid #6b7280",
    borderRadius: 13,
    padding: "12px 14px",
  },
  fanIcon: { fontSize: 20, lineHeight: 1, flex: "0 0 auto", width: 24, textAlign: "center" },
  fanNote: { fontSize: 11.5, color: "#7c828b", marginTop: 3 },
  fanTime: {
    fontSize: 13,
    fontWeight: 800,
    fontFamily: "'Archivo', sans-serif",
    fontVariantNumeric: "tabular-nums",
    flex: "0 0 auto",
    color: "#cfd3da",
  },
  nextLabel: { fontSize: 16.5, fontWeight: 700, fontFamily: "'Archivo', sans-serif", lineHeight: 1.15 },
  nextMeta: { fontSize: 12.5, color: "#9aa0a8", marginTop: 3, fontVariantNumeric: "tabular-nums" },

  tabs: { display: "flex", gap: 7, marginBottom: 12 },
  tab: {
    flex: 1,
    position: "relative",
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(255,255,255,.07)",
    borderRadius: 11,
    padding: "9px 4px",
    color: "#9aa0a8",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 1,
    transition: "all .15s",
  },
  tabOn: { background: "#fff", color: "#0a0b0d", borderColor: "#fff" },
  tabName: { fontSize: 11.5, fontWeight: 800, fontFamily: "'Archivo', sans-serif", letterSpacing: ".04em", textTransform: "uppercase" },
  tabDate: { fontSize: 14, fontWeight: 700 },
  todayDot: {
    position: "absolute", top: 6, right: 7, width: 6, height: 6,
    borderRadius: "50%", background: "#E11A2C",
  },

  filterRow: { display: "flex", gap: 7, overflowX: "auto", paddingBottom: 14, marginBottom: 2, WebkitOverflowScrolling: "touch" },
  chip: {
    flex: "0 0 auto",
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(255,255,255,.1)",
    color: "#9aa0a8",
    borderRadius: 999,
    padding: "7px 13px",
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  chipOn: { background: "#fff", color: "#0a0b0d", borderColor: "#fff" },

  list: { display: "flex", flexDirection: "column", gap: 9 },
  card: {
    display: "flex",
    gap: 13,
    background: "rgba(255,255,255,.035)",
    border: "1px solid rgba(255,255,255,.06)",
    borderRadius: 13,
    padding: "12px 14px",
    transition: "opacity .2s",
  },
  cardLive: {
    background: "rgba(225,26,44,.08)",
    border: "1px solid rgba(225,26,44,.4)",
    boxShadow: "0 0 0 1px rgba(225,26,44,.15)",
  },
  cardTime: { flex: "0 0 52px", textAlign: "right", paddingTop: 2 },
  cardStart: { fontSize: 15, fontWeight: 800, fontFamily: "'Archivo', sans-serif", fontVariantNumeric: "tabular-nums" },
  cardEnd: { fontSize: 11.5, color: "#7c828b", marginTop: 2, fontVariantNumeric: "tabular-nums" },
  cardBody: { minWidth: 0, flex: 1 },
  cardTopline: { display: "flex", alignItems: "center", gap: 9, marginBottom: 5, flexWrap: "wrap" },
  pill: { fontSize: 10, fontWeight: 800, letterSpacing: ".09em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 5, fontFamily: "'Archivo', sans-serif" },
  livePill: { fontSize: 10, fontWeight: 800, letterSpacing: ".09em", padding: "2px 7px", borderRadius: 5, background: "#E11A2C", color: "#fff", fontFamily: "'Archivo', sans-serif" },
  cardLabel: { fontSize: 14.5, fontWeight: 600, lineHeight: 1.2, color: "#f2f3f5" },
  cardSeries: { fontSize: 11.5, color: "#7c828b", marginTop: 3 },
  cardCountdown: {
    fontSize: 11.5,
    fontWeight: 700,
    color: "#9aa0a8",
    marginTop: 6,
    fontVariantNumeric: "tabular-nums",
    letterSpacing: ".01em",
  },

  empty: { textAlign: "center", color: "#7c828b", fontSize: 13, padding: "40px 0" },
  footer: { marginTop: 26, fontSize: 10.5, color: "#5e636b", lineHeight: 1.5, textAlign: "center" },
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,600;0,700;0,800;1,800&family=Inter:wght@400;500;600;700&display=swap');
* { box-sizing: border-box; }
body { margin: 0; background: #0a0b0d; }
::-webkit-scrollbar { display: none; }
.pulse { animation: pulse 1.6s ease-in-out infinite; }
@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .55 } }
button:focus-visible { outline: 2px solid #4a9eff; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .pulse { animation: none } }
`;
