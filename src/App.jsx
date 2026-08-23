import React, { useState, useEffect, useMemo } from "react";
import {
  Dumbbell, CalendarDays, BarChart2, TrendingUp, Trophy, Settings,
  Plus, Trash2, Search, Star, X, Save, ChevronLeft, ChevronRight, ChevronDown, Info, Download
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from "recharts";
import * as XLSX from "xlsx";
import { loadGymData, saveField } from "./supabaseClient";

const MUSCLE_GROUPS = ["Petto", "Spalle", "Dorso", "Gambe", "Bicipiti", "Tricipiti", "Calisthenics", "Polpacci", "Addome", "Altro"];
const GROUP_ORDER = ["Petto", "Spalle", "Dorso", "Gambe", "Bicipiti", "Tricipiti", "Calisthenics"];
const DAYS = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];
const MONTHS_IT = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
const RECUPERO_OPTIONS = ["30 sec", "1 min", "1,5 min", "2 min", "2,5 min", "3 min"];

const DEFAULT_EXERCISES = [
  { id: "e2", name: "Panca inclinata bilanciere", muscle: "Petto", secondary: "Spalle", equipment: "Bilanciere", favorite: false },
  { id: "e3", name: "Panca piana manubri", muscle: "Petto", secondary: "Tricipiti", equipment: "Manubri", favorite: false },
  { id: "e4", name: "Panca inclinata manubri", muscle: "Petto", secondary: "Spalle", equipment: "Manubri", favorite: false },
  { id: "e5", name: "Chest press macchina", muscle: "Petto", secondary: "Tricipiti", equipment: "Macchina", favorite: false },
  { id: "e6", name: "Chest press inclinata macchina", muscle: "Petto", secondary: "Tricipiti", equipment: "Macchina", favorite: false },
  { id: "e7", name: "Chest press convergente", muscle: "Petto", secondary: "Tricipiti", equipment: "Macchina", favorite: false },
  { id: "e8", name: "Croci ai cavi bassi verso l'alto (upper chest)", muscle: "Petto", secondary: "", equipment: "Cavi", favorite: false },
  { id: "e8b", name: "Croci ai cavi alti verso il basso", muscle: "Petto", secondary: "", equipment: "Cavi", favorite: false },
  { id: "e8c", name: "Croci ai cavi altezza petto", muscle: "Petto", secondary: "", equipment: "Cavi", favorite: false },
  { id: "e8d", name: "Croci con manubri panca piana", muscle: "Petto", secondary: "", equipment: "Manubri", favorite: false },
  { id: "e8e", name: "Croci con manubri panca inclinata", muscle: "Petto", secondary: "", equipment: "Manubri", favorite: false },
  { id: "e8f", name: "Pec deck / Butterfly macchina", muscle: "Petto", secondary: "", equipment: "Macchina", favorite: false },
  { id: "e8g", name: "Pullover manubrio", muscle: "Petto", secondary: "Dorso", equipment: "Manubri", favorite: false },
  { id: "e8h", name: "Push up / Piegamenti a corpo libero", muscle: "Petto", secondary: "Tricipiti", equipment: "Corpo libero", favorite: false },
  { id: "e8i", name: "Dip alle parallele (petto)", muscle: "Petto", secondary: "Tricipiti", equipment: "Parallele", favorite: false }
];

const REQUIRED_EXERCISES = {
  Petto: [
    "Panca piana",
    "Panca inclinata bilanciere",
    "Croci ai cavi alti verso il basso",
    "Dip alle parallele (petto)",
    "Panca piana manubri",
    "Panca inclinata manubri",
    "Croci ai cavi bassi verso l'alto (upper chest)",
    "Push up / Piegamenti a corpo libero"
  ],
  Dorso: [
    "Lat Machine presa larga",
    "Lat Machine presa supina",
    "Lat Machine presa singola",
    "Trazioni a presa larga",
    "Trazioni presa supina",
    "Trazioni presa neutra",
    "Pulley basso al cavo",
    "Pulley basso presa singola",
    "Rematore Low Row",
    "Rematore con bilanciere",
    "Rematore con manubrio",
    "T-Bar Row con bilanciere",
    "Pulldown a braccia tese barra",
    "Pulldown a braccia tese corda"
  ],
  Spalle: [
    "Military Press bilanciere",
    "Military Press manubri",
    "Shoulder Press macchina",
    "Arnold Press",
    "Landmine Press a un braccio",
    "Alzate laterali con manubri",
    "Alzate laterali ai cavi",
    "Alzate laterali macchina",
    "Alzate frontali con manubri",
    "Alzate frontali con bilanciere",
    "Alzate frontali ai cavi",
    "Alzate frontali con disco",
    "Alzate frontali con kettlebell",
    "Reverse Pec Deck",
    "Alzate posteriori con manubri",
    "Reverse Fly ai cavi",
    "Reverse Fly con manubri",
    "Face Pull",
    "Tirate al mento con bilanciere",
    "Tirate al mento con manubri"
  ],
  Tricipiti: [
    "Push Down ai cavi con barra",
    "Push Down ai cavi con corda",
    "Push Down ai cavi presa inversa",
    "Estensioni sopra la testa ai cavi con corda",
    "French Press con bilanciere EZ",
    "French Press con manubrio",
    "Estensioni dietro la testa con manubrio",
    "Estensioni dietro la testa al cavo",
    "Dip alle parallele",
    "Dip alla macchina assistita",
    "Panca presa stretta",
    "Kickback Manubrio inclinato in avanti",
    "Kickback Cavi inclinato in avanti",
    "Diamond Push-Up"
  ],
  Bicipiti: [
    "Curl bilanciere EZ",
    "Curl bilanciere dritto",
    "Curl manubri",
    "Curl manubri su panca inclinata",
    "Curl ai cavi con barra",
    "Curl ai cavi con corda",
    "Curl ai cavi unilaterale",
    "Curl alla panca Scott EZ",
    "Curl alla panca Scott manubri",
    "Bayesian Curl ai cavi"
  ],
  Gambe: [
    "Squat bilanciere",
    "Squat Multipower",
    "Squat Macchina verticale",
    "Leg Press 45° Pressa",
    "Leg Press orizzontale Pressa",
    "Leg Extension",
    "Affondi manubri",
    "Bulgarian Split Squat",
    "Leg Curl sdraiato",
    "Leg Curl seduto",
    "Stacco rumeno bilanciere",
    "Stacco rumeno manubri",
    "Hip Thrust bilanciere",
    "Abductor Machine",
    "Adductor Machine",
    "Kickback cavo",
    "Calf Raise Polpacci seduto macchina",
    "Calf Raise Polpacci manubri",
    "Calf Raise polpacci in piedi Multipower"
  ],
  Polpacci: [
    "Calf Raise Polpacci seduto macchina",
    "Calf Raise Polpacci manubri",
    "Calf Raise polpacci in piedi Multipower"
  ],
  Addome: [
    "Crunch a terra",
    "Crunch ai cavi",
    "Crunch alla macchina",
    "Reverse Crunch",
    "Leg Raise alla sbarra",
    "Knee Raise alla sbarra",
    "Hanging Leg Raise",
    "Sollevamento gambe su panca",
    "Plank",
    "Plank laterale",
    "Russian Twist",
    "Woodchopper al cavo",
    "Pallof Press al cavo",
    "Ab Wheel",
    "Mountain Climber",
    "Side Bend manubrio"
  ],
  Calisthenics: [
    "Push Up",
    "Diamond Push Up",
    "Dip assistite",
    "Australian Pull Up",
    "Trazioni con elastico",
    "Dead Hang",
    "Scapular Pull Up",
    "Bodyweight Squat",
    "Split Squat corpo libero",
    "Step Up",
    "Glute Bridge",
    "Calf Raise corpo libero",
    "Plank",
    "Side Plank",
    "Dead Bug",
    "Bird Dog",
    "Hollow Hold",
    "Leg Raise terra"
  ]
};

function mergeRequiredExercises(list) {
  const result = [...list];
  Object.entries(REQUIRED_EXERCISES).forEach(([muscle, names]) => {
    const existing = new Set(
      result.filter((e) => e.muscle === muscle).map((e) => e.name.trim().toLowerCase())
    );
    names.forEach((name) => {
      if (!existing.has(name.trim().toLowerCase())) {
        result.push({ id: uid(), name, muscle, secondary: "", equipment: "", favorite: false });
        existing.add(name.trim().toLowerCase());
      }
    });
  });
  return result;
}

const REMOVED_EXERCISE_NAMES = ["panca piana bilanciere", "petto", "alzate laterali", "french press", "curl bicipiti", "squat", "leg press"];

function cleanExercises(list) {
  return list.filter((e) => !REMOVED_EXERCISE_NAMES.includes(e.name.trim().toLowerCase()));
}

const EXERCISE_RENAMES = [
  { muscle: "Dorso", from: "trazioni", to: "Trazioni a presa larga" },
  { muscle: "Dorso", from: "trazioni presa supina", to: "Trazioni presa supina" },
  { muscle: "Dorso", from: "trazioni presa neutra", to: "Trazioni presa neutra" },
  { muscle: "Dorso", from: "lat machine presa supina", to: "Lat Machine presa supina" },
  { muscle: "Dorso", from: "lat machine presa singola", to: "Lat Machine presa singola" }
];

function renameExercises(list) {
  return list.map((e) => {
    const match = EXERCISE_RENAMES.find((r) => r.muscle === e.muscle && e.name.trim().toLowerCase() === r.from);
    return match ? { ...e, name: match.to } : e;
  });
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function todayISO() { return new Date().toISOString().slice(0, 10); }
function dayNameFromDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return DAYS[(d.getDay() + 6) % 7];
}
function formatDateShort(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "2-digit" });
}
function formatDateLong(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function getMonday(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const diff = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function isoOf(date) { return date.toISOString().slice(0, 10); }
function round1(n) { return Math.round(n * 10) / 10; }
function setVolume(s) { return (Number(s.weight) || 0) * (Number(s.reps) || 0); }
function itemVolume(item) { return item.sets.reduce((a, s) => a + setVolume(s), 0); }
function workoutVolume(w) { return w.exercises.reduce((a, it) => a + itemVolume(it), 0); }
function daysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }function pastDatesForMuscle(workouts, exercises, muscle) {
  const dates = new Set();
  workouts.forEach((w) => {
    const has = w.exercises.some((it) => {
      const ex = exercises.find((e) => e.id === it.exerciseId);
      return ex && ex.muscle === muscle;
    });
    if (has) dates.add(w.date);
  });
  return [...dates].sort((a, b) => (a < b ? 1 : -1));
}
function datesForExercise(workouts, exerciseId) {
  return workouts
    .filter((w) => w.exercises.some((it) => it.exerciseId === exerciseId))
    .map((w) => w.date)
    .sort((a, b) => (a < b ? 1 : -1));
}
function muscleGroupsInWorkout(w, exercises) {
  const set = new Set();
  w.exercises.forEach((it) => {
    const ex = exercises.find((e) => e.id === it.exerciseId);
    if (ex) set.add(ex.muscle);
  });
  return [...set];
}

function itemsByMuscleInWorkout(w, exercises) {
  const map = {};
  w.exercises.forEach((it) => {
    const ex = exercises.find((e) => e.id === it.exerciseId);
    const m = ex ? ex.muscle : "Altro";
    if (!map[m]) map[m] = { items: [], sets: 0, reps: 0, volume: 0 };
    map[m].items.push(it);
    map[m].sets += it.sets.length;
    map[m].reps += it.sets.reduce((a, s) => a + (Number(s.reps) || 0), 0);
    map[m].volume += itemVolume(it);
  });
  return map;
}

function DateItalianPicker({ value, onChange }) {
  const d = new Date(value + "T00:00:00");
  const day = d.getDate(), month = d.getMonth(), year = d.getFullYear();
  const thisYear = new Date().getFullYear();
  const years = [];
  for (let y = thisYear + 1; y >= thisYear - 15; y--) years.push(y);
  const maxDay = daysInMonth(year, month);
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  function update(newDay, newMonth, newYear) {
    const md = daysInMonth(newYear, newMonth);
    const safeDay = Math.min(newDay, md);
    onChange(`${newYear}-${String(newMonth + 1).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`);
  }

  return (
    <div className="date-it-picker">
      <select className="input date-it-day" value={day} onChange={(e) => update(Number(e.target.value), month, year)}>
        {days.map((dd) => <option key={dd} value={dd}>{dd}</option>)}
      </select>
      <select className="input date-it-month" value={month} onChange={(e) => update(day, Number(e.target.value), year)}>
        {MONTHS_IT.map((m, i) => <option key={m} value={i}>{m}</option>)}
      </select>
      <select className="input date-it-year" value={year} onChange={(e) => update(day, month, Number(e.target.value))}>
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}

function DeleteButton({ onConfirm, small }) {
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 2500);
    return () => clearTimeout(t);
  }, [confirming]);
  if (confirming) {
    return (
      <button className="btn btn-danger" style={{ fontSize: small ? 16 : 18, padding: small ? "5px 12px" : "7px 14px" }}
        onClick={() => { onConfirm(); setConfirming(false); }}>
        Conferma
      </button>
    );
  }
  return (
    <button className="btn-icon delete-icon-btn" title="Elimina" onClick={() => setConfirming(true)}>
      <Trash2 size={small ? 22 : 26} />
    </button>
  );
}

function Plate({ value, label, unit }) {
  return (
    <div className="plate">
      <div className="plate-val">{value}</div>
      <div className="plate-label">{label}{unit ? <span className="plate-unit"> {unit}</span> : null}</div>
    </div>
  );
}

function Section({ title, right, children }) {
  return (
    <div className="card">
      <div className="section-head">
        <h2 className="font-display section-title">{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}

function HistoryCard({ card, workouts, exercises, onClose }) {
  const dayWorkouts = workouts.filter((w) => w.date === card.date);
  if (dayWorkouts.length === 0) return null;

  if (card.type === "day") {
    const allExercises = dayWorkouts.flatMap((w) => w.exercises);
    return (
      <div className="history-card">
        <div className="history-card-head">
          <span className="font-display">{formatDateLong(card.date)}</span>
          <button className="btn-icon" onClick={onClose} title="Chiudi"><X size={26} /></button>
        </div>
        {allExercises.map((it) => {
          const ex = exercises.find((e) => e.id === it.exerciseId);
          return (
            <div key={it.id} className="vertical-ex-block">
              <strong className="vertical-ex-title">{ex ? ex.name : "?"}</strong>
              {it.sets.length === 0 ? (
                <p className="muted">Nessuna serie registrata.</p>
              ) : (
                <div className="plain-set-scroll">
                <div className="plain-set-table">
                  <div className="plain-set-row plain-set-row-head">
                    <span>S</span><span>Kg</span><span>Rip</span><span>RIR</span><span>Min.</span><span>Tonn.</span><span className="plain-note-cell">Note</span>
                  </div>
                  {it.sets.map((s, i) => (
                    <div key={i} className="plain-set-row">
                      <span>{i + 1}</span>
                      <span>{s.weight || 0}</span>
                      <span>{s.reps || 0}</span>
                      <span>{s.rir !== undefined && s.rir !== "" ? s.rir : "—"}</span>
                      <span>{s.recupero || "—"}</span>
                      <span className="plain-tonn">{round1(setVolume(s))}</span>
                      <span className="plain-note-cell">{s.notes || "—"}</span>
                    </div>
                  ))}
                </div>
                </div>
              )}
              <div className="vertical-total">Totale TONN.: {round1(itemVolume(it))} kg</div>
            </div>
          );
        })}
      </div>
    );
  }

  let item = null;
  for (const w of dayWorkouts) {
    const found = w.exercises.find((it) => it.exerciseId === card.exerciseId);
    if (found) { item = found; break; }
  }
  const ex = exercises.find((e) => e.id === card.exerciseId);
  const vol = item ? itemVolume(item) : 0;
  return (
    <div className="history-card history-card-dark">
      <div className="history-card-head">
        <span className="font-display">{ex ? ex.name : "?"} — {formatDateLong(card.date)}</span>
        <button className="btn-icon" onClick={onClose} title="Chiudi"><X size={26} /></button>
      </div>
      {item && item.sets.length > 0 ? (
        <div className="plain-set-scroll">
          <div className="plain-set-table">
            <div className="plain-set-row plain-set-row-head">
              <span>S</span><span>Kg</span><span>Rip</span><span>RIR</span><span className="plain-note-cell">Note</span>
            </div>
            {item.sets.map((s, idx) => (
              <div className="plain-set-row" key={idx}>
                <span>{idx + 1}</span>
                <span className="plain-kg-box">{s.weight || 0}</span>
                <span className="plain-rip-box">{s.reps || 0}</span>
                <span>{s.rir !== undefined && s.rir !== "" ? s.rir : "—"}</span>
                <span className="plain-note-cell">{s.notes || "—"}</span>
              </div>
            ))}
          </div>
        </div>
      ) : <p className="muted">Nessuna serie registrata quel giorno.</p>}
      <div className="hint" style={{ marginTop: 4 }}>TONN. esercizio: <span className="tot-esercizio-badge">{round1(vol)} kg</span></div>
      <div className="close-card-row">
        <button className="close-card-btn" onClick={onClose}>
          Chiudi <X size={22} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}

function ExerciseSearch({ exercises, workouts, onOpenExercise }) {
  const [q, setQ] = useState("");
  const [resultsClosed, setResultsClosed] = useState(false);
  const query = q.trim().toLowerCase();
  const matches = query ? exercises.filter((e) => e.name.toLowerCase().includes(query)) : [];
  const showResults = query && !resultsClosed;

  function handleQueryChange(value) {
    setQ(value);
    setResultsClosed(false);
  }

  return (
    <Section title="Cerca">
      <div className="search-wrap">
        <Search size={24} className="search-icon" />
        <input className="input" style={{ paddingLeft: 46 }} placeholder="Cerca un esercizio, es. panca piana..."
          value={q} onChange={(e) => handleQueryChange(e.target.value)} />
      </div>
      {showResults && matches.length === 0 && <p className="muted" style={{ marginTop: 10 }}>Nessun esercizio trovato in libreria.</p>}
      {showResults && matches.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn-icon" title="Chiudi risultati" onClick={() => setResultsClosed(true)}><X size={24} /></button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {matches.map((ex) => {
              const dates = datesForExercise(workouts, ex.id);
              return (
                <div key={ex.id}>
                  <div className="font-display" style={{ fontSize: 16, marginBottom: 6 }}>
                    {ex.name} <span className="badge" style={{ marginLeft: 8 }}>{ex.muscle}</span>
                  </div>
                  {dates.length === 0 ? <p className="muted">Mai eseguito finora.</p> : (
                    <div className="date-chip-row">
                      {dates.map((d) => (
                        <button key={d} className="date-chip" onClick={() => onOpenExercise(ex.id, d)}>{formatDateShort(d)}</button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Section>
  );
}

function CompTable({ prevVol, prevReps, vol, totalReps, diffVol, diffReps, mobileOnly, desktopOnly }) {
  return (
    <div className={"comp-table" + (mobileOnly ? " comp-table-mobile" : "") + (desktopOnly ? " comp-table-desktop" : "")}>
      <span></span>
      <span className="comp-header">TONN.</span>
      <span className="comp-header">RIP</span>
      <span className="comp-label">Precedente</span>
      <span>{prevVol}</span>
      <span>{prevReps}</span>
      <span className="comp-label">Oggi</span>
      <span>{round1(vol)}</span>
      <span>{totalReps}</span>
      <span className="comp-label">Differenza</span>
      <span className="diff-badge diff-tonn">{diffVol >= 0 ? "+" : ""}{diffVol}</span>
      <span className="diff-badge diff-rip">{diffReps >= 0 ? "+" : ""}{diffReps}</span>
    </div>
  );
}

function ExerciseEditor({ item, ex, last, addSet, updateSet, removeSet, removeExercise, hideMuscleBadge, workouts, onOpenExercise }) {
  const [datesOpen, setDatesOpen] = useState(false);
  const vol = itemVolume(item);
  const totalReps = item.sets.reduce((a, s) => a + (Number(s.reps) || 0), 0);
  const prevVol = last ? round1(last.sets.reduce((a, s) => a + setVolume(s), 0)) : null;
  const prevReps = last ? last.sets.reduce((a, s) => a + (Number(s.reps) || 0), 0) : null;
  const diffVol = last ? round1(vol - prevVol) : null;
  const diffReps = last ? totalReps - prevReps : null;
  const prevDates = ex && workouts ? datesForExercise(workouts, ex.id) : [];
  return (
    <div className="exercise-block exercise-block-dark">
      <div className="exercise-block-head">
        <div>
          <div className="exercise-name">
            {ex ? ex.name : "?"} {ex && !hideMuscleBadge ? <span className="badge" style={{ marginLeft: 8 }}>{ex.muscle}</span> : null}
          </div>
          {prevDates.length > 0 && onOpenExercise && (
            <div className="last-time-block dates-section">
              <div className="dates-toggle" onClick={() => setDatesOpen(!datesOpen)}>
                <span className="hint">Allenamenti precedenti</span>
                <span className="dates-count-box">{prevDates.length}</span>
                <span className={"dates-arrow-box" + (datesOpen ? " open" : "")}>
                  <ChevronDown size={24} />
                </span>
              </div>
              {datesOpen && (
                <div className="date-chip-row">
                  {prevDates.map((d) => (
                    <button key={d} className="date-chip" onClick={() => onOpenExercise(ex.id, d)}>{formatDateShort(d)}</button>
                  ))}
                </div>
              )}
            </div>
          )}
          {last ? (
            <div className="last-time-block">
              <div className="hint">Ultima volta ({formatDateShort(last.date)}):</div>
              <div className="kg-chip-row">
                {last.sets.map((s, i) => (
                  <span key={i} className="kg-chip">{s.weight || 0} kg x {s.reps || 0}{s.rir !== undefined && s.rir !== "" ? ` (RIR ${s.rir})` : ""}</span>
                ))}
                <span className="kg-chip kg-chip-accent chip-tonn">
                  {prevVol} kg tonn.
                </span>
                <span className="kg-chip kg-chip-accent chip-rip">
                  {prevReps} rip. tot.
                </span>
              </div>
            </div>
          ) : (
            <div className="hint">Nessuno storico</div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <span className="badge">{item.sets.length} serie</span>
          {last ? (
            <CompTable prevVol={prevVol} prevReps={prevReps} vol={vol} totalReps={totalReps} diffVol={diffVol} diffReps={diffReps} desktopOnly />
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <span className="badge">{totalReps} rip. oggi</span>
              <span className="badge badge-accent">{round1(vol)} kg oggi</span>
            </div>
          )}
          <DeleteButton onConfirm={() => removeExercise(item.id)} small />
        </div>
      </div>
      {item.sets.length > 0 && (
        <div className="set-table">
          <div className="set-row set-row-head">
            <span>#</span><span>Kg</span><span>Rip</span><span>RIR</span><span>TIME</span><span>Note</span><span></span>
          </div>
          {item.sets.map((s, idx) => (
            <div className="set-row" key={idx}>
              <span className="set-idx">{idx + 1}</span>
              <input className="input input-sm input-kg" type="number" value={s.weight}
                onChange={(e) => updateSet(item.id, idx, "weight", e.target.value)} />
              <input className="input input-sm input-rip" type="number" value={s.reps}
                onChange={(e) => updateSet(item.id, idx, "reps", e.target.value)} />
              <input className="input input-sm input-rir" type="number" value={s.rir}
                onChange={(e) => updateSet(item.id, idx, "rir", e.target.value)} />
              <select className="input input-sm" value={s.recupero}
                onChange={(e) => updateSet(item.id, idx, "recupero", e.target.value)}>
                <option value="">—</option>
                {RECUPERO_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <input className="input input-sm" value={s.notes}
                onChange={(e) => updateSet(item.id, idx, "notes", e.target.value)} />
              <button className="btn-icon" onClick={() => removeSet(item.id, idx)}><X size={20} /></button>
            </div>
          ))}
        </div>
      )}
      {last && (
        <CompTable prevVol={prevVol} prevReps={prevReps} vol={vol} totalReps={totalReps} diffVol={diffVol} diffReps={diffReps} mobileOnly />
      )}
      <button className="btn btn-ghost" style={{ marginTop: 8 }} disabled={item.sets.length >= 10}
        onClick={() => addSet(item.id)}>
        <Plus size={20} /> Aggiungi serie {item.sets.length >= 10 ? "(max 10)" : ""}
      </button>
    </div>
  );
}

function orderedExerciseList(exercises, group) {
  const order = REQUIRED_EXERCISES[group] || [];
  const orderMap = new Map(order.map((name, i) => [name.trim().toLowerCase(), i]));
  return exercises
    .filter((e) => e.muscle === group)
    .map((e, originalIndex) => ({ e, originalIndex }))
    .sort((a, b) => {
      const ai = orderMap.has(a.e.name.trim().toLowerCase()) ? orderMap.get(a.e.name.trim().toLowerCase()) : Infinity;
      const bi = orderMap.has(b.e.name.trim().toLowerCase()) ? orderMap.get(b.e.name.trim().toLowerCase()) : Infinity;
      if (ai !== bi) return ai - bi;
      return a.originalIndex - b.originalIndex;
    })
    .map((x) => x.e);
}

function GroupPanel({ group, exercises, setExercises, items, addExerciseToSession, addCustomExercise, workouts, onOpenExercise, lastExecution, addSet, updateSet, removeSet, removeExercise }) {
  const list = orderedExerciseList(exercises, group);

  return (
    <div>
      <div className="group-ex-list">
        {list.map((ex) => {
          const item = items.find((it) => it.exerciseId === ex.id);
          if (item) {
            return (
              <ExerciseEditor key={ex.id} item={item} ex={ex} last={lastExecution(ex.id)} workouts={workouts}
                onOpenExercise={onOpenExercise}
                addSet={addSet} updateSet={updateSet} removeSet={removeSet} removeExercise={removeExercise} hideMuscleBadge />
            );
          }
          return (
            <div key={ex.id} className="group-ex-row" onClick={() => addExerciseToSession(ex)}>
              <span>{ex.name}</span>
              <Plus size={24} />
            </div>
          );
        })}
        {list.length === 0 && <p className="muted" style={{ padding: "4px 0" }}>Nessun esercizio ancora in libreria per {group}.</p>}
      </div>

      <div className="custom-slots">
        <div className="label">Esercizio personalizzato</div>
        {[0, 1, 2].map((idx) => (
          <CustomSlot key={idx} placeholder={`Esercizio personalizzato ${idx + 1}`}
            onAdd={(text) => addCustomExercise(group, text)} />
        ))}
      </div>
    </div>
  );
}

function CustomSlot({ placeholder, onAdd }) {
  const [text, setText] = useState("");
  function submit() {
    if (!text.trim()) return;
    onAdd(text.trim());
    setText("");
  }
  return (
    <div className="custom-slot-row">
      <input className="input" placeholder={placeholder} value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()} />
      <button className="btn-icon" onClick={submit}><Plus size={24} /></button>
    </div>
  );
}

function NuovoAllenamento({ exercises, setExercises, workouts, setWorkouts }) {
  const [date, setDate] = useState(todayISO());
  const [items, setItems] = useState([]);
  const [activeMuscle, setActiveMuscle] = useState(GROUP_ORDER[0]);
  const [muscleMenuOpen, setMuscleMenuOpen] = useState(false);
  const [openCards, setOpenCards] = useState([]);

  const otherGroups = MUSCLE_GROUPS.filter((g) => !GROUP_ORDER.includes(g));
  const allGroups = [...GROUP_ORDER, ...otherGroups];

  function openDayCard(dateStr) {
    const cardId = "day-" + dateStr;
    setOpenCards((prev) => (prev.some((c) => c.id === cardId) ? prev : [...prev, { id: cardId, type: "day", date: dateStr }]));
  }
  function openExerciseCard(exerciseId, dateStr) {
    const cardId = "ex-" + exerciseId + "-" + dateStr;
    setOpenCards((prev) => (prev.some((c) => c.id === cardId) ? prev : [...prev, { id: cardId, type: "exercise", date: dateStr, exerciseId }]));
  }
  function closeCard(cardId) { setOpenCards((prev) => prev.filter((c) => c.id !== cardId)); }

  function addExerciseToSession(ex) {
    if (items.some((it) => it.exerciseId === ex.id)) return;
    setItems([...items, { id: uid(), exerciseId: ex.id, sets: [{ weight: "", reps: "", rir: "", recupero: "", notes: "" }] }]);
  }
  function addCustomExercise(group, text) {
    const newEx = { id: uid(), name: text, muscle: group, secondary: "", equipment: "", favorite: false };
    setExercises([...exercises, newEx]);
    setItems([...items, { id: uid(), exerciseId: newEx.id, sets: [{ weight: "", reps: "", rir: "", recupero: "", notes: "" }] }]);
  }
  function removeExercise(itemId) { setItems(items.filter((it) => it.id !== itemId)); }
  function addSet(itemId) {
    setItems(items.map((it) => it.id === itemId && it.sets.length < 10
      ? { ...it, sets: [...it.sets, { weight: "", reps: "", rir: "", recupero: "", notes: "" }] }
      : it));
  }
  function updateSet(itemId, idx, field, value) {
    setItems(items.map((it) => it.id === itemId
      ? { ...it, sets: it.sets.map((s, i) => i === idx ? { ...s, [field]: value } : s) }
      : it));
  }
  function removeSet(itemId, idx) {
    setItems(items.map((it) => it.id === itemId ? { ...it, sets: it.sets.filter((_, i) => i !== idx) } : it));
  }

  function lastExecution(exerciseId) {
    const past = workouts
      .filter((w) => w.date <= date && w.exercises.some((it) => it.exerciseId === exerciseId))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    if (!past.length) return null;
    const it = past[0].exercises.find((it) => it.exerciseId === exerciseId);
    if (!it || !it.sets.length) return null;
    return { date: past[0].date, sets: it.sets };
  }

  const totalVolume = items.reduce((a, it) => a + itemVolume(it), 0);

  const groupSummary = {};
  items.forEach((it) => {
    const ex = exercises.find((e) => e.id === it.exerciseId);
    if (!ex) return;
    const g = ex.muscle;
    if (!groupSummary[g]) groupSummary[g] = { rows: [], sets: 0, volume: 0 };
    const vol = itemVolume(it);
    groupSummary[g].rows.push({ name: ex.name, volume: vol });
    groupSummary[g].sets += it.sets.length;
    groupSummary[g].volume += vol;
  });

  function save() {
    if (!items.length) return;
    setWorkouts([...workouts, { id: uid(), date, exercises: items }]);
    setItems([]);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Section title="Data e gruppo muscolare">
        <div className="date-muscle-row">
          <div>
            <label className="label">Data</label>
            <DateItalianPicker value={date} onChange={setDate} />
            <div className="hint" style={{ marginTop: 6 }}>{dayNameFromDate(date)} {formatDateLong(date)}</div>
          </div>
          <div style={{ position: "relative" }}>
            <label className="label">Gruppo muscolare</label>
            <button className="muscle-select-btn" onClick={() => setMuscleMenuOpen(!muscleMenuOpen)}>
              <span className="font-display">{activeMuscle.toUpperCase()}</span>
              <ChevronRight size={26} className={"chevron" + (muscleMenuOpen ? " open" : "")} />
            </button>
            {muscleMenuOpen && (
              <div className="dropdown muscle-dropdown">
                {allGroups.map((g) => (
                  <div key={g} className="dropdown-item" onClick={() => { setActiveMuscle(g); setMuscleMenuOpen(false); }}>
                    <span>{g}</span>
                    {g === activeMuscle && <span className="badge badge-accent">selezionato</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Section>

      <ExerciseSearch exercises={exercises} workouts={workouts} onOpenExercise={openExerciseCard} />

      {openCards.length > 0 && (
        <Section title="Schede aperte">
          <div className="history-cards-grid">
            {openCards.map((card) => (
              <HistoryCard key={card.id} card={card} workouts={workouts} exercises={exercises} onClose={() => closeCard(card.id)} />
            ))}
          </div>
        </Section>
      )}

      <Section title={`Esercizi — ${activeMuscle.toUpperCase()}`}>
        <GroupPanel group={activeMuscle} exercises={exercises} setExercises={setExercises} items={items}
          addExerciseToSession={addExerciseToSession} addCustomExercise={addCustomExercise} workouts={workouts}
          onOpenExercise={openExerciseCard} lastExecution={lastExecution} addSet={addSet} updateSet={updateSet}
          removeSet={removeSet} removeExercise={removeExercise} />
      </Section>

      {(() => {
        const otherItems = items.filter((it) => {
          const ex = exercises.find((e) => e.id === it.exerciseId);
          return ex && ex.muscle !== activeMuscle;
        });
        if (!otherItems.length) return null;
        return (
          <Section title="Esercizi della seduta — altri gruppi">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {otherItems.map((it) => {
                const ex = exercises.find((e) => e.id === it.exerciseId);
                return (
                  <ExerciseEditor key={it.id} item={it} ex={ex} last={lastExecution(it.exerciseId)} workouts={workouts}
                    onOpenExercise={openExerciseCard}
                    addSet={addSet} updateSet={updateSet} removeSet={removeSet} removeExercise={removeExercise} />
                );
              })}
            </div>
          </Section>
        );
      })()}

      {Object.keys(groupSummary).length > 0 && (
        <Section title="Riepilogo giornata">
          {Object.entries(groupSummary).map(([g, data]) => (
            <div key={g} style={{ marginBottom: 12 }}>
              <div className="font-display" style={{ fontSize: 16, marginBottom: 6 }}>{g.toUpperCase()} — {formatDateLong(date)}</div>
              {data.rows.map((r, i) => (
                <div key={i} className="record-line"><span>{r.name}</span><strong>{round1(r.volume)} kg</strong></div>
              ))}
              <div className="record-line" style={{ borderTop: "1px solid var(--border-c)", marginTop: 4, paddingTop: 6 }}>
                <span>Totale giornata {g}</span>
                <strong>{data.sets} serie — {round1(data.volume)} kg</strong>
              </div>
            </div>
          ))}
        </Section>
      )}

      <div className="save-bar">
        <Plate value={round1(totalVolume)} label="volume seduta" unit="kg" />
        <button className="btn btn-primary" disabled={!items.length} onClick={save}>
          <Save size={24} /> Salva allenamento
        </button>
      </div>
    </div>
  );
}

function MuscleEntryPanel({ muscle, exercises, setExercises, workouts, setWorkouts }) {
  const [date, setDate] = useState(todayISO());
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [openCards, setOpenCards] = useState([]);

  function openExerciseCard(exerciseId, dateStr) {
    const cardId = "ex-" + exerciseId + "-" + dateStr;
    setOpenCards((prev) => (prev.some((c) => c.id === cardId) ? prev : [...prev, { id: cardId, type: "exercise", date: dateStr, exerciseId }]));
  }
  function closeCard(cardId) { setOpenCards((prev) => prev.filter((c) => c.id !== cardId)); }

  function addExerciseToSession(ex) {
    if (items.some((it) => it.exerciseId === ex.id)) return;
    setItems([...items, { id: uid(), exerciseId: ex.id, sets: [{ weight: "", reps: "", rir: "", recupero: "", notes: "" }] }]);
  }
  function addCustomExercise(text) {
    const newEx = { id: uid(), name: text, muscle, secondary: "", equipment: "", favorite: false };
    setExercises([...exercises, newEx]);
    setItems([...items, { id: uid(), exerciseId: newEx.id, sets: [{ weight: "", reps: "", rir: "", recupero: "", notes: "" }] }]);
  }
  function removeExercise(itemId) { setItems(items.filter((it) => it.id !== itemId)); }
  function addSet(itemId) {
    setItems(items.map((it) => it.id === itemId && it.sets.length < 10
      ? { ...it, sets: [...it.sets, { weight: "", reps: "", rir: "", recupero: "", notes: "" }] }
      : it));
  }
  function updateSet(itemId, idx, field, value) {
    setItems(items.map((it) => it.id === itemId
      ? { ...it, sets: it.sets.map((s, i) => i === idx ? { ...s, [field]: value } : s) }
      : it));
  }
  function removeSet(itemId, idx) {
    setItems(items.map((it) => it.id === itemId ? { ...it, sets: it.sets.filter((_, i) => i !== idx) } : it));
  }

  function lastExecution(exerciseId) {
    const past = workouts
      .filter((w) => w.date <= date && w.exercises.some((it) => it.exerciseId === exerciseId))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    if (!past.length) return null;
    const it = past[0].exercises.find((it) => it.exerciseId === exerciseId);
    if (!it || !it.sets.length) return null;
    return { date: past[0].date, sets: it.sets };
  }

  function save() {
    if (!items.length) return;
    setWorkouts([...workouts, { id: uid(), date, exercises: items }]);
    setItems([]);
  }

  const totalVolume = items.reduce((a, it) => a + itemVolume(it), 0);
  const groupList = orderedExerciseList(exercises, muscle);
  const addedList = groupList.filter((ex) => items.some((it) => it.exerciseId === ex.id));
  const q = query.trim().toLowerCase();
  const availableList = groupList
    .filter((ex) => !items.some((it) => it.exerciseId === ex.id))
    .filter((ex) => !q || ex.name.toLowerCase().includes(q));

  return (
    <Section title={`Nuovo allenamento — ${muscle.toUpperCase()}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label className="label">Data</label>
          <DateItalianPicker value={date} onChange={setDate} />
          <div className="hint" style={{ marginTop: 6 }}>{dayNameFromDate(date)} {formatDateLong(date)}</div>
        </div>

        {openCards.length > 0 && (
          <div className="history-cards-grid">
            {openCards.map((card) => (
              <HistoryCard key={card.id} card={card} workouts={workouts} exercises={exercises} onClose={() => closeCard(card.id)} />
            ))}
          </div>
        )}

        {addedList.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {addedList.map((ex) => {
              const item = items.find((it) => it.exerciseId === ex.id);
              return (
                <ExerciseEditor key={ex.id} item={item} ex={ex} last={lastExecution(ex.id)} workouts={workouts}
                  onOpenExercise={openExerciseCard}
                  addSet={addSet} updateSet={updateSet} removeSet={removeSet} removeExercise={removeExercise} hideMuscleBadge />
              );
            })}
          </div>
        )}

        <div>
          <label className="label">Cerca in {muscle}</label>
          <div className="search-wrap">
            <Search size={22} className="search-icon" />
            <input className="input search-muscolo-input" style={{ paddingLeft: 46 }} placeholder={`Cerca un esercizio di ${muscle}...`}
              value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>

        <div className="group-ex-list">
          {availableList.map((ex) => (
            <div key={ex.id} className="group-ex-row" onClick={() => addExerciseToSession(ex)}>
              <span>{ex.name}</span>
              <Plus size={24} />
            </div>
          ))}
          {availableList.length === 0 && <p className="muted" style={{ padding: "4px 0" }}>Nessun esercizio trovato.</p>}
        </div>

        <div className="custom-slots">
          <div className="label">Esercizio personalizzato</div>
          {[0, 1, 2].map((idx) => (
            <CustomSlot key={idx} placeholder={`Esercizio personalizzato ${idx + 1}`} onAdd={addCustomExercise} />
          ))}
        </div>

        <div className="save-bar">
          <Plate value={round1(totalVolume)} label="volume sessione" unit="kg" />
          <button className="btn btn-primary" disabled={!items.length} onClick={save}>
            <Save size={24} /> Salva allenamento
          </button>
        </div>
      </div>
    </Section>
  );
}

const MUSCLE_HEADING_COLORS = {
  Petto: "#f28b82",
  Spalle: "#aef000",
  Dorso: "#82b1ff",
  Gambe: "#ffd54f",
  Bicipiti: "#ffab91",
  Tricipiti: "#80deea",
  Calisthenics: "#f48fb1",
  Polpacci: "#ce93d8",
  Addome: "#a5d6a7",
  Altro: "#cfd8dc"
};

const SPLIT_ROWS = 10;

function getSplitDayRows(split, day) {
  const val = split.days[day];
  if (Array.isArray(val)) {
    const rows = val.slice(0, SPLIT_ROWS);
    while (rows.length < SPLIT_ROWS) rows.push("");
    return rows;
  }
  const rows = new Array(SPLIT_ROWS).fill("");
  if (val) rows[0] = val;
  return rows;
}

function SplitTab({ splits, setSplits }) {
  const [newName, setNewName] = useState("");
  function addSplit() {
    if (!newName.trim()) return;
    const days = {}; DAYS.forEach((d) => (days[d] = new Array(SPLIT_ROWS).fill("")));
    setSplits([...splits, { id: uid(), name: newName.trim(), days, isActive: splits.length === 0 }]);
    setNewName("");
  }
  function updateDayRow(splitId, day, rowIndex, value) {
    setSplits(splits.map((s) => {
      if (s.id !== splitId) return s;
      const rows = getSplitDayRows(s, day);
      rows[rowIndex] = value;
      return { ...s, days: { ...s.days, [day]: rows } };
    }));
  }
  function activate(splitId) {
    setSplits(splits.map((s) => ({ ...s, isActive: s.id === splitId })));
  }
  function remove(splitId) {
    setSplits(splits.filter((s) => s.id !== splitId));
  }
  function rename(splitId, value) {
    setSplits(splits.map((s) => s.id === splitId ? { ...s, name: value } : s));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Section title="Nuova split">
        <div style={{ display: "flex", gap: 10 }}>
          <input className="input" placeholder="es. Split A - Push Pull Legs" value={newName}
            onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSplit()} />
          <button className="btn btn-primary" onClick={addSplit}><Plus size={24} /> Crea</button>
        </div>
      </Section>

      {splits.length === 0 && <p className="muted">Nessuna split creata. La settimana resta libera.</p>}

      {splits.map((s) => (
        <Section key={s.id}
          title=""
          right={null}>
          <div className="section-head" style={{ marginTop: -4 }}>
            <input className="input font-display split-name-input" value={s.name}
              onChange={(e) => rename(s.id, e.target.value)} />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {s.isActive ? <span className="badge badge-accent">Attiva</span> :
                <button className="btn btn-ghost" onClick={() => activate(s.id)}>Rendi attiva</button>}
              <DeleteButton onConfirm={() => remove(s.id)} />
            </div>
          </div>
          <div className="split-columns-wrap">
            <div className="split-columns">
              {DAYS.map((day) => {
                const rows = getSplitDayRows(s, day);
                return (
                  <div key={day} className="split-col">
                    <div className="split-col-head font-display">{day}</div>
                    <div className="split-col-body">
                      {rows.map((val, idx) => (
                        <input key={idx} className="input split-cell-input" value={val}
                          onChange={(e) => updateDayRow(s.id, day, idx, e.target.value)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>
      ))}
    </div>
  );
}

function weeklyMuscleStats(workouts, exercises, weekStartISO, weekEndISO) {
  const stats = {}; MUSCLE_GROUPS.forEach((m) => (stats[m] = { sets: 0, reps: 0, volume: 0 }));
  workouts.filter((w) => w.date >= weekStartISO && w.date <= weekEndISO).forEach((w) => {
    w.exercises.forEach((it) => {
      const ex = exercises.find((e) => e.id === it.exerciseId);
      if (!ex) return;
      const m = stats[ex.muscle] || (stats[ex.muscle] = { sets: 0, reps: 0, volume: 0 });
      it.sets.forEach((s) => {
        m.sets += 1;
        m.reps += Number(s.reps) || 0;
        m.volume += setVolume(s);
      });
    });
  });
  return stats;
}

function buildExportRows(workouts, exercises, startISO, endISO) {
  const rows = [];
  [...workouts]
    .filter((w) => w.date >= startISO && w.date <= endISO)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .forEach((w) => {
      w.exercises.forEach((it) => {
        const ex = exercises.find((e) => e.id === it.exerciseId);
        it.sets.forEach((s, idx) => {
          rows.push({
            Esercizio: ex ? ex.name : "?",
            Data: formatDateLong(w.date),
            Kg: Number(s.weight) || 0,
            Serie: idx + 1,
            Ripetizioni: Number(s.reps) || 0,
            "TIME": s.recupero || "",
            "TONN. (kg)": round1(setVolume(s))
          });
        });
      });
    });
  return rows;
}

function downloadExcel(rows, filename, emptyRow) {
  const safeRows = rows.length ? rows : [emptyRow || { Info: "Nessun dato" }];
  const ws = XLSX.utils.json_to_sheet(safeRows);
  const keys = Object.keys(safeRows[0]);
  ws["!cols"] = keys.map((k) => {
    const maxLen = safeRows.reduce((m, r) => Math.max(m, String(r[k] ?? "").length), k.length);
    return { wch: Math.min(Math.max(maxLen + 2, 8), 40) };
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dati");
  XLSX.writeFile(wb, filename);
}

function buildMuscleLogRows(finalIds, exercises, workouts) {
  const rows = [];
  finalIds.forEach((exId) => {
    const ex = exercises.find((e) => e.id === exId);
    const exRows = workouts
      .filter((w) => w.exercises.some((it) => it.exerciseId === exId))
      .map((w) => {
        const it = w.exercises.find((it) => it.exerciseId === exId);
        return { date: w.date, sets: it.sets, volume: itemVolume(it), note: firstNote(it.sets) };
      })
      .sort((a, b) => (a.date < b.date ? -1 : 1));
    exRows.forEach((r) => {
      const totalReps = r.sets.reduce((a, s) => a + (Number(s.reps) || 0), 0);
      const row = {
        Esercizio: ex ? ex.name : "?",
        Data: formatDateLong(r.date),
        "Volume (kg)": round1(r.volume),
        Ripetizioni: totalReps,
        Serie: r.sets.length
      };
      for (let i = 0; i < 10; i++) {
        const s = r.sets[i];
        row["Serie " + (i + 1)] = s ? `${s.weight || 0}x${s.reps || 0}` : "";
      }
      row["Note"] = r.note;
      rows.push(row);
    });
  });
  return rows;
}

function firstNote(sets) {
  const found = sets.find((s) => s.notes && s.notes.trim());
  return found ? found.notes : "";
}

function MuscleLogTab({ muscle, workouts, exercises }) {
  const [expandedDates, setExpandedDates] = useState({});
  const relevantIds = useMemo(() => {
    const ids = new Set();
    workouts.forEach((w) => w.exercises.forEach((it) => {
      const ex = exercises.find((e) => e.id === it.exerciseId);
      if (ex && ex.muscle === muscle) ids.add(it.exerciseId);
    }));
    return ids;
  }, [workouts, exercises, muscle]);

  const orderedIds = orderedExerciseList(exercises, muscle).map((e) => e.id).filter((id) => relevantIds.has(id));
  const extraIds = [...relevantIds].filter((id) => !orderedIds.includes(id));
  const finalIds = [...orderedIds, ...extraIds];

  function toggleExpanded(key) {
    setExpandedDates((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {finalIds.length > 0 && (
        <Section title={muscle.toUpperCase() + " — Esporta"}>
          <button className="btn btn-primary" onClick={() => downloadExcel(
            buildMuscleLogRows(finalIds, exercises, workouts),
            `${muscle.toLowerCase()}.xlsx`
          )}>
            <Download size={22} /> Esporta {muscle} su Excel
          </button>
        </Section>
      )}
      {finalIds.length === 0 && (
        <Section title={muscle.toUpperCase()}>
          <p className="muted">
            Nessun allenamento registrato ancora per {muscle}. Man mano che registri allenamenti da "Nuovo allenamento" con esercizi di questo gruppo, compariranno qui.
          </p>
        </Section>
      )}
      {finalIds.map((exId) => {
        const ex = exercises.find((e) => e.id === exId);
        const rows = workouts
          .filter((w) => w.exercises.some((it) => it.exerciseId === exId))
          .map((w) => {
            const it = w.exercises.find((it) => it.exerciseId === exId);
            return { date: w.date, sets: it.sets, volume: itemVolume(it) };
          })
          .sort((a, b) => (a.date < b.date ? -1 : 1));
        return (
          <div className="nuovo-allenamento-dark" key={exId}>
          <Section title={ex ? ex.name : "?"}>
            <div className="log-date-list">
              {rows.map((r, i) => {
                const totalReps = r.sets.reduce((a, s) => a + (Number(s.reps) || 0), 0);
                const kgMax = r.sets.length ? Math.max(...r.sets.map((s) => Number(s.weight) || 0)) : 0;
                const ripAlKgMax = r.sets
                  .filter((s) => (Number(s.weight) || 0) === kgMax)
                  .reduce((max, s) => Math.max(max, Number(s.reps) || 0), 0);
                const key = exId + "-" + r.date + "-" + i;
                const isOpen = !!expandedDates[key];
                return (
                  <div key={key} className="log-date-card">
                    <div className="log-date-card-head" onClick={() => toggleExpanded(key)}>
                      <div className="log-date-box">{formatDateShort(r.date)}</div>
                      <div className="log-kgmax-label-box">KG MAX</div>
                      <div className="log-kgmax-value-box">{kgMax} KG x {ripAlKgMax}</div>
                    </div>
                    {isOpen && (
                      <div className="log-date-card-body">
                        <div className="log-set-row">
                          <div className="log-volume-box">{round1(r.volume)} kg</div>
                          <div className="log-total-box">{totalReps}</div>
                        </div>
                        <div className="log-set-row log-set-row-titles">
                          <div className="log-kg-title-box">KG</div>
                          <div className="log-total-box">RIP</div>
                          <div className="log-rir-box">RIR</div>
                          <div className="log-note-title-box">NOTE</div>
                        </div>
                        {r.sets.map((s, idx) => (
                          <div className="log-set-row" key={idx}>
                            <div className="log-kg-value-box">{s.weight ? `${s.weight} KG` : ""}</div>
                            <div className="log-total-box">{s.reps || ""}</div>
                            <div className="log-rir-box">{s.rir !== undefined && s.rir !== "" ? s.rir : ""}</div>
                            <div className="log-note-box"><span>{s.notes || ""}</span></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
          </div>
        );
      })}
    </div>
  );
}

function StatisticheTab({ workouts, exercises, setWorkouts }) {
  const [mode, setMode] = useState("settimana");
  const [weekStart, setWeekStart] = useState(getMonday(todayISO()));
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const [year, setYear] = useState(todayISO().slice(0, 4));

  const weekEnd = addDays(weekStart, 6);
  const weekStartISO = isoOf(weekStart), weekEndISO = isoOf(weekEnd);

  const weekStats = useMemo(() => weeklyMuscleStats(workouts, exercises, weekStartISO, weekEndISO), [workouts, exercises, weekStartISO, weekEndISO]);
  const monthStats = useMemo(() => weeklyMuscleStats(workouts, exercises, month + "-01", month + "-31"), [workouts, exercises, month]);
  const yearStats = useMemo(() => weeklyMuscleStats(workouts, exercises, year + "-01-01", year + "-12-31"), [workouts, exercises, year]);

  const activeStats = mode === "settimana" ? weekStats : mode === "mese" ? monthStats : yearStats;
  const activeRows = Object.entries(activeStats).filter(([, v]) => v.sets > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="statistiche-dark">
      <Section title="Statistiche" right={
        <div style={{ display: "flex", gap: 6 }}>
          {["settimana", "mese", "anno"].map((m) => (
            <button key={m} className={"btn " + (mode === m ? "btn-primary" : "btn-ghost")} onClick={() => setMode(m)}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      }>
        {mode === "settimana" && (
          <div className="week-nav">
            <button className="btn-icon" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft size={26} /></button>
            <span className="font-display">{formatDateShort(weekStartISO)} – {formatDateShort(weekEndISO)}</span>
            <button className="btn-icon" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight size={26} /></button>
          </div>
        )}
        {mode === "mese" && (
          <input type="month" className="input" style={{ maxWidth: 200 }} value={month} onChange={(e) => setMonth(e.target.value)} />
        )}
        {mode === "anno" && (
          <input type="number" className="input" style={{ maxWidth: 140 }} value={year} onChange={(e) => setYear(e.target.value)} />
        )}

        <div className="stats-table" style={{ marginTop: 14 }}>
          <div className="stats-row stats-row-head">
            <span>Gruppo muscolare</span><span>Serie</span><span>Ripetizioni</span><span>Volume (kg)</span>
          </div>
          {activeRows.length === 0 && <p className="muted" style={{ padding: "10px 0" }}>Nessun dato per questo periodo.</p>}
          {activeRows.map(([m, v]) => (
            <div className="stats-row" key={m}>
              <span>{m}</span><span>{v.sets}</span><span>{v.reps}</span><span className="volume-badge">{round1(v.volume)}</span>
            </div>
          ))}
        </div>
      </Section>
      </div>
    </div>
  );
}

function CronologiaTab({ workouts, exercises, setWorkouts }) {
  const [weekStart, setWeekStart] = useState(getMonday(todayISO()));
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const [year, setYear] = useState(todayISO().slice(0, 4));
  const weekEnd = addDays(weekStart, 6);
  const weekStartISO = isoOf(weekStart), weekEndISO = isoOf(weekEnd);

  const [expanded, setExpanded] = useState({});
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyFilters, setHistoryFilters] = useState({});
  const ANNI_CRONOLOGIA = Array.from({ length: 6 }, (_, i) => Number(todayISO().slice(0, 4)) - 4 + i);

  function getHistoryFilter(muscle) {
    return historyFilters[muscle] || { anno: Number(todayISO().slice(0, 4)), mese: Number(todayISO().slice(5, 7)) };
  }
  function setHistoryFilter(muscle, patch) {
    setHistoryFilters((prev) => ({ ...prev, [muscle]: { ...getHistoryFilter(muscle), ...patch } }));
  }

  const muscleDayEntries = useMemo(() => {
    const map = {};
    workouts.forEach((w) => {
      const byMuscle = itemsByMuscleInWorkout(w, exercises);
      Object.entries(byMuscle).forEach(([muscle, data]) => {
        const key = w.date + ":" + muscle;
        if (!map[key]) map[key] = { key, date: w.date, muscle, items: [], sets: 0, reps: 0, volume: 0 };
        data.items.forEach((it) => map[key].items.push({ ...it, __workoutId: w.id }));
        map[key].sets += data.sets;
        map[key].reps += data.reps;
        map[key].volume += data.volume;
      });
    });
    return Object.values(map).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.muscle.localeCompare(b.muscle)));
  }, [workouts, exercises]);

  const q = historyQuery.trim().toLowerCase();
  const filteredEntries = muscleDayEntries.filter((entry) => {
    if (!q) return true;
    const dateStr = formatDateLong(entry.date).toLowerCase();
    const muscleStr = entry.muscle.toLowerCase();
    const exNames = entry.items.map((it) => {
      const ex = exercises.find((e) => e.id === it.exerciseId);
      return ex ? ex.name.toLowerCase() : "";
    }).join(" ");
    return dateStr.includes(q) || muscleStr.includes(q) || exNames.includes(q);
  });

  const groupedByMuscle = useMemo(() => {
    const map = {};
    filteredEntries.forEach((entry) => {
      if (!map[entry.muscle]) map[entry.muscle] = [];
      map[entry.muscle].push(entry);
    });
    Object.values(map).forEach((list) => list.sort((a, b) => (a.date < b.date ? 1 : -1)));
    const orderedMuscles = [...MUSCLE_GROUPS.filter((m) => map[m]), ...Object.keys(map).filter((m) => !MUSCLE_GROUPS.includes(m))];
    return orderedMuscles.map((muscle) => ({ muscle, entries: map[muscle] }));
  }, [filteredEntries]);

  function deleteMuscleDayEntry(date, muscle) {
    const updated = workouts
      .map((w) => {
        if (w.date !== date) return w;
        const filteredExercises = w.exercises.filter((it) => {
          const ex = exercises.find((e) => e.id === it.exerciseId);
          return !(ex && ex.muscle === muscle);
        });
        return { ...w, exercises: filteredExercises };
      })
      .filter((w) => w.exercises.length > 0);
    setWorkouts(updated);
  }

  const [openEx, setOpenEx] = useState({});
  const [editingEx, setEditingEx] = useState(null);

  function deleteHistoryExercise(workoutId, itemId) {
    const updated = workouts
      .map((w) => (w.id === workoutId ? { ...w, exercises: w.exercises.filter((it) => it.id !== itemId) } : w))
      .filter((w) => w.exercises.length > 0);
    setWorkouts(updated);
  }
  function updateHistorySet(workoutId, itemId, idx, field, value) {
    setWorkouts(workouts.map((w) => {
      if (w.id !== workoutId) return w;
      return {
        ...w,
        exercises: w.exercises.map((it) => it.id !== itemId ? it : {
          ...it,
          sets: it.sets.map((s, i) => i === idx ? { ...s, [field]: value } : s)
        })
      };
    }));
  }
  function addHistorySet(workoutId, itemId) {
    setWorkouts(workouts.map((w) => {
      if (w.id !== workoutId) return w;
      return {
        ...w,
        exercises: w.exercises.map((it) => it.id !== itemId || it.sets.length >= 10 ? it : {
          ...it,
          sets: [...it.sets, { weight: "", reps: "", rir: "", recupero: "", notes: "" }]
        })
      };
    }));
  }
  function removeHistorySet(workoutId, itemId, idx) {
    setWorkouts(workouts.map((w) => {
      if (w.id !== workoutId) return w;
      return {
        ...w,
        exercises: w.exercises.map((it) => it.id !== itemId ? it : {
          ...it,
          sets: it.sets.filter((_, i) => i !== idx)
        })
      };
    }));
  }

  return (
    <div className="cronologia-theme" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Section title="Esporta su Excel">
        <p className="hint" style={{ marginBottom: 12 }}>
          Ogni file contiene una riga per serie: Esercizio, Data, Kg, Serie, Ripetizioni, TIME, TONN.
        </p>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 14 }}>
          <div>
            <label className="label">Settimana</label>
            <div className="week-nav">
              <button className="btn-icon" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft size={22} /></button>
              <span className="font-display" style={{ fontSize: 20 }}>{formatDateShort(weekStartISO)} – {formatDateShort(weekEndISO)}</span>
              <button className="btn-icon" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight size={22} /></button>
            </div>
          </div>
          <div>
            <label className="label">Mese</label>
            <input type="month" className="input" style={{ maxWidth: 200 }} value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <div>
            <label className="label">Anno</label>
            <input type="number" className="input" style={{ maxWidth: 140 }} value={year} onChange={(e) => setYear(e.target.value)} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={() => downloadExcel(
            buildExportRows(workouts, exercises, weekStartISO, weekEndISO),
            `allenamenti_settimana_${weekStartISO}.xlsx`
          )}>
            <Download size={22} /> Settimana ({formatDateShort(weekStartISO)}–{formatDateShort(weekEndISO)})
          </button>
          <button className="btn btn-primary" onClick={() => downloadExcel(
            buildExportRows(workouts, exercises, month + "-01", month + "-31"),
            `allenamenti_mese_${month}.xlsx`
          )}>
            <Download size={22} /> Mese ({month})
          </button>
          <button className="btn btn-primary" onClick={() => downloadExcel(
            buildExportRows(workouts, exercises, year + "-01-01", year + "-12-31"),
            `allenamenti_anno_${year}.xlsx`
          )}>
            <Download size={22} /> Anno ({year})
          </button>
        </div>
      </Section>

      <div className="cronologia-allenamenti-dark">
      <Section title="Cronologia allenamenti" right={
        <div className="search-wrap">
          <Search size={22} className="search-icon" />
          <input className="input input-sm-w" style={{ paddingLeft: 46 }} placeholder="Cerca data, esercizio, gruppo..."
            value={historyQuery} onChange={(e) => setHistoryQuery(e.target.value)} />
        </div>
      }>
        {filteredEntries.length === 0 && <p className="muted">Nessun allenamento trovato.</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {groupedByMuscle.map(({ muscle, entries }) => {
            const filtro = getHistoryFilter(muscle);
            const entriesDelMese = entries.filter((entry) => {
              const entryMese = Number(entry.date.slice(5, 7));
              const entryAnno = Number(entry.date.slice(0, 4));
              return entryMese === filtro.mese && entryAnno === filtro.anno;
            });
            return (
            <div key={muscle}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                <div className="muscle-group-heading" style={{ marginBottom: 0, background: MUSCLE_HEADING_COLORS[muscle] || MUSCLE_HEADING_COLORS.Altro }}>{muscle.toUpperCase()}</div>
                <select className="input input-sm-w" value={filtro.mese} onChange={(e) => setHistoryFilter(muscle, { mese: Number(e.target.value) })}>
                  {MONTHS_IT.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
                <select className="input input-sm-w" value={filtro.anno} onChange={(e) => setHistoryFilter(muscle, { anno: Number(e.target.value) })}>
                  {ANNI_CRONOLOGIA.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              {entriesDelMese.length === 0 && <p className="muted" style={{ marginBottom: 8 }}>Nessun allenamento in {MONTHS_IT[filtro.mese - 1]} {filtro.anno}.</p>}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {entriesDelMese.map((entry) => {
            const isOpen = !!expanded[entry.key];
            return (
              <div key={entry.key} className="history-item">
                <div className="history-head" style={{ background: MUSCLE_HEADING_COLORS[entry.muscle] || MUSCLE_HEADING_COLORS.Altro }} onClick={() => setExpanded({ ...expanded, [entry.key]: !isOpen })}>
                  <div>
                    <span className="font-display">{formatDateLong(entry.date)}</span>
                    <span className="hint" style={{ marginLeft: 8 }}>{dayNameFromDate(entry.date)} — {entry.muscle.toUpperCase()}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span className="badge badge-rep">{entry.sets} serie</span>
                    <span className="badge badge-accent badge-tonn">{round1(entry.volume)} kg</span>
                    {isOpen && (
                      <button className="btn-icon" title="Chiudi" onClick={(e) => { e.stopPropagation(); setExpanded({ ...expanded, [entry.key]: false }); }}>
                        <X size={22} />
                      </button>
                    )}
                    <span onClick={(e) => e.stopPropagation()}>
                      <DeleteButton onConfirm={() => deleteMuscleDayEntry(entry.date, entry.muscle)} small />
                    </span>
                  </div>
                </div>
                {isOpen && (
                  <div className="history-body">
                    {entry.items.map((it) => {
                      const ex = exercises.find((e) => e.id === it.exerciseId);
                      const exKey = it.__workoutId + ":" + it.id;
                      const exOpen = !!openEx[exKey];
                      const isEditing = editingEx === exKey;
                      return (
                        <div key={exKey} className="history-ex-block">
                          <div className="history-ex-title-row" onClick={() => setOpenEx({ ...openEx, [exKey]: !exOpen })}>
                            <strong>{ex ? ex.name : "?"}</strong>
                            <ChevronRight size={20} className={"chevron" + (exOpen ? " open" : "")} />
                          </div>
                          {exOpen && !isEditing && (
                            <>
                              <div className="kg-chip-row">
                                {it.sets.length === 0 && <span className="hint">nessuna serie</span>}
                                {it.sets.map((s, i) => (
                                  <span key={i} className="kg-chip">{s.weight || 0} kg x {s.reps || 0}{s.rir !== undefined && s.rir !== "" ? ` (RIR ${s.rir})` : ""}</span>
                                ))}
                                <span className="kg-chip kg-chip-accent">{round1(itemVolume(it))} kg tonn.</span>
                              </div>
                              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                <button className="btn btn-ghost" onClick={() => setEditingEx(exKey)}>Modifica</button>
                                <DeleteButton onConfirm={() => deleteHistoryExercise(it.__workoutId, it.id)} small />
                              </div>
                            </>
                          )}
                          {exOpen && isEditing && (
                            <>
                              <div className="set-table">
                                <div className="set-row set-row-head">
                                  <span>#</span><span>Kg</span><span>Rip</span><span>RIR</span><span>TIME</span><span>Tonn.</span><span>Note</span><span></span>
                                </div>
                                {it.sets.map((s, idx) => (
                                  <div className="set-row" key={idx}>
                                    <span className="set-idx">{idx + 1}</span>
                                    <input className="input input-sm" type="number" value={s.weight}
                                      onChange={(e) => updateHistorySet(it.__workoutId, it.id, idx, "weight", e.target.value)} />
                                    <input className="input input-sm" type="number" value={s.reps}
                                      onChange={(e) => updateHistorySet(it.__workoutId, it.id, idx, "reps", e.target.value)} />
                                    <input className="input input-sm" type="number" value={s.rir}
                                      onChange={(e) => updateHistorySet(it.__workoutId, it.id, idx, "rir", e.target.value)} />
                                    <select className="input input-sm" value={s.recupero}
                                      onChange={(e) => updateHistorySet(it.__workoutId, it.id, idx, "recupero", e.target.value)}>
                                      <option value="">—</option>
                                      {RECUPERO_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                    <span className="tonn-cell">{round1(setVolume(s))}</span>
                                    <input className="input input-sm" value={s.notes}
                                      onChange={(e) => updateHistorySet(it.__workoutId, it.id, idx, "notes", e.target.value)} />
                                    <button className="btn-icon" onClick={() => removeHistorySet(it.__workoutId, it.id, idx)}><X size={18} /></button>
                                  </div>
                                ))}
                              </div>
                              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                                <button className="btn btn-ghost" disabled={it.sets.length >= 10}
                                  onClick={() => addHistorySet(it.__workoutId, it.id)}>
                                  <Plus size={18} /> Aggiungi serie
                                </button>
                                <button className="btn btn-primary" onClick={() => setEditingEx(null)}>Fatto</button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
              </div>
            </div>
            );
          })}
        </div>
      </Section>
      </div>
    </div>
  );
}

function ProgressiTab({ workouts, exercises, bodyLogs }) {
  const usedExerciseIds = [...new Set(workouts.flatMap((w) => w.exercises.map((it) => it.exerciseId)))];
  const usableExercises = exercises.filter((e) => usedExerciseIds.includes(e.id));
  const [exId, setExId] = useState(usableExercises[0] ? usableExercises[0].id : "");
  const [muscle, setMuscle] = useState(MUSCLE_GROUPS[0]);

  const now = new Date();
  const ANNI_DISPONIBILI = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 4 + i);
  const MESI_BREVI = MONTHS_IT.map((m) => m.slice(0, 3));

  const [forzaAnno, setForzaAnno] = useState(now.getFullYear());
  const [forzaGruppo, setForzaGruppo] = useState(MUSCLE_GROUPS[0]);
  const eserciziEffettuatiForza = usableExercises.filter((e) => e.muscle === forzaGruppo);
  const [forzaEsercizio, setForzaEsercizio] = useState("");
  const forzaEsercizioAttivo = eserciziEffettuatiForza.some((e) => e.id === forzaEsercizio)
    ? forzaEsercizio
    : (eserciziEffettuatiForza[0] ? eserciziEffettuatiForza[0].id : "");

  const [volAnno, setVolAnno] = useState(now.getFullYear());
  const [volGruppo, setVolGruppo] = useState(MUSCLE_GROUPS[0]);

  const yearlyStrengthData = useMemo(() => {
    if (!forzaEsercizioAttivo) return [];
    const perData = {};
    workouts
      .filter((w) => w.date.startsWith(String(forzaAnno)))
      .forEach((w) => {
        const it = w.exercises.find((it) => it.exerciseId === forzaEsercizioAttivo);
        if (!it || !it.sets.length) return;
        const pesoMaxSessione = Math.max(...it.sets.map((s) => Number(s.weight) || 0));
        const ripMaxSessione = it.sets
          .filter((s) => (Number(s.weight) || 0) === pesoMaxSessione)
          .reduce((max, s) => Math.max(max, Number(s.reps) || 0), 0);
        const attuale = perData[w.date];
        if (!attuale || pesoMaxSessione > attuale.peso || (pesoMaxSessione === attuale.peso && ripMaxSessione > attuale.ripMax)) {
          perData[w.date] = { peso: pesoMaxSessione, ripMax: ripMaxSessione };
        }
      });
    return Object.keys(perData)
      .sort()
      .map((dateIso) => {
        const { peso, ripMax } = perData[dateIso];
        return { data: formatDateShort(dateIso), peso, ripMax, tonnMax: peso * ripMax };
      });
  }, [workouts, forzaAnno, forzaEsercizioAttivo]);

  const yearlyVolumeData = useMemo(() => {
    const perMese = Array.from({ length: 12 }, (_, i) => ({ mese: MESI_BREVI[i], volume: 0 }));
    workouts.forEach((w) => {
      if (!w.date.startsWith(String(volAnno))) return;
      const meseIdx = Number(w.date.slice(5, 7)) - 1;
      w.exercises.forEach((it) => {
        const ex = exercises.find((e) => e.id === it.exerciseId);
        if (!ex || ex.muscle !== volGruppo) return;
        perMese[meseIdx].volume += itemVolume(it);
      });
    });
    return perMese.map((m) => ({ ...m, volume: round1(m.volume) }));
  }, [workouts, exercises, volAnno, volGruppo]);

  const [e1rmExId, setE1rmExId] = useState("");
  const [e1rmMode, setE1rmMode] = useState("kg");
  const e1rmExIdAttivo = usableExercises.some((e) => e.id === e1rmExId)
    ? e1rmExId
    : (usableExercises[0] ? usableExercises[0].id : "");

  const e1rmWeeklyData = useMemo(() => {
    if (!e1rmExIdAttivo) return [];
    const weekMap = {};
    workouts.forEach((w) => {
      const it = w.exercises.find((it) => it.exerciseId === e1rmExIdAttivo);
      if (!it) return;
      it.sets.forEach((s) => {
        const reps = Number(s.reps) || 0;
        const weight = Number(s.weight) || 0;
        if (reps < 1 || reps > 6 || weight <= 0) return;
        const e1rm = weight * (1 + reps / 30);
        const weekStart = isoOf(getMonday(w.date));
        if (!weekMap[weekStart] || e1rm > weekMap[weekStart]) weekMap[weekStart] = e1rm;
      });
    });
    const weeks = Object.keys(weekMap).sort();
    if (weeks.length === 0) return [];
    const iniziale = weekMap[weeks[0]];
    return weeks.map((wk, idx) => {
      const val = weekMap[wk];
      return {
        settimana: `S${idx + 1}`,
        periodo: formatDateShort(wk),
        e1rm: round1(val),
        percento: round1((val / iniziale) * 100)
      };
    });
  }, [workouts, e1rmExIdAttivo]);

  const strengthData = useMemo(() => {
    return [...workouts]
      .sort((a, b) => (a.date > b.date ? 1 : -1))
      .filter((w) => w.exercises.some((it) => it.exerciseId === exId))
      .map((w) => {
        const it = w.exercises.find((it) => it.exerciseId === exId);
        const pesoMax = it.sets.length ? Math.max(...it.sets.map((s) => Number(s.weight) || 0)) : 0;
        const ripMax = it.sets
          .filter((s) => (Number(s.weight) || 0) === pesoMax)
          .reduce((max, s) => Math.max(max, Number(s.reps) || 0), 0);
        return { data: formatDateShort(w.date), peso: pesoMax, ripMax, tonnMax: pesoMax * ripMax };
      });
  }, [workouts, exId]);

  const weeklyVolumeData = useMemo(() => {
    const weeks = [];
    for (let i = 9; i >= 0; i--) {
      const ws = addDays(getMonday(todayISO()), -7 * i);
      const we = addDays(ws, 6);
      const stats = weeklyMuscleStats(workouts, exercises, isoOf(ws), isoOf(we));
      const s = stats[muscle] || { volume: 0, sets: 0 };
      weeks.push({
        settimana: formatDateShort(isoOf(ws)),
        periodo: `${formatDateShort(isoOf(ws))} - ${formatDateShort(isoOf(we))}`,
        volume: round1(s.volume),
        serieTot: s.sets
      });
    }
    return weeks;
  }, [workouts, exercises, muscle]);

  const bodyData = [...bodyLogs].sort((a, b) => (a.date > b.date ? 1 : -1)).map((b) => ({ data: formatDateShort(b.date), peso: Number(b.weight) || 0 }));

  return (
    <div className="progressi-dark" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <StatisticheTab workouts={workouts} exercises={exercises} />

      <Section title="Progressione forza esercizi annuali" right={
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select className="input input-sm-w" value={forzaGruppo} onChange={(e) => setForzaGruppo(e.target.value)}>
            {MUSCLE_GROUPS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="input input-sm-w" value={forzaEsercizioAttivo} onChange={(e) => setForzaEsercizio(e.target.value)}>
            {eserciziEffettuatiForza.length === 0 && <option value="">Nessun esercizio</option>}
            {eserciziEffettuatiForza.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <select className="input input-sm-w" value={forzaAnno} onChange={(e) => setForzaAnno(Number(e.target.value))}>
            {ANNI_DISPONIBILI.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      }>
        {yearlyStrengthData.length === 0 ? <p className="muted">Nessun dato per questo esercizio in {forzaAnno}.</p> : (
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yearlyStrengthData} margin={{ top: 5, right: 20, bottom: 5, left: 5 }}>
                <CartesianGrid stroke="var(--border-c)" strokeDasharray="3 3" />
                <XAxis dataKey="data" stroke="var(--text-dim)" fontSize={11} />
                <YAxis yAxisId="left" stroke="var(--accent)" fontSize={11} />
                <YAxis yAxisId="right" orientation="right" stroke="#c0392b" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border-c)", color: "var(--text)" }}
                  formatter={(value, name, props) =>
                    name === "Tonnellaggio (TONN.)"
                      ? [`${value} TONN.`, "TOT. KG x RIP."]
                      : [`${value} kg x ${props.payload.ripMax}`, "Peso max"]
                  }
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line yAxisId="left" type="monotone" dataKey="peso" stroke="var(--accent)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 7 }} name="Peso max (kg)" />
                <Line yAxisId="right" type="monotone" dataKey="tonnMax" stroke="#c0392b" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 7 }} name="Tonnellaggio (TONN.)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Section>

      <Section title={e1rmMode === "kg" ? "Progressione della forza — e1RM stimato" : "Progressione della forza — variazione percentuale"} right={
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select className="input input-sm-w" value={e1rmExIdAttivo} onChange={(e) => setE1rmExId(e.target.value)}>
            {usableExercises.length === 0 && <option value="">Nessun dato</option>}
            {usableExercises.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <div style={{ display: "flex", gap: 6 }}>
            <button className={"btn " + (e1rmMode === "kg" ? "btn-primary" : "btn-ghost")} onClick={() => setE1rmMode("kg")}>e1RM (kg)</button>
            <button className={"btn " + (e1rmMode === "percent" ? "btn-primary" : "btn-ghost")} onClick={() => setE1rmMode("percent")}>Progressione (%)</button>
          </div>
        </div>
      }>
        <p className="hint" style={{ marginBottom: 10 }}>
          Calcolato con la formula di Epley (peso × (1 + rip/30)) sulle serie da 1 a 6 ripetizioni; per ogni settimana viene preso il valore più alto.
        </p>
        {e1rmWeeklyData.length === 0 ? <p className="muted">Nessuna serie valida (1-6 ripetizioni) trovata per questo esercizio.</p> : (
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={e1rmWeeklyData}>
                <CartesianGrid stroke="var(--border-c)" strokeDasharray="3 3" />
                <XAxis dataKey="settimana" stroke="var(--text-dim)" fontSize={11} label={{ value: "Settimana", position: "insideBottom", offset: -3, fill: "var(--text-dim)", fontSize: 11 }} />
                <YAxis stroke="var(--text-dim)" fontSize={11} label={{ value: e1rmMode === "kg" ? "1RM stimato (kg)" : "Performance (%)", angle: -90, position: "insideLeft", fill: "var(--text-dim)", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border-c)", color: "var(--text)" }}
                  labelFormatter={(label, payload) => (payload && payload[0] ? `${label} (${payload[0].payload.periodo})` : label)}
                  formatter={(value) => e1rmMode === "kg" ? [`${value} kg`, "e1RM"] : [`${value}%`, "Performance"]}
                />
                <Line type="monotone" dataKey={e1rmMode === "kg" ? "e1rm" : "percento"} stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} name={e1rmMode === "kg" ? "e1RM (kg)" : "Performance (%)"} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Section>

      <Section title="Volume settimanale per gruppo" right={
        <select className="input input-sm-w" value={muscle} onChange={(e) => setMuscle(e.target.value)}>
          {MUSCLE_GROUPS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      }>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyVolumeData}>
              <CartesianGrid stroke="var(--border-c)" strokeDasharray="3 3" />
              <XAxis dataKey="settimana" stroke="var(--text-dim)" fontSize={11} />
              <YAxis yAxisId="left" stroke="#c0392b" fontSize={11} />
              <YAxis yAxisId="right" orientation="right" stroke="#7ea600" fontSize={11} />
              <Tooltip
                contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border-c)", color: "var(--text)" }}
                labelFormatter={(label, payload) => (payload && payload[0] ? payload[0].payload.periodo : label)}
                formatter={(value, name) => name === "RIP. TOT." ? [`${value} Rip.`, "Volume"] : [`${value} kg`, "Volume"]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="volume" fill="#c0392b" name="Volume (kg)" radius={[3, 3, 0, 0]} />
              <Bar yAxisId="right" dataKey="serieTot" fill="#aef000" name="RIP. TOT." radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <Section title="Volume tonnellaggio annuali" right={
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select className="input input-sm-w" value={volGruppo} onChange={(e) => setVolGruppo(e.target.value)}>
            {MUSCLE_GROUPS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="input input-sm-w" value={volAnno} onChange={(e) => setVolAnno(Number(e.target.value))}>
            {ANNI_DISPONIBILI.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      }>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearlyVolumeData}>
              <CartesianGrid stroke="var(--border-c)" strokeDasharray="3 3" />
              <XAxis dataKey="mese" stroke="var(--text-dim)" fontSize={11} />
              <YAxis stroke="var(--text-dim)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border-c)", color: "var(--text)" }} />
              <Bar dataKey="volume" fill="#c0392b" name="Volume (kg)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <Section title="Peso corporeo">
        {bodyData.length === 0 ? <p className="muted">Aggiungi il tuo peso in Impostazioni per vedere il grafico.</p> : (
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bodyData}>
                <CartesianGrid stroke="var(--border-c)" strokeDasharray="3 3" />
                <XAxis dataKey="data" stroke="var(--text-dim)" fontSize={11} />
                <YAxis stroke="var(--text-dim)" fontSize={11} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border-c)", color: "var(--text)" }} />
                <Line type="monotone" dataKey="peso" stroke="var(--good)" strokeWidth={2} dot={{ r: 3 }} name="Peso (kg)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Section>
    </div>
  );
}

function RecordTab({ workouts, exercises }) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState({});
  const records = useMemo(() => {
    const map = {};
    workouts.forEach((w) => {
      w.exercises.forEach((it) => {
        const ex = exercises.find((e) => e.id === it.exerciseId);
        if (!ex) return;
        if (!map[it.exerciseId]) map[it.exerciseId] = { exerciseId: it.exerciseId, name: ex.name, muscle: ex.muscle, maxWeight: 0, maxWeightReps: 0, maxWeightDate: null, bestVolume: 0, bestVolumeDate: null, totalVolume: 0 };
        const r = map[it.exerciseId];
        r.totalVolume += itemVolume(it);
        const vol = itemVolume(it);
        if (vol > r.bestVolume) { r.bestVolume = vol; r.bestVolumeDate = w.date; }
        it.sets.forEach((s) => {
          const wt = Number(s.weight) || 0;
          if (wt > r.maxWeight) { r.maxWeight = wt; r.maxWeightReps = Number(s.reps) || 0; r.maxWeightDate = w.date; }
        });
      });
    });
    return Object.values(map).filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => a.muscle.localeCompare(b.muscle) || a.name.localeCompare(b.name));
  }, [workouts, exercises, query]);

  return (
    <Section title="Record personali" right={
      <div className="search-wrap">
        <Search size={22} className="search-icon" />
        <input className="input input-sm-w" style={{ paddingLeft: 46 }} placeholder="Cerca..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
    }>
      {records.length === 0 && <p className="muted">Registra qualche allenamento per vedere i tuoi record.</p>}
      <div className="record-grid">
        {records.map((r, i) => {
          const isOpen = !!expanded[r.exerciseId];
          const dayItem = r.maxWeightDate
            ? workouts.filter((w) => w.date === r.maxWeightDate)
                .map((w) => w.exercises.find((it) => it.exerciseId === r.exerciseId))
                .find(Boolean)
            : null;
          return (
            <div className="record-card" key={i}>
              <div className="hint">{r.muscle}</div>
              <div className="font-display" style={{ fontSize: 16, marginBottom: 8 }}>{r.name}</div>
              <div className="record-line"><span>Record peso</span><strong>{r.maxWeight} kg × {r.maxWeightReps}</strong></div>
              {r.maxWeightDate && (
                <button className="date-chip record-date-chip" onClick={() => setExpanded({ ...expanded, [r.exerciseId]: !isOpen })}>
                  {formatDateShort(r.maxWeightDate)}
                </button>
              )}
              {isOpen && dayItem && (
                <div className="kg-chip-row" style={{ marginTop: 8, marginBottom: 4 }}>
                  {dayItem.sets.map((s, idx) => (
                    <span key={idx} className="kg-chip">{s.weight || 0} kg x {s.reps || 0}{s.rir !== undefined && s.rir !== "" ? ` (RIR ${s.rir})` : ""}</span>
                  ))}
                  <span className="kg-chip kg-chip-accent">{round1(itemVolume(dayItem))} kg tonn.</span>
                </div>
              )}
              <div className="record-line"><span>Miglior volume seduta</span><strong>{round1(r.bestVolume)} kg</strong></div>
              <div className="record-line"><span>Volume totale</span><strong>{round1(r.totalVolume)} kg</strong></div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function ImpostazioniTab({ bodyLogs, setBodyLogs }) {
  const [form, setForm] = useState({ date: todayISO(), weight: "", height: "", age: "", notes: "" });
  const sorted = [...bodyLogs].sort((a, b) => (a.date < b.date ? 1 : -1));
  const latest = sorted[0];

  function addLog() {
    if (!form.weight) return;
    setBodyLogs([...bodyLogs, { id: uid(), ...form }]);
    setForm({ date: todayISO(), weight: "", height: form.height, age: form.age, notes: "" });
  }
  function remove(id) { setBodyLogs(bodyLogs.filter((b) => b.id !== id)); }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Section title="Anagrafica personale">
        <div className="plate-row">
          <Plate value={latest ? latest.weight : "—"} label="peso attuale" unit="kg" />
          <Plate value={latest && latest.height ? latest.height : "—"} label="altezza" unit="cm" />
          <Plate value={latest && latest.age ? latest.age : "—"} label="età" unit="anni" />
        </div>
      </Section>

      <Section title="Nuova rilevazione">
        <div className="grid4">
          <div>
            <label className="label">Data</label>
            <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="label">Peso (kg)</label>
            <input type="number" className="input" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
          </div>
          <div>
            <label className="label">Altezza (cm)</label>
            <input type="number" className="input" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} />
          </div>
          <div>
            <label className="label">Età</label>
            <input type="number" className="input" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
          </div>
        </div>
        <label className="label" style={{ marginTop: 10 }}>Note</label>
        <input className="input" placeholder="es. spalla sinistra affaticata" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={addLog}><Plus size={24} /> Salva rilevazione</button>
      </Section>

      <Section title="Storico">
        {sorted.length === 0 && <p className="muted">Nessuna rilevazione salvata.</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {sorted.map((b) => (
            <div key={b.id} className="ex-row">
              <span className="font-display" style={{ minWidth: 90 }}>{formatDateShort(b.date)}</span>
              <span>{b.weight} kg</span>
              <span className="hint">{b.height ? `${b.height} cm` : ""}</span>
              <span className="hint" style={{ flex: 1 }}>{b.notes}</span>
              <DeleteButton onConfirm={() => remove(b.id)} small />
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function NavIcon({ t, size }) {
  if (t.muscle) {
    return (
      <span className="nav-letter" style={{ width: size, height: size, fontSize: Math.round(size * 0.55) }}>
        {t.muscle.charAt(0).toUpperCase()}
      </span>
    );
  }
  return <t.icon size={size} />;
}

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [tab, setTab] = useState("progressi");
  const [exercises, setExercises] = useState(DEFAULT_EXERCISES);
  const [splits, setSplits] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [bodyLogs, setBodyLogs] = useState([]);

  useEffect(() => {
    (async () => {
      const data = await loadGymData();
      if (!data) {
        setLoadFailed(true);
        setLoaded(true);
        return;
      }
      const loadedExercises = data.exercises && data.exercises.length ? data.exercises : DEFAULT_EXERCISES;
      setExercises(mergeRequiredExercises(renameExercises(cleanExercises(loadedExercises))));
      setSplits(data.splits || []);
      setWorkouts(data.workouts || []);
      setBodyLogs(data.body_logs || []);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => { if (loaded && !loadFailed) saveField("exercises", exercises); }, [exercises, loaded, loadFailed]);
  useEffect(() => { if (loaded && !loadFailed) saveField("splits", splits); }, [splits, loaded, loadFailed]);
  useEffect(() => { if (loaded && !loadFailed) saveField("workouts", workouts); }, [workouts, loaded, loadFailed]);
  useEffect(() => { if (loaded && !loadFailed) saveField("body_logs", bodyLogs); }, [bodyLogs, loaded, loadFailed]);

  const MUSCLE_NAV = [
    { muscle: "Petto", label: "Petto" },
    { muscle: "Spalle", label: "Spalle" },
    { muscle: "Dorso", label: "Dorso" },
    { muscle: "Gambe", label: "Gambe" },
    { muscle: "Polpacci", label: "Polpacci" },
    { muscle: "Tricipiti", label: "Tricipiti" },
    { muscle: "Bicipiti", label: "Bicipiti" },
    { muscle: "Addome", label: "Addominali" },
    { muscle: "Calisthenics", label: "Calisthenics" }
  ];

  const tabs = [
    { key: "progressi", label: "Progressi", icon: TrendingUp },
    { key: "cronologia", label: "Cronologia", icon: Search },
    { key: "split", label: "Split settimanali", icon: CalendarDays },
    ...MUSCLE_NAV.map((m) => ({ key: "m-" + m.muscle, label: m.label, icon: Dumbbell, muscle: m.muscle })),
    { key: "impostazioni", label: "Impostazioni", icon: Settings }
  ];

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F4F2EC", color: "#6E6B62", fontFamily: "'Comfortaa', 'Segoe UI', Candara, Arial, sans-serif", fontSize: 16, textTransform: "uppercase" }}>
        Caricamento...
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F4F2EC", color: "#211F1A", fontFamily: "'Comfortaa', 'Segoe UI', Candara, Arial, sans-serif", padding: 24, textAlign: "center", textTransform: "uppercase" }}>
        <div style={{ maxWidth: 420 }}>
          <h2>Configurazione mancante</h2>
          <p style={{ color: "#6E6B62", fontSize: 15 }}>
            Non riesco a connettermi a Supabase. Controlla di aver creato il file <code>.env</code> con
            {" "}<code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code>, e di aver eseguito
            {" "}<code>supabase/schema.sql</code> nel tuo progetto Supabase. Vedi il file README.md incluso.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="gt-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;500;600;700&display=swap');
        .gt-root{
          --bg:#F4F2EC; --surface:#FFFFFF; --surface-2:#DDEEDD; --border-c:#C7DCC7;
          --text:#000000; --text-dim:#000000; --accent:#D9412E; --accent-dim:#FBE3DE;
          --accent2:#3E7191; --good:#2E8B57;
          background:var(--bg); color:var(--text); font-family:'Comfortaa','Segoe UI',Candara,Arial,sans-serif;
          min-height:100vh; display:flex; flex-direction:column; font-size:32px; text-transform:uppercase;
        }
        .font-display{ font-family:'Comfortaa','Segoe UI',Candara,Arial,sans-serif; font-weight:700; color:var(--text); }
        .gt-header{ display:flex; align-items:center; gap:12px; padding:18px 20px; border-bottom:1px solid var(--border-c); }
        .gt-logo{ width:40px; height:40px; border-radius:50%; border:5px solid var(--accent); display:flex; align-items:center; justify-content:center; background:var(--surface); }
        .gt-title{ font-size:48px; }
        .gt-sub{ color:var(--text-dim); font-size:28px; }
        .gt-body{ display:flex; flex:1; min-height:0; }
        .gt-nav{ width:320px; border-right:1px solid var(--border-c); padding:14px 10px; flex-shrink:0; }
        .gt-nav-item{ display:flex; align-items:center; gap:10px; padding:11px 12px; border-radius:6px; cursor:pointer; color:var(--text-dim); font-size:30px; margin-bottom:2px; }
        .nav-letter{ display:inline-flex; align-items:center; justify-content:center; border-radius:50%; background:var(--accent-dim); color:var(--accent); font-weight:700; flex-shrink:0; font-family:'Comfortaa','Segoe UI',Candara,Arial,sans-serif; }
        .gt-nav-item:hover{ background:var(--surface-2); }
        .gt-nav-item.active{ background:var(--accent-dim); color:var(--accent); }
        .gt-main{ flex:1; padding:20px; overflow-y:auto; overflow-x:hidden; min-width:0; }
        .gt-bottomnav{ display:none; border-top:1px solid var(--border-c); background:var(--surface); position:sticky; bottom:0; }
        @media (max-width: 820px){
          .gt-nav{ display:none; }
          .gt-bottomnav{ display:flex; overflow-x:auto; }
          .gt-main{ padding:14px; padding-bottom:24px; }
        }
        .gt-bottomnav-item{ flex:1; display:flex; flex-direction:column; align-items:center; gap:2px; padding:8px 4px; color:var(--text-dim); font-size:24px; min-width:64px; }
        .gt-bottomnav-item.active{ color:var(--accent); }
        .card{ background:var(--surface); border:1px solid var(--border-c); border-radius:10px; padding:18px 20px; }
        .section-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; gap:10px; flex-wrap:wrap; }
        .section-title{ font-size:38px; margin:0; color:var(--text); }
        .label{ display:block; font-size:26px; color:var(--text-dim); margin-bottom:6px; text-transform:uppercase; letter-spacing:0.04em; }
        .input{ width:100%; background:var(--surface-2); border:1px solid var(--border-c); color:var(--text); border-radius:6px; padding:9px 11px; font-size:32px; font-family:'Comfortaa','Segoe UI',Candara,Arial,sans-serif; }
        .input:focus{ outline:none; border-color:var(--accent); }
        .input-sm{ padding:7px 6px; text-align:center; background:#FFFFFF; font-weight:700; }
        .input-sm-w{ width:auto; max-width:320px; }
        .grid2{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        .grid4{ display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
        @media (max-width:700px){ .grid2,.grid4{ grid-template-columns:1fr 1fr; } }
        .hint{ color:var(--text-dim); font-size:28px; }
        .muted{ color:var(--text-dim); font-size:30px; }
        .btn{ display:inline-flex; align-items:center; gap:6px; background:transparent; border:1px solid var(--border-c); color:var(--text); padding:9px 16px; border-radius:6px; font-size:30px; cursor:pointer; font-family:'Comfortaa','Segoe UI',Candara,Arial,sans-serif; }
        .btn:hover{ border-color:var(--text-dim); }
        .btn:disabled{ opacity:0.4; cursor:not-allowed; }
        .btn-primary{ background:var(--accent); border-color:var(--accent); color:#fff; }
        .btn-primary:hover{ background:#bd3423; }
        .btn-ghost{ border-color:transparent; color:var(--text-dim); padding:6px 10px; }
        .btn-danger{ background:var(--accent); border-color:var(--accent); color:#fff; }
        .btn-icon{ background:transparent; border:none; color:var(--text-dim); cursor:pointer; padding:4px; display:flex; }
        .delete-icon-btn{ background:#FFFFFF; border:1px solid var(--border-c); border-radius:6px; padding:6px; color:var(--accent); }
        .delete-icon-btn:hover{ background:var(--accent-dim); }
        .btn-icon:hover{ color:var(--text); }
        .link-btn{ background:none; border:none; color:var(--accent2); font-size:26px; cursor:pointer; padding:4px 0; text-decoration:underline; }
        .badge{ font-size:26px; background:var(--surface-2); border:1px solid var(--border-c); padding:3px 9px; border-radius:20px; color:var(--text-dim); }
        .badge-accent{ background:var(--accent-dim); color:var(--accent); border-color:var(--accent-dim); }
        .comp-table{ display:grid; grid-template-columns:auto 130px 130px; gap:8px 14px; align-items:center; }
        .comp-table-mobile{ display:none; }
        .comp-header{ font-weight:700; font-size:26px; text-align:center; }
        .comp-label{ font-weight:700; font-size:26px; color:var(--text-dim); }
        .comp-table > span:not(.comp-header):not(.comp-label):not(.diff-badge){ text-align:center; font-weight:700; font-size:26px; }
        .diff-badge{ font-size:26px; font-weight:700; color:#000000; background:#FFF6C4; border:1px solid #E8D97A; padding:4px 10px; border-radius:8px; text-align:center; }
        .search-wrap{ position:relative; }
        .search-muscolo-input{ border:3px solid #c0392b !important; background:#aef000; }
        .search-icon{ position:absolute; left:12px; top:16px; color:var(--text-dim); }
        .dropdown{ position:absolute; top:calc(100% + 4px); left:0; right:0; background:var(--surface); border:1px solid var(--border-c); border-radius:8px; z-index:5; max-height:260px; overflow-y:auto; box-shadow:0 6px 16px rgba(0,0,0,0.08); }
        .dropdown-item{ display:flex; justify-content:space-between; padding:10px 14px; cursor:pointer; font-size:30px; }
        .dropdown-item:hover{ background:var(--surface-2); }
        .exercise-block{ border:1px solid var(--border-c); border-radius:8px; padding:14px; background:var(--surface-2); }
        .exercise-block-dark{ background:#141414; border-color:#333333; }
        .exercise-block-dark, .exercise-block-dark *{ color:#ffffff !important; font-weight:700; }
        .exercise-block-dark .input, .exercise-block-dark select.input{ background:#262626; border-color:#444444; color:#ffffff !important; }
        .exercise-block-dark .input-rip{ color:#000000 !important; }
        .exercise-block-dark .input-rir{ color:#000000 !important; }
        .exercise-block-dark .badge{ background:#262626; border-color:#444444; }
        .exercise-block-dark .date-chip{ color:#1a1a1a !important; }
        .exercise-block-dark .dates-count-box{ background:#c0392b !important; color:#ffffff !important; }
        .exercise-block-dark .dates-arrow-box{ background:#ffffff !important; color:#1a1a1a !important; }
        .exercise-block-dark .dates-arrow-box svg{ color:#1a1a1a !important; stroke:#1a1a1a !important; }
        .exercise-block-dark .kg-chip{ color:#1a1a1a !important; }
        .exercise-block-dark .chip-tonn{ background:#1f6b3a !important; color:#ffffff !important; }
        .exercise-block-dark .chip-rip{ background:#aef000 !important; color:#000000 !important; }
        .exercise-block-dark .diff-tonn{ background:#1f6b3a !important; color:#ffffff !important; border-color:#1f6b3a !important; outline:2px solid #ffffff; outline-offset:2px; }
        .exercise-block-dark .diff-rip{ background:#aef000 !important; color:#000000 !important; border-color:#aef000 !important; outline:2px solid #ffffff; outline-offset:2px; }
        .exercise-block-dark .delete-icon-btn{ background:#ffffff !important; color:#c0392b !important; }
        .exercise-block-dark .delete-icon-btn svg{ color:#c0392b !important; stroke:#c0392b !important; }
        .exercise-block-dark .comp-table-mobile{ background:#141414 !important; }
        .tonn-box{
          background:#c0392b !important; color:#ffffff !important; border-radius:8px;
          font-size:calc(28px + 4pt); font-weight:700; padding:8px 8px;
        }
        .input-kg{ background:#1f6b3a !important; color:#ffffff !important; border-color:#1f6b3a !important; font-weight:700; }
        .input-kg::placeholder{ color:#c9e8cf !important; }
        .input-rip{ background:#aef000 !important; color:#000000 !important; border-color:#aef000 !important; font-weight:700; }
        .input-rip::placeholder{ color:#4a5a00 !important; }
        .input-rir{ background:#ffffff !important; color:#1a1a1a !important; border-color:#dddddd !important; font-weight:700; }
        .exercise-block-head{ display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
        .exercise-name{ font-family:'Comfortaa','Segoe UI',Candara,Arial,sans-serif; font-weight:700; font-size:36px; }
        .set-table{ margin-top:10px; display:flex; flex-direction:column; gap:7px; }
        .set-row{ display:grid; grid-template-columns:44px 1fr 1fr 0.8fr 0.65fr 1fr 44px; gap:10px; align-items:center; }
        .set-row-head{ color:var(--text-dim); font-size:24px; text-transform:uppercase; }
        .set-idx{ color:var(--text-dim); font-size:28px; text-align:center; }
        .save-bar{ display:flex; align-items:center; justify-content:space-between; background:var(--surface); border:1px solid var(--border-c); border-radius:10px; padding:14px 18px; position:sticky; bottom:12px; box-shadow:0 4px 14px rgba(0,0,0,0.06); }
        .plate{ display:flex; flex-direction:column; align-items:center; justify-content:center; min-width:150px; }
        .plate-val{ font-family:'Comfortaa','Segoe UI',Candara,Arial,sans-serif; font-weight:700; font-size:56px; color:var(--accent); }
        .plate-label{ font-size:24px; color:var(--text-dim); text-transform:uppercase; letter-spacing:0.03em; }
        .plate-unit{ text-transform:lowercase; }
        .plate-row{ display:flex; gap:28px; flex-wrap:wrap; }
        .split-columns-wrap{ overflow-x:auto; padding-bottom:6px; }
        .split-columns{ display:flex; gap:14px; width:max-content; }
        .split-col{ display:flex; flex-direction:column; width:210px; flex-shrink:0; }
        .split-col-head{ text-align:center; font-size:26px; padding:10px 6px; background:var(--accent-dim); color:var(--accent); border-radius:6px; margin-bottom:8px; position:sticky; top:0; }
        .split-col-body{ display:flex; flex-direction:column; gap:6px; }
        .split-cell-input{ padding:8px 10px; }
        .split-name-input{ max-width:280px; font-size:34px; }
        .split-table{ display:flex; flex-direction:column; gap:7px; }
        .split-row{ display:grid; grid-template-columns:190px 1fr; align-items:center; gap:10px; }
        .split-day{ color:var(--text-dim); font-size:28px; }
        .ex-row{ display:flex; align-items:center; gap:8px; }
        .ex-row .input{ flex:1; min-width:0; }
        .stats-table{ display:flex; flex-direction:column; gap:4px; }
        .stats-row{ display:grid; grid-template-columns:2fr 1fr 1fr 1fr; padding:9px 4px; font-size:30px; border-bottom:1px solid var(--border-c); color:var(--text); }
        .stats-row-head{ color:var(--text-dim); font-size:26px; text-transform:uppercase; border-bottom:1px solid var(--border-c); }
        .week-nav{ display:flex; align-items:center; gap:14px; margin-bottom:8px; }
        .history-item{ border:1px solid var(--border-c); border-radius:8px; overflow:hidden; }
        .muscle-group-heading{ font-family:'Comfortaa','Segoe UI',Candara,Arial,sans-serif; font-weight:700; font-size:22px; color:var(--accent); background:var(--accent-dim); padding:8px 14px; border-radius:8px; margin-bottom:10px; width:fit-content; }
        .history-head{ display:flex; justify-content:space-between; align-items:center; padding:11px 14px; cursor:pointer; background:var(--surface-2); }
        .history-body{ padding:11px 14px; display:flex; flex-direction:column; gap:10px; }
        .muscle-history-block{ border:1px solid var(--border-c); border-radius:8px; overflow:hidden; }
        .muscle-history-head{ display:flex; justify-content:space-between; align-items:center; padding:10px 12px; cursor:pointer; background:var(--surface); }
        .muscle-history-head:hover{ background:var(--accent-dim); }
        .muscle-history-body{ padding:10px 12px; display:flex; flex-direction:column; gap:10px; background:var(--surface-2); }
        .history-ex{ display:flex; justify-content:space-between; font-size:28px; gap:10px; flex-wrap:wrap; }
        .history-ex-block{ display:flex; flex-direction:column; gap:6px; }
        .history-ex-title-row{ display:flex; justify-content:space-between; align-items:center; cursor:pointer; padding:6px 0; }
        .vertical-ex-block{ display:flex; flex-direction:column; gap:8px; padding:10px 0; border-bottom:1px solid var(--border-c); }
        .vertical-ex-title{ font-size:32px; margin-bottom:2px; }
        .plain-set-table{ display:flex; flex-direction:column; gap:6px; }
        .plain-set-scroll{ overflow-x:auto; -webkit-overflow-scrolling:touch; }
        .plain-set-row{ display:grid; grid-template-columns:30px 65px 55px 55px 90px 65px 160px; gap:8px; align-items:center; font-size:26px; font-weight:700; }
        .history-card-dark .plain-set-row{ grid-template-columns:30px 65px 55px 55px 1fr; }
        .plain-set-row-head{ color:var(--text-dim); font-size:26px; text-transform:uppercase; font-weight:600; }
        .plain-note-cell{ font-size:14px; font-weight:700; }
        .plain-set-row-head .plain-note-cell{ font-size:12px; font-weight:600; text-transform:uppercase; }
        .plain-tonn{ color:var(--accent); font-weight:700; }
        .plain-tonn-box{
          background:#c0392b; color:#ffffff !important; border-radius:6px;
          padding:2px 6px; display:inline-block; text-align:center;
        }
        .plain-kg-box{
          background:#c0392b; color:#ffffff !important; border-radius:6px;
          padding:2px 6px; display:inline-block; text-align:center;
          font-size:calc(26px + 1pt); font-weight:700;
        }
        .plain-rip-box{
          background:#aef000; color:#000000 !important; border-radius:6px;
          padding:2px 6px; display:inline-block; text-align:center;
          font-size:calc(26px + 1pt); font-weight:700;
        }
        .tot-esercizio-badge{
          background:#c0392b; color:#ffffff; font-weight:700; padding:3px 10px;
          border-radius:6px; display:inline-block; font-size:calc(28px + 3pt);
        }
        .cronologia-theme .input{ background:#ffffff !important; border:3px solid #c0392b !important; }
        .cronologia-theme .badge{ background:#ffffff !important; border:3px solid #c0392b !important; color:#1a1a1a; }
        .cronologia-theme .history-head{ border:3px solid #c0392b; border-radius:8px; }
        .cronologia-allenamenti-dark .card{ background:#141414; }
        .cronologia-allenamenti-dark .section-title{ color:#ffffff; }
        .cronologia-allenamenti-dark > .card > p.muted{ color:#ffffff; }
        .cronologia-allenamenti-dark .history-body .history-ex-title-row strong{ color:#ffffff; }
        .cronologia-allenamenti-dark .history-body .chevron{ color:#ffffff; }
        .cronologia-allenamenti-dark .history-body .hint{ color:#ffffff; }
        .cronologia-allenamenti-dark .history-body .muted{ color:#ffffff; }
        .cronologia-theme .muscle-group-heading{
          color:#000000 !important; font-size:24px;
          border:3px solid #c0392b;
        }
        .history-card-dark{ background:#141414 !important; border-color:#333333 !important; }
        .history-card-dark, .history-card-dark *{ color:#ffffff !important; font-weight:700; }
        .history-card-dark .plain-rip-box{ color:#000000 !important; }
        .history-card-dark .plain-tonn-box, .history-card-dark .tot-esercizio-badge{ color:#ffffff !important; }
        .history-card-dark .btn-icon svg{ color:#ffffff !important; stroke:#ffffff !important; }
        .vertical-total{ background:var(--surface-2); color:var(--text); font-weight:700; padding:8px 12px; border-radius:6px; margin-top:2px; display:inline-block; align-self:flex-start; }
        .last-time-block{ display:flex; flex-direction:column; gap:6px; margin-top:2px; }
        .dates-section{ margin-bottom:22px; }
        .dates-toggle{ display:flex; align-items:center; gap:10px; cursor:pointer; width:fit-content; }
        .dates-count-box{ background:var(--accent-dim); color:var(--accent); font-weight:700; font-size:20px; padding:6px 10px; border-radius:8px; min-width:44px; text-align:center; box-sizing:border-box; }
        .dates-arrow-box{ display:flex; align-items:center; justify-content:center; width:38px; height:38px; border:1px solid var(--border-c); border-radius:8px; background:#FFFFFF; color:var(--text); transition:transform 0.15s ease; }
        .dates-arrow-box.open{ transform:rotate(180deg); }
        .kg-chip-row{ display:flex; flex-wrap:wrap; gap:8px; }
        .kg-chip{ background:var(--surface); border:1px solid var(--border-c); color:var(--text); padding:6px 12px; border-radius:6px; font-size:26px; font-weight:700; white-space:nowrap; }
        .kg-chip-accent{ background:var(--accent-dim); border-color:var(--accent-dim); color:var(--accent); }
        .exercise-log-scroll{ overflow-x:auto; -webkit-overflow-scrolling:touch; padding-bottom:6px; }
        .exercise-log-table{ display:flex; flex-direction:column; gap:8px; width:max-content; }
        .exercise-log-row{ display:flex; gap:8px; align-items:stretch; }
        .nuovo-allenamento-dark .log-kg-box{ margin-right:-11px; }
        .nuovo-allenamento-dark .exercise-log-row:not(.exercise-log-row-head){
          border-bottom:1px solid rgba(123,224,138,0.25); padding-bottom:8px; margin-bottom:2px;
        }
        .exercise-log-row-head{ color:var(--text-dim); font-size:16px; text-transform:uppercase; }
        .log-date-box, .log-set-box, .log-kg-box, .log-rip-box, .log-note-box, .log-volume-box, .log-total-box, .log-serie-box, .log-kgmax-box{
          flex-shrink:0; display:flex; align-items:center; justify-content:center;
          padding:14px 10px; border-radius:6px; font-weight:700; white-space:nowrap;
          font-size:22px; overflow:hidden;
        }
        .exercise-log-row-head .log-date-box, .exercise-log-row-head .log-set-box,
        .exercise-log-row-head .log-kg-box, .exercise-log-row-head .log-rip-box,
        .exercise-log-row-head .log-note-box, .exercise-log-row-head .log-volume-box,
        .exercise-log-row-head .log-total-box, .exercise-log-row-head .log-serie-box,
        .exercise-log-row-head .log-kgmax-box{ background:transparent; font-weight:600; padding:6px 10px; font-size:22px; }
        .log-date-box{ width:150px; background:var(--surface-2); color:var(--text); font-size:22px; }
        .log-set-box{ width:140px; background:#FFFFFF; border:1px solid var(--border-c); color:var(--text); font-size:22px; }
        .log-kg-box{ width:130px; background:var(--accent-dim); border:1px solid #E8C2BA; color:var(--text); font-size:22px; }
        .log-rip-box{ width:90px; background:#FFFFFF; border:1px solid var(--border-c); color:var(--text); font-size:22px; }
        .log-note-box{ width:190px; background:#FFFFFF; border:1px solid var(--border-c); overflow-x:auto; justify-content:flex-start; font-size:22px; }
        .log-note-box span{ white-space:nowrap; }
        .log-volume-box{ width:140px; background:var(--accent-dim); color:#000000; font-size:22px; font-weight:700; }
        .log-total-box{ width:56px; background:#FFFFFF; border:1px solid var(--border-c); color:var(--text); font-size:22px; }
        .log-serie-box{ width:56px; background:#FFFFFF; border:1px solid var(--border-c); color:var(--text); font-size:22px; }
        .log-kgmax-box{ width:150px; background:#FFFFFF; border:1px solid var(--border-c); color:var(--text); font-size:22px; }
        .log-rir-box{ width:56px; background:#FFFFFF; border:1px solid var(--border-c); color:#1a1a1a; font-size:22px; font-weight:700; display:flex; align-items:center; justify-content:center; padding:14px 10px; border-radius:6px; }
        .log-kgmax-label-box{ width:100px; background:#c0392b; color:#ffffff; font-weight:700; font-size:22px; border-radius:6px; padding:14px 10px; display:flex; align-items:center; justify-content:center; }
        .log-kgmax-value-box{ width:140px; background:#c0392b; color:#ffffff; font-weight:700; font-size:22px; border-radius:6px; padding:14px 10px; display:flex; align-items:center; justify-content:center; }
        .log-kg-title-box{ width:140px; background:#1f6b3a; color:#ffffff; font-weight:700; font-size:22px; border-radius:6px; padding:7px 10px; display:flex; align-items:center; justify-content:center; }
        .log-note-title-box{ width:190px; background:#FFFFFF; color:#1a1a1a; font-weight:700; font-size:22px; border-radius:6px; padding:7px 10px; display:flex; align-items:center; justify-content:center; }
        .log-date-card-body .log-total-box{ padding:7px 10px; }
        .log-date-card-body .log-rir-box{ padding:7px 10px; }
        .log-date-card-body .log-note-box{ padding:7px 10px; }
        .log-kg-value-box{ width:140px; background:var(--accent-dim); color:#000000; font-size:22px; font-weight:700; border-radius:6px; padding:7px 10px; display:flex; align-items:center; justify-content:center; }
        .log-date-list{ display:flex; flex-direction:column; gap:6px; }
        .log-date-card{ padding-bottom:8px; border-bottom:1px solid rgba(123,224,138,0.3); margin-bottom:4px; }
        .log-date-card:last-child{ border-bottom:none; }
        .log-date-card-head{ display:flex; gap:8px; cursor:pointer; }
        .log-date-card-body{ display:flex; flex-direction:column; gap:6px; margin-top:8px; }
        .log-set-row-titles{ margin-top:14px; }
        .log-set-row{ display:flex; gap:8px; align-items:stretch; flex-wrap:wrap; }
        .exercise-log-row-head .log-serie-box{ width:74px; }
        .record-grid{ display:grid; grid-template-columns:repeat(auto-fill, minmax(340px, 1fr)); gap:14px; }
        .record-card{ background:var(--surface-2); border:1px solid var(--border-c); border-radius:8px; padding:13px 15px; }
        .record-line{ display:flex; justify-content:space-between; font-size:28px; padding:4px 0; color:var(--text-dim); }
        .record-line strong{ color:var(--text); }
        .date-it-picker{ display:flex; gap:8px; max-width:760px; }
        .date-it-picker .input{ min-width:0; background:#aef000; border:3px solid #c0392b; }
        .date-it-day{ flex:0 0 78px; }
        .date-it-month{ flex:1 1 auto; }
        .date-it-year{ flex:0 0 200px; }
        .date-muscle-row{ display:flex; gap:24px; flex-wrap:wrap; align-items:flex-start; }
        .muscle-select-btn{ display:flex; align-items:center; gap:12px; justify-content:space-between; background:var(--surface-2); border:1px solid var(--border-c); color:var(--text); padding:12px 20px; border-radius:6px; cursor:pointer; font-size:34px; min-width:280px; }
        .muscle-select-btn:hover{ border-color:var(--accent); }
        .muscle-dropdown{ min-width:230px; }
        .date-chip-row{ display:flex; flex-wrap:wrap; gap:8px; margin-top:6px; }
        .date-chip{ background:var(--surface); border:1px solid var(--border-c); color:var(--text); padding:7px 14px; border-radius:20px; font-size:28px; cursor:pointer; font-family:'Comfortaa','Segoe UI',Candara,Arial,sans-serif; }
        .record-date-chip{ margin:4px 0 2px; }
        .date-chip:hover{ background:var(--accent-dim); border-color:var(--accent); color:var(--accent); }
        .history-cards-grid{ display:grid; grid-template-columns:repeat(auto-fill, minmax(380px,1fr)); gap:16px; }
        .history-card{ background:var(--surface-2); border:1px solid var(--border-c); border-radius:8px; padding:13px 15px; display:flex; flex-direction:column; gap:8px; }
        .history-card-head{ display:flex; justify-content:space-between; align-items:center; gap:10px; }
        .history-card-head .font-display{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0; flex:1; }
        .history-card-head .btn-icon{ flex-shrink:0; }
        .close-card-row{ display:flex; justify-content:center; margin-top:8px; }
        .close-card-btn{
          display:flex; align-items:center; gap:6px;
          background:#c0392b; color:#ffffff !important; font-weight:700;
          border:none; border-radius:8px; padding:10px 18px; font-size:16px; cursor:pointer;
        }
        .accordion{ display:flex; flex-direction:column; gap:8px; }
        .accordion-item{ border:1px solid var(--border-c); border-radius:8px; overflow:hidden; }
        .accordion-head{ display:flex; align-items:center; justify-content:space-between; padding:12px 14px; cursor:pointer; background:var(--surface-2); font-size:30px; }
        .accordion-head:hover{ background:#e9e5da; }
        .chevron{ transition:transform 0.15s ease; color:var(--text-dim); }
        .chevron.open{ transform:rotate(90deg); color:var(--accent); }
        .accordion-body{ padding:14px; display:flex; flex-direction:column; gap:12px; }
        .group-ex-list{ display:flex; flex-direction:column; gap:4px; }
        .group-ex-row{ display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border-radius:6px; cursor:pointer; font-size:32px; background:var(--surface); border:1px solid transparent; }
        .group-ex-row:hover{ background:var(--accent-dim); border-color:var(--accent-dim); }
        .custom-slots{ border-top:1px solid var(--border-c); padding-top:10px; display:flex; flex-direction:column; gap:6px; }
        .custom-slot-row{ display:flex; gap:8px; }
        .custom-slot-row .input{ flex:1; background:#ffffff; border:3px solid #c0392b; }
        .recall-box{ background:var(--surface-2); border:1px solid var(--border-c); border-radius:8px; padding:12px 14px; }
        .recall-detail{ margin-top:10px; padding-top:10px; border-top:1px solid var(--border-c); display:flex; flex-direction:column; gap:6px; }
        .recall-detail-head{ display:flex; justify-content:space-between; align-items:center; }
        .recall-ex{ display:flex; justify-content:space-between; gap:10px; font-size:28px; flex-wrap:wrap; }
        .tonn-cell{ text-align:center; font-size:28px; color:var(--accent2); font-weight:700; }

        .progressi-dark{
          --bg:#161915; --surface:#1c1f1a; --surface-2:#242821; --border-c:#38402f;
          --text:#e8ece5; --text-dim:#9fb89a; --accent:#7be08a; --accent-dim:#2c3126; --accent2:#5aa668; --good:#7be08a;
          background:var(--bg); border-radius:12px; padding:16px;
        }
        .progressi-dark .btn-primary{ color:#0f1310; }

        .statistiche-dark{
          --bg:#161915; --surface:#1c1f1a; --surface-2:#242821; --border-c:#38402f;
          --text:#ffffff; --text-dim:#ffffff; --accent:#7be08a; --accent-dim:#2c3126; --accent2:#5aa668; --good:#7be08a;
          background:var(--bg); border-radius:12px; padding:16px;
        }
        .statistiche-dark .btn-primary{ color:#0f1310; }
        .volume-badge{
          display:inline-block; background:#1f6b3a; color:#ffffff; font-weight:700;
          padding:3px 10px; border-radius:6px;
        }

        .nuovo-allenamento-dark{
          --bg:#000000; --surface:#000000; --surface-2:#141414; --border-c:#333333;
          --text:#ffffff; --text-dim:#ffffff;
          background:#000000; border-radius:12px; padding:16px;
        }
        .nuovo-allenamento-dark .log-set-box,
        .nuovo-allenamento-dark .log-kg-box,
        .nuovo-allenamento-dark .log-rip-box,
        .nuovo-allenamento-dark .log-note-box,
        .nuovo-allenamento-dark .log-kgmax-box{
          background:transparent; border:none; color:#ffffff; font-weight:700; font-size:24px;
        }
        .nuovo-allenamento-dark .log-serie-box{
          background:#ffffff; border:1px solid #7be08a; color:#1a1a1a; font-weight:700; font-size:24px;
        }
        .nuovo-allenamento-dark .log-total-box{
          background:#aef000; border:none; color:#000000; font-weight:700; font-size:24px;
        }
        .nuovo-allenamento-dark .log-rir-box{
          background:#ffffff; border:none; color:#1a1a1a; font-weight:700; font-size:24px;
        }
        .nuovo-allenamento-dark .exercise-log-row-head .log-set-box,
        .nuovo-allenamento-dark .exercise-log-row-head .log-kg-box,
        .nuovo-allenamento-dark .exercise-log-row-head .log-rip-box,
        .nuovo-allenamento-dark .exercise-log-row-head .log-note-box,
        .nuovo-allenamento-dark .exercise-log-row-head .log-kgmax-box,
        .nuovo-allenamento-dark .exercise-log-row-head .log-total-box,
        .nuovo-allenamento-dark .exercise-log-row-head .log-serie-box{
          background:transparent; color:#ffffff; font-weight:700; border:none;
        }
        .nuovo-allenamento-dark .log-volume-box,
        .nuovo-allenamento-dark .log-kg-value-box{
          background:#1f6b3a; color:#ffffff; font-weight:700; font-size:22px; border-color:#1f6b3a;
        }
        .nuovo-allenamento-dark .exercise-log-row-head .log-volume-box{
          background:#1f6b3a; color:#ffffff; font-weight:700; font-size:22px;
        }
        .nuovo-allenamento-dark .exercise-log-row-head .log-date-box{
          color:#ffffff;
        }

        @media (max-width: 640px) {
          .progressi-dark{ padding:10px; border-radius:8px; }
          .dropdown-item{ font-size:15px; padding:9px 12px; }
          .date-it-picker .input{ font-size:14px; padding:8px 4px; }
          .date-it-day{ flex:0 0 54px; }
          .date-it-year{ flex:0 0 70px; }
          .muscle-group-heading{ font-size:16px; padding:6px 10px; margin-bottom:6px; }
          .dates-section{ margin-bottom:16px; }
          .dates-count-box{ font-size:14px; padding:4px 7px; min-width:32px; border-radius:6px; }
          .dates-arrow-box{ width:28px; height:28px; border-radius:6px; }
          .comp-table-desktop{ display:none; }
          .comp-table-mobile{
            display:grid; grid-template-columns:auto 78px 78px; gap:6px 10px; align-items:center;
            justify-content:flex-start; justify-self:flex-start; margin:10px 0; padding:10px;
            background:var(--surface-2); border-radius:8px; width:fit-content;
          }
          .comp-table-mobile .comp-header, .comp-table-mobile .comp-label{ font-size:17px; }
          .comp-table-mobile > span:not(.comp-header):not(.comp-label):not(.diff-badge){ font-size:17px; }
          .comp-table-mobile .diff-badge{ font-size:19px; padding:4px 9px; }
          .last-time-block .kg-chip-row{ display:flex; flex-direction:column; align-items:flex-start; gap:6px; }
          .exercise-block .last-time-block .kg-chip{
            width:auto !important; min-width:230px !important; margin:0 !important; box-sizing:border-box !important; text-align:center !important;
            white-space:nowrap !important; overflow-x:auto !important; line-height:1 !important;
            display:flex !important; align-items:center !important; justify-content:center !important;
            min-height:0 !important; padding:5px 10px !important; font-size:19.5px !important;
          }
          .diff-badge{ font-size:15px; padding:3px 8px; background:#FFF6C4; border-color:#E8D97A; }
          .comp-table{ grid-template-columns:auto 80px 80px; gap:5px 8px; }
          .comp-header, .comp-label{ font-size:15px; }
          .comp-table > span:not(.comp-header):not(.comp-label):not(.diff-badge){ font-size:15px; }
          .plain-set-row{ grid-template-columns:20px 44px 38px 38px 62px 42px 100px; gap:4px; font-size:15px; }
          .history-card-dark .plain-set-row{ grid-template-columns:20px 44px 38px 38px 1fr; }
          .plain-set-row-head{ font-size:11px; }
          .plain-note-cell{ font-size:11px; }
          .history-card-dark .plain-set-row{ font-size:18px; font-weight:700; }
          .history-card-dark .plain-set-row-head{ font-size:14px; font-weight:700; }
          .history-card-dark .plain-note-cell{ font-size:14px; font-weight:700; }
          .history-card-dark .font-display{ font-size:18px; }
          .history-card-dark .tot-esercizio-badge{ font-size:20px; }
          .history-card-dark .plain-kg-box{ font-size:19px; }
          .history-card-dark .history-card-head .btn-icon{
            background:#ffffff !important; border-radius:50%; padding:6px !important; width:32px; height:32px;
            display:flex; align-items:center; justify-content:center;
          }
          .history-card-dark .history-card-head .btn-icon svg{ color:#1a1a1a !important; stroke:#1a1a1a !important; }
          .close-card-row{ justify-content:center; width:100%; }
          .close-card-btn{ padding:7px 12px; font-size:13px; gap:4px; }
          .history-card-dark .plain-rip-box{ font-size:19px; }
          .cronologia-theme .input{ font-size:calc(16px + 2pt); font-weight:700; }
          .cronologia-theme .badge{ font-size:calc(11.5px + 2pt); font-weight:700; }
          .cronologia-theme .history-head span{ font-size:calc(14px + 2pt); font-weight:700; }
          .cronologia-theme .badge-rep, .cronologia-theme .badge-tonn{ font-size:calc(11.5px + 3pt); font-weight:700; }
          .cronologia-theme .tonn-cell{ font-size:calc(12.5px + 3pt); font-weight:700; }
          .history-card-dark .hint{ font-size:16px; font-weight:700; }
          .vertical-ex-title{ font-size:15px; }
          .vertical-total{ font-size:14px; padding:6px 10px; }
          .history-card{ padding:11px 12px; }
          .log-date-box{ width:85px; font-size:15px; padding:8px 4px; }
          .log-kgmax-label-box{ width:50px; font-size:11px; padding:8px 3px; }
          .log-kgmax-value-box{ width:95px; font-size:15px; padding:8px 4px; }
          .log-date-card-head{ flex-wrap:nowrap; align-items:stretch; }
          .log-set-box{ width:140px; font-size:22px; padding:12px 10px; }
          .log-kg-box{ width:130px; font-size:22px; padding:12px 10px; background:var(--accent-dim); border-color:#E8C2BA; }
          .log-rip-box{ width:90px; font-size:22px; padding:12px 10px; }
          .log-note-box{ width:190px; font-size:22px; padding:12px 10px; }
          .log-volume-box{ width:140px; font-size:22px; font-weight:700; padding:12px 10px; }
          .log-total-box{ width:56px; font-size:22px; padding:12px 8px; }
          .log-serie-box{ width:52px; font-size:22px; padding:12px 8px; }
          .exercise-log-row-head .log-serie-box{ width:68px; }
          .gt-root{ font-size:17px; }
          .gt-header{ padding:12px 14px; gap:10px; }
          .gt-logo{ width:32px; height:32px; border-width:4px; }
          .gt-title{ font-size:22px; }
          .gt-sub{ font-size:13px; }
          .gt-main{ padding:12px; }
          .gt-bottomnav-item{ font-size:11px; min-width:0; padding:7px 2px; gap:1px; }
          .card{ padding:14px; overflow-x:hidden; }
          .exercise-block{ padding:12px; overflow-x:hidden; }
          .exercise-block-head{ flex-wrap:wrap; }
          .section-head{ margin-bottom:10px; }
          .section-title{ font-size:19px; }
          .label{ font-size:12px; margin-bottom:4px; }
          .input{ font-size:16px; padding:8px 9px; }
          .input-sm{ padding:6px 4px; }
          .hint{ font-size:12.5px; }
          .muted{ font-size:13px; }
          .btn{ font-size:14px; padding:8px 12px; }
          .badge{ font-size:11.5px; padding:2px 7px; }
          .exercise-name{ font-size:16px; }
          .set-table{ overflow-x:auto; -webkit-overflow-scrolling:touch; margin-top:8px; }
          .set-row{ grid-template-columns:24px 62px 54px 46px 46px 110px 34px; min-width:600px; gap:6px; }
          .set-row-head{ font-size:10.5px; min-width:480px; }
          .set-idx{ font-size:12px; }
          .set-row .btn-icon{ padding:2px; }
          .plate{ min-width:76px; }
          .plate-val{ font-size:24px; }
          .plate-label{ font-size:10.5px; }
          .save-bar{ padding:10px 12px; flex-wrap:wrap; gap:10px; bottom:6px; }
          .split-name-input{ font-size:18px; max-width:200px; }
          .stats-row{ font-size:13px; padding:7px 3px; grid-template-columns:1.5fr 0.8fr 1.1fr 1fr; gap:4px; }
          .stats-row-head{ font-size:10px; align-items:start; }
          .stats-row-head span{ white-space:normal; line-height:1.15; word-break:break-word; }
          .week-nav{ gap:8px; }
          .history-head{ padding:9px 10px; flex-wrap:wrap; gap:6px; }
          .history-body{ padding:9px 10px; }
          .muscle-history-head{ padding:8px 10px; font-size:14px; }
          .muscle-history-body{ padding:8px 10px; }
          .history-ex{ font-size:12.5px; }
          .kg-chip{ font-size:12.5px; padding:5px 9px; }
          .record-grid{ grid-template-columns:1fr; }
          .record-line{ font-size:13px; }
          .grid4{ grid-template-columns:1fr 1fr; }
          .date-it-picker{ max-width:100%; }
          .date-muscle-row{ gap:12px; }
          .muscle-select-btn{ font-size:15px; min-width:0; flex:1; padding:9px 12px; }
          .muscle-dropdown{ min-width:0; width:100%; }
          .date-chip-row{ gap:6px; }
          .date-chip{ font-size:12px; padding:5px 10px; }
          .history-cards-grid{ grid-template-columns:1fr; gap:10px; }
          .history-card{ padding:11px 12px; }
          .group-ex-row{ font-size:14px; padding:9px 10px; }
          .recall-ex{ font-size:12.5px; }
          .tonn-cell{ font-size:12.5px; }
          .tonn-box{ font-size:18.5px; font-weight:700; padding:8px 6px; }
          .input-kg, .input-rip, .input-rir{ font-size:20px !important; padding:10px 6px !important; }
          .split-col{ width:170px; }
          .split-col-head{ font-size:14px; padding:8px 4px; }
          .split-cell-input{ padding:6px 8px; }
        }
      `}</style>


      <div className="gt-header">
        <div className="gt-logo"><Dumbbell size={24} color="var(--accent)" /></div>
        <div>
          <div className="font-display gt-title">Gym Tracker Personal</div>
          <div className="gt-sub">Registra. Analizza. Programma come vuoi tu.</div>
        </div>
      </div>

      <div className="gt-body">
        <div className="gt-nav">
          {tabs.map((t) => (
            <div key={t.key} className={"gt-nav-item" + (tab === t.key ? " active" : "")} onClick={() => setTab(t.key)}>
              <NavIcon t={t} size={24} /> {t.label}
            </div>
          ))}
        </div>

        <div className="gt-main">
          {tab === "split" && <SplitTab splits={splits} setSplits={setSplits} />}
          {MUSCLE_NAV.map((m) => (
            <div key={m.muscle} style={{ display: tab === "m-" + m.muscle ? "flex" : "none", flexDirection: "column", gap: 16 }}>
              <MuscleLogTab muscle={m.muscle} workouts={workouts} exercises={exercises} />
              <MuscleEntryPanel muscle={m.muscle} exercises={exercises} setExercises={setExercises} workouts={workouts} setWorkouts={setWorkouts} />
            </div>
          ))}
          {tab === "cronologia" && <CronologiaTab workouts={workouts} exercises={exercises} setWorkouts={setWorkouts} />}
          {tab === "progressi" && <ProgressiTab workouts={workouts} exercises={exercises} bodyLogs={bodyLogs} />}
          {tab === "impostazioni" && <ImpostazioniTab bodyLogs={bodyLogs} setBodyLogs={setBodyLogs} />}
        </div>
      </div>

      <div className="gt-bottomnav">
        {tabs.map((t) => (
          <div key={t.key} className={"gt-bottomnav-item" + (tab === t.key ? " active" : "")} onClick={() => setTab(t.key)}>
            <NavIcon t={t} size={26} /> {t.label.split(" ")[0]}
          </div>
        ))}
      </div>
    </div>
  );
}