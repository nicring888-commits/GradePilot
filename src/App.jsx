import React, { useEffect, useReducer, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const gradeTypes = {
  schulaufgabe: { label: "Schulaufgabe", bucket: "written", weight: 1.25 },
  kurzarbeit: { label: "Kurzarbeit", bucket: "written", weight: 1 },
  test: { label: "Test", bucket: "written", weight: 0.8 },
  muendlich: { label: "Mündlich", bucket: "oral", weight: 1 },
};

const colors = ["#00E5FF", "#36D399", "#FFB300", "#9B8CFF", "#FF6B9D", "#2DD4BF"];

const initialSubjects = [
  {
    id: "math",
    name: "Mathe",
    color: "#00E5FF",
    target: 3,
    weights: { written: 0.65, oral: 0.35 },
    next: { title: "Schulaufgabe", date: "2026-06-19", impact: "hoch" },
    grades: [
      { id: "m1", value: 4, type: "schulaufgabe", date: "2026-02-12" },
      { id: "m2", value: 3.7, type: "muendlich", date: "2026-03-06" },
      { id: "m3", value: 4.3, type: "kurzarbeit", date: "2026-04-11" },
      { id: "m4", value: 3.3, type: "test", date: "2026-05-03" },
    ],
  },
  {
    id: "german",
    name: "Deutsch",
    color: "#36D399",
    target: 2,
    weights: { written: 0.6, oral: 0.4 },
    next: { title: "Aufsatz", date: "2026-06-12", impact: "mittel" },
    grades: [
      { id: "d1", value: 2.3, type: "schulaufgabe", date: "2026-02-02" },
      { id: "d2", value: 2, type: "muendlich", date: "2026-03-15" },
      { id: "d3", value: 2.7, type: "kurzarbeit", date: "2026-04-18" },
      { id: "d4", value: 2.3, type: "muendlich", date: "2026-05-12" },
    ],
  },
  {
    id: "english",
    name: "Englisch",
    color: "#9B8CFF",
    target: 2,
    weights: { written: 0.55, oral: 0.45 },
    next: { title: "Speaking Test", date: "2026-06-09", impact: "hoch" },
    grades: [
      { id: "e1", value: 2, type: "schulaufgabe", date: "2026-02-08" },
      { id: "e2", value: 1.7, type: "muendlich", date: "2026-03-17" },
      { id: "e3", value: 2.3, type: "test", date: "2026-04-25" },
      { id: "e4", value: 2, type: "muendlich", date: "2026-05-21" },
    ],
  },
  {
    id: "history",
    name: "Geschichte",
    color: "#FFB300",
    target: 2,
    weights: { written: 0.4, oral: 0.6 },
    next: { title: "Kurzarbeit", date: "2026-06-26", impact: "niedrig" },
    grades: [
      { id: "h1", value: 3, type: "muendlich", date: "2026-02-20" },
      { id: "h2", value: 2.7, type: "test", date: "2026-03-29" },
      { id: "h3", value: 2.3, type: "muendlich", date: "2026-04-28" },
      { id: "h4", value: 2, type: "kurzarbeit", date: "2026-05-19" },
    ],
  },
  {
    id: "physics",
    name: "Physik",
    color: "#FF6B9D",
    target: 3,
    weights: { written: 0.7, oral: 0.3 },
    next: { title: "Test", date: "2026-06-16", impact: "hoch" },
    grades: [
      { id: "p1", value: 4.7, type: "schulaufgabe", date: "2026-02-17" },
      { id: "p2", value: 4, type: "muendlich", date: "2026-03-19" },
      { id: "p3", value: 5, type: "kurzarbeit", date: "2026-04-22" },
      { id: "p4", value: 4.3, type: "test", date: "2026-05-24" },
    ],
  },
];

function reducer(state, action) {
  if (action.type === "add-grade") {
    return state.map((subject) =>
      subject.id === action.subjectId
        ? { ...subject, grades: [...subject.grades, action.grade] }
        : subject,
    );
  }
  if (action.type === "add-subject") return [...state, action.subject];
  if (action.type === "target") {
    return state.map((subject) =>
      subject.id === action.subjectId ? { ...subject, target: action.target } : subject,
    );
  }
  return state;
}

function uid() {
  return crypto.randomUUID?.() ?? String(Date.now() + Math.random());
}

function toNumber(value) {
  return globalThis.Number(value);
}

function isFiniteNumber(value) {
  return globalThis.Number.isFinite(value);
}

function clamp(value, min = 1, max = 6) {
  return Math.max(min, Math.min(max, toNumber(value)));
}

function format(value) {
  return isFiniteNumber(value) ? value.toFixed(1).replace(".", ",") : "--";
}

function average(grades, weights) {
  if (!grades.length) return null;
  const buckets = { written: [], oral: [] };
  grades.forEach((grade) => {
    const meta = gradeTypes[grade.type] ?? gradeTypes.schulaufgabe;
    buckets[meta.bucket].push({ ...grade, weight: meta.weight });
  });

  const parts = Object.entries(buckets)
    .map(([bucket, list]) => {
      if (!list.length) return null;
      const total = list.reduce((sum, grade) => sum + grade.weight, 0);
      return {
        bucket,
        weight: weights[bucket],
        value: list.reduce((sum, grade) => sum + grade.value * grade.weight, 0) / total,
      };
    })
    .filter(Boolean);

  const activeWeight = parts.reduce((sum, part) => sum + part.weight, 0);
  return parts.reduce((sum, part) => sum + part.value * (part.weight / activeWeight), 0);
}

function subjectAverage(subject) {
  return average(subject.grades, subject.weights);
}

function withNext(subject, value, type = "schulaufgabe") {
  return average([...subject.grades, { id: "next", value, type, date: "2026-07-01" }], subject.weights);
}

function overall(subjects) {
  const values = subjects.map(subjectAverage).filter(isFiniteNumber);
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function tone(value) {
  if (!isFiniteNumber(value)) return "neutral";
  if (value <= 2.4) return "good";
  if (value < 3.6) return "neutral";
  if (value < 4.6) return "warning";
  return "critical";
}

function trend(subject) {
  if (subject.grades.length < 2) return { arrow: "→", label: "stabil", score: 0 };
  const sorted = [...subject.grades].sort((a, b) => new Date(a.date) - new Date(b.date));
  const mid = Math.ceil(sorted.length / 2);
  const first = average(sorted.slice(0, mid), subject.weights);
  const second = average(sorted.slice(mid), subject.weights);
  const delta = first - second;
  if (delta > 0.2) return { arrow: "↑", label: "besser", score: delta };
  if (delta < -0.2) return { arrow: "↓", label: "riskant", score: delta };
  return { arrow: "→", label: "stabil", score: delta };
}

function targetPlan(subject, target = subject.target, count = 1) {
  const future = (value) =>
    Array.from({ length: count }, (_, index) => ({
      id: `f-${index}`,
      value,
      type: "schulaufgabe",
      date: "2026-07-01",
    }));
  const best = average([...subject.grades, ...future(1)], subject.weights);
  const worst = average([...subject.grades, ...future(6)], subject.weights);
  if (best > target) {
    return { status: "impossible", required: 1, message: `Selbst mit einer 1 bleibt ${format(best)}.` };
  }
  if (worst <= target) {
    return { status: "safe", required: 6, message: "Das Ziel ist aktuell abgesichert." };
  }
  let low = 1;
  let high = 6;
  for (let i = 0; i < 28; i += 1) {
    const mid = (low + high) / 2;
    const simulated = average([...subject.grades, ...future(mid)], subject.weights);
    if (simulated <= target) low = mid;
    else high = mid;
  }
  return { status: "active", required: low, message: `Nächste Arbeit: ${format(low)} oder besser.` };
}

function forecast(subject) {
  const current = subjectAverage(subject) ?? 3;
  const realisticGrade = clamp(current - trend(subject).score);
  const future = (value) => [
    { id: "fw", value, type: "schulaufgabe", date: "2026-06-30" },
    { id: "fk", value, type: "kurzarbeit", date: "2026-07-10" },
    { id: "fm", value, type: "muendlich", date: "2026-07-18" },
  ];
  return {
    best: average([...subject.grades, ...future(1)], subject.weights),
    realistic: average([...subject.grades, ...future(realisticGrade)], subject.weights),
    worst: average([...subject.grades, ...future(6)], subject.weights),
  };
}

function risk(subject) {
  const avg = subjectAverage(subject);
  const plan = targetPlan(subject);
  return Math.min(
    100,
    Math.round(
      Math.max(0, avg - 2.2) * 18 +
        (avg >= 4 ? 28 : 0) +
        (plan.status === "impossible" ? 32 : 0) +
        (plan.required <= 2.2 ? 16 : 0),
    ),
  );
}

export default function App() {
  const [subjects, dispatch] = useReducer(reducer, initialSubjects);
  const [mode, setMode] = useState("dark");
  const [user, setUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [selectedId, setSelectedId] = useState("math");
  const selected = subjects.find((subject) => subject.id === selectedId) ?? subjects[0];

  useEffect(() => {
    document.body.className = mode;
  }, [mode]);

  if (!user) return <Login mode={mode} setMode={setMode} onLogin={setUser} />;

  return (
    <div className="app-shell">
      <Header mode={mode} setMode={setMode} user={user} onLogout={() => setUser(null)} />
      <main className="content">
        {view === "dashboard" && <Dashboard subjects={subjects} go={setView} select={setSelectedId} />}
        {view === "subjects" && <Subjects subjects={subjects} selected={selected} select={setSelectedId} dispatch={dispatch} />}
        {view === "simulator" && <Simulator subjects={subjects} selected={selected} select={setSelectedId} />}
        {view === "forecast" && <Forecast subjects={subjects} />}
      </main>
      <nav className="bottom-nav">
        {["dashboard", "subjects", "simulator", "forecast"].map((item) => (
          <button key={item} className={view === item ? "active" : ""} onClick={() => setView(item)}>
            {item === "dashboard" ? "▦" : item === "subjects" ? "≡" : item === "simulator" ? "⌁" : "▰"}
            <span>{item === "dashboard" ? "Dashboard" : item === "subjects" ? "Fächer" : item === "simulator" ? "Simulator" : "Prognose"}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function Login({ mode, setMode, onLogin }) {
  const [email, setEmail] = useState("demo@gradepilot.de");
  const [password, setPassword] = useState("notenpilot");
  const [classLevel, setClassLevel] = useState("10");
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Bitte E-Mail und Passwort eingeben.");
      return;
    }
    onLogin({
      name: email.split("@")[0].replace(/[._-]/g, " ") || "Demo",
      classLevel,
    });
  }

  return (
    <div className="login-shell">
      <header className="login-bar">
        <Logo />
        <ThemeButton mode={mode} setMode={setMode} />
      </header>
      <main className="login-grid">
        <section className="login-copy">
          <p className="eyebrow">Secure Grade Banking</p>
          <h1>Dein Noten-Cockpit ist gesichert.</h1>
          <p>GradePilot kombiniert Zielnoten, Risikoanalyse und Zeugnisprognosen in einer Oberfläche, die sich wie Banking für Noten anfühlt.</p>
          <div className="ledger">
            <Metric label="Session" value="Memory" />
            <Metric label="Daten" value="Demo" />
            <Metric label="Modus" value={mode} />
          </div>
        </section>
        <form className="login-card" onSubmit={submit}>
          <div className="lock">●</div>
          <h2>Einloggen</h2>
          <label>E-Mail<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Passwort<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <label>
            Klassenstufe
            <select value={classLevel} onChange={(event) => setClassLevel(event.target.value)}>
              {Array.from({ length: 9 }, (_, index) => String(index + 5)).map((grade) => (
                <option key={grade} value={grade}>Klasse {grade}</option>
              ))}
            </select>
          </label>
          {error && <p className="error">{error}</p>}
          <button className="primary">Sicher einloggen</button>
          <button type="button" className="secondary" onClick={() => onLogin({ name: "Demo Nutzer", classLevel: "10" })}>Demo-Konto öffnen</button>
        </form>
      </main>
    </div>
  );
}

function Header({ mode, setMode, user, onLogout }) {
  return (
    <header className="topbar">
      <Logo />
      <div className="actions">
        <span className="user-pill">{user.name} · Klasse {user.classLevel}</span>
        <ThemeButton mode={mode} setMode={setMode} />
        <button className="icon" onClick={onLogout} title="Abmelden">↗</button>
      </div>
    </header>
  );
}

function Logo() {
  return <div className="logo"><span>GP</span><strong>GradePilot</strong></div>;
}

function ThemeButton({ mode, setMode }) {
  return <button className="icon rotate" onClick={() => setMode(mode === "dark" ? "light" : "dark")}>{mode === "dark" ? "☾" : "☀"}</button>;
}

function Dashboard({ subjects, go, select }) {
  const critical = subjects
    .filter((subject) => subjectAverage(subject) >= 4 || targetPlan(subject).status === "impossible")
    .sort((a, b) => risk(b) - risk(a));
  const worst = critical[0] ?? subjects[0];
  const plan = targetPlan(worst, worst.target, 2);

  return (
    <div className="stack">
      <section className="hero panel">
        <div>
          <p className="eyebrow">Gesamtschnitt live</p>
          <GradeValue value={overall(subjects)} className="hero-number" />
          <p>Gewichtete Durchschnitte, Zielstatus und Warnungen auf einen Blick.</p>
        </div>
        <div className="terminal">
          <Metric label="Fächer" value={subjects.length} />
          <Metric label="Kritisch" value={critical.length} />
          <Metric label="Ziel sicher" value={subjects.length - critical.length} />
        </div>
      </section>

      <section className="grid two">
        <div>
          <Title over="Portfolio" text="Fächerübersicht" />
          <div className="cards">
            {subjects.map((subject) => (
              <button className="subject-card" key={subject.id} onClick={() => { select(subject.id); go("subjects"); }}>
                <div><span className="dot" style={{ background: subject.color }} />{subject.name}<Trend subject={subject} /></div>
                <GradeValue value={subjectAverage(subject)} className={tone(subjectAverage(subject))} />
                <small>{targetPlan(subject).message}</small>
              </button>
            ))}
          </div>
        </div>
        <div>
          <Warning critical={critical} subjects={subjects} />
          <Heatmap subjects={subjects} />
        </div>
      </section>

      <section className="grid two">
        <div className="panel">
          <Title over="Nächste Arbeit" text="Was steht an?" />
          {subjects.slice(0, 3).map((subject) => (
            <div className="row" key={subject.id}>
              <span>{subject.name}<small>{subject.next.title} · {subject.next.date}</small></span>
              <b>{subject.next.impact}</b>
            </div>
          ))}
        </div>
        <div className="widget panel">
          <Title over="Widget" text="iOS Vorschau" />
          <GradeValue value={overall(subjects)} className="widget-number" />
          <p>Kritisch: {worst.name}</p>
          <b>Benötigt: {format(plan.required)}</b>
        </div>
      </section>
    </div>
  );
}

function Subjects({ subjects, selected, select, dispatch }) {
  const [grade, setGrade] = useState(2);
  const [type, setType] = useState("schulaufgabe");
  const [name, setName] = useState("");
  const chartData = selected.grades.map((entry, index) => ({ name: index + 1, note: entry.value }));

  return (
    <div className="grid subjects-layout">
      <aside className="panel">
        <Title over="Fächer" text="Auswählen" />
        {subjects.map((subject) => (
          <button key={subject.id} className={`select-row ${subject.id === selected.id ? "active" : ""}`} onClick={() => select(subject.id)}>
            <span>{subject.name}</span>
            <GradeValue value={subjectAverage(subject)} />
          </button>
        ))}
        <form onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          const written = 0.6;
          dispatch({
            type: "add-subject",
            subject: {
              id: uid(),
              name,
              color: colors[subjects.length % colors.length],
              target: 3,
              weights: { written, oral: 1 - written },
              next: { title: "Schulaufgabe", date: "2026-07-01", impact: "mittel" },
              grades: [],
            },
          });
          setName("");
        }}>
          <label>Neues Fach<input value={name} onChange={(event) => setName(event.target.value)} placeholder="z.B. Chemie" /></label>
          <button className="primary">Fach anlegen</button>
        </form>
      </aside>
      <section className="stack">
        <div className="detail panel">
          <div><p className="eyebrow">Aktives Fach</p><h2>{selected.name}</h2></div>
          <GradeValue value={subjectAverage(selected)} className={`big ${tone(subjectAverage(selected))}`} />
        </div>
        <form className="panel form" onSubmit={(event) => {
          event.preventDefault();
          dispatch({
            type: "add-grade",
            subjectId: selected.id,
            grade: { id: uid(), value: clamp(grade), type, date: new Date().toISOString().slice(0, 10) },
          });
        }}>
          <label>Note<input type="number" min="1" max="6" step="0.1" value={grade} onChange={(event) => setGrade(event.target.value)} /></label>
          <label>Typ<select value={type} onChange={(event) => setType(event.target.value)}>{Object.entries(gradeTypes).map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}</select></label>
          <button className="primary">Note speichern</button>
        </form>
        <Target selected={selected} dispatch={dispatch} />
        <Chart data={chartData} color={selected.color} />
      </section>
    </div>
  );
}

function Target({ selected, dispatch }) {
  const plan = targetPlan(selected);
  return (
    <div className="panel">
      <Title over="Zielnote" text="Was ist nötig?" />
      <select value={selected.target} onChange={(event) => dispatch({ type: "target", subjectId: selected.id, target: toNumber(event.target.value) })}>
        {[1, 2, 3, 4, 5, 6].map((grade) => <option key={grade} value={grade}>Ich will eine {grade}</option>)}
      </select>
      <div className={`result ${plan.status}`}>{plan.status === "safe" ? "Ziel sicher" : `${format(plan.required)} nötig`}<small>{plan.message}</small></div>
    </div>
  );
}

function Simulator({ subjects, selected, select }) {
  const [next, setNext] = useState(2.5);
  const current = subjectAverage(selected);
  const simulated = withNext(selected, next);
  const delta = current - simulated;
  return (
    <div className="grid two">
      <section className="panel">
        <Title over="Simulator" text="Nächste Note" />
        <label>Fach<select value={selected.id} onChange={(event) => select(event.target.value)}>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>
        <label>Note {format(toNumber(next))}<input type="range" min="1" max="6" step="0.1" value={next} onChange={(event) => setNext(toNumber(event.target.value))} /></label>
        <div className="ledger">
          <Metric label="Aktuell" value={format(current)} />
          <Metric label="Danach" value={format(simulated)} />
          <Metric label="Delta" value={`${delta >= 0 ? "+" : "-"}${format(Math.abs(delta))}`} />
        </div>
      </section>
      <section className="panel">
        <Title over={selected.name} text="Live-Vorschau" />
        <Chart data={[...selected.grades.map((gradeItem, index) => ({ name: index + 1, note: gradeItem.value })), { name: "next", note: toNumber(next) }]} color="var(--accent)" />
      </section>
    </div>
  );
}

function Forecast({ subjects }) {
  const data = subjects.map((subject) => ({ name: subject.name, color: subject.color, ...forecast(subject) }));
  return (
    <div className="stack">
      <Title over="Zeugnisprognose" text="Best Case bis Worst Case" />
      <div className="forecast-grid">
        {data.map((item) => (
          <div className="panel" key={item.name}>
            <div className="row"><b>{item.name}</b><GradeValue value={item.realistic} className={tone(item.realistic)} /></div>
            <Range item={item} />
          </div>
        ))}
      </div>
      <div className="panel">
        <ResponsiveContainer width="100%" height={330}>
          <BarChart data={data} layout="vertical" margin={{ left: 30, right: 20 }}>
            <CartesianGrid stroke="var(--grid)" strokeDasharray="3 8" />
            <XAxis type="number" domain={[1, 6]} reversed />
            <YAxis type="category" dataKey="name" />
            <Tooltip />
            <Bar dataKey="realistic" radius={6}>{data.map((item) => <Cell key={item.name} fill={item.color} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Chart({ data, color }) {
  if (!data.length) return <div className="empty">Noch keine Noten. Trage die erste Leistung ein.</div>;
  return (
    <div className="panel chart">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid stroke="var(--grid)" strokeDasharray="3 8" />
          <XAxis dataKey="name" />
          <YAxis domain={[1, 6]} reversed />
          <Tooltip />
          <Line type="monotone" dataKey="note" stroke={color} strokeWidth={3} dot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function Warning({ critical, subjects }) {
  const top = critical[0] ?? subjects[0];
  const plan = targetPlan(top, top.target, 2);
  return (
    <div className={`panel warning-box ${critical.length ? "alert" : ""}`}>
      <Title over="Risk Engine" text="Kritische Fächer" />
      {critical.length ? critical.slice(0, 3).map((subject) => <div className="row" key={subject.id}><span>{subject.name}</span><GradeValue value={subjectAverage(subject)} /></div>) : <p>Keine akute Warnung.</p>}
      <p>In {top.name} brauchst du in den nächsten 2 Arbeiten mindestens eine {Math.max(1, Math.floor(plan.required))}, um noch eine {top.target} zu erreichen.</p>
    </div>
  );
}

function Heatmap({ subjects }) {
  return (
    <div className="heatmap">
      {subjects.map((subject) => {
        const score = risk(subject);
        return <div className="heat" key={subject.id} style={{ "--risk": `${score}%`, "--heat": score > 70 ? "var(--critical)" : score > 42 ? "var(--warning)" : "var(--good)" }}><span>{subject.name}</span><b>{score}</b></div>;
      })}
    </div>
  );
}

function Range({ item }) {
  const best = ((item.best - 1) / 5) * 100;
  const worst = ((item.worst - 1) / 5) * 100;
  const real = ((item.realistic - 1) / 5) * 100;
  return <div className="range"><span style={{ left: `${best}%`, width: `${Math.max(6, worst - best)}%`, background: item.color }} /><i style={{ left: `${real}%` }} /></div>;
}

function Metric({ label, value }) {
  return <div className="metric"><span>{label}</span><b>{value}</b></div>;
}

function GradeValue({ value, className = "" }) {
  return <b className={`num ${className}`}>{typeof value === "number" ? format(value) : value}</b>;
}

function Trend({ subject }) {
  const item = trend(subject);
  return <small className={`trend ${item.label}`}>{item.arrow} {item.label}</small>;
}

function Title({ over, text }) {
  return <div className="title"><p className="eyebrow">{over}</p><h2>{text}</h2></div>;
}
