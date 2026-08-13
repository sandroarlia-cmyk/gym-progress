import { useState, useEffect, useMemo } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from './firebase'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

// Formatta "2026-07-28" -> "28/07"
function formatDataBreve(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}`
}

// Calcola il lunedì della settimana di una data ISO, come chiave di raggruppamento
function chiaveSettimana(iso) {
  const d = new Date(iso)
  const giorno = (d.getDay() + 6) % 7 // 0 = lunedì
  d.setDate(d.getDate() - giorno)
  return d.toISOString().slice(0, 10)
}

function App() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exercisesMap, setExercisesMap] = useState({}) // id -> { name, muscle }
  const [workoutEntries, setWorkoutEntries] = useState([]) // { date, exerciseId, sets }
  const [bodyLogs, setBodyLogs] = useState([])

  const [gruppo, setGruppo] = useState('')
  const [esercizio, setEsercizio] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [exSnap, weSnap, blSnap] = await Promise.all([
          getDocs(collection(db, 'exercises')),
          getDocs(collection(db, 'workout_entries')),
          getDocs(collection(db, 'body_logs')),
        ])

        const exMap = {}
        exSnap.forEach(doc => { exMap[doc.id] = doc.data() })
        setExercisesMap(exMap)

        const entries = []
        weSnap.forEach(doc => entries.push(doc.data()))
        setWorkoutEntries(entries)

        const logs = []
        blSnap.forEach(doc => logs.push(doc.data()))
        setBodyLogs(logs)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Gruppi muscolari e esercizi che hanno davvero dati registrati
  const gruppiConDati = useMemo(() => {
    const map = {} // muscle -> [{ id, name }]
    workoutEntries.forEach(entry => {
      const ex = exercisesMap[entry.exerciseId]
      if (!ex) return
      const muscle = ex.muscle || 'Altro'
      if (!map[muscle]) map[muscle] = []
      if (!map[muscle].some(e => e.id === entry.exerciseId)) {
        map[muscle].push({ id: entry.exerciseId, name: ex.name })
      }
    })
    return map
  }, [workoutEntries, exercisesMap])

  // Imposta gruppo/esercizio di default appena i dati sono pronti
  useEffect(() => {
    const gruppi = Object.keys(gruppiConDati)
    if (gruppi.length > 0 && !gruppo) {
      setGruppo(gruppi[0])
      setEsercizio(gruppiConDati[gruppi[0]][0].id)
    }
  }, [gruppiConDati, gruppo])

  // Dati per il grafico di progressione forza (esercizio selezionato)
  const datiForza = useMemo(() => {
    return workoutEntries
      .filter(e => e.exerciseId === esercizio)
      .map(e => {
        const pesi = (e.sets || []).map(s => s.weight).filter(w => w !== null && w !== undefined)
        const top = pesi.length > 0 ? Math.max(...pesi) : 0
        return { data: formatDataBreve(e.date), dataIso: e.date, kg: top }
      })
      .sort((a, b) => (a.dataIso > b.dataIso ? 1 : -1))
  }, [workoutEntries, esercizio])

  // Dati per il grafico volume settimanale (gruppo selezionato)
  const datiVolume = useMemo(() => {
    const perSettimana = {}
    workoutEntries.forEach(entry => {
      const ex = exercisesMap[entry.exerciseId]
      if (!ex || ex.muscle !== gruppo) return
      const settimana = chiaveSettimana(entry.date)
      const volumeEntry = (entry.sets || []).reduce((acc, s) => {
        if (s.weight !== null && s.reps !== null) return acc + s.weight * s.reps
        return acc
      }, 0)
      perSettimana[settimana] = (perSettimana[settimana] || 0) + volumeEntry
    })
    return Object.entries(perSettimana)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([settimana, volume]) => ({ settimana: formatDataBreve(settimana), volume: Math.round(volume) }))
  }, [workoutEntries, exercisesMap, gruppo])

  // Peso corporeo nel tempo
  const datiPesoCorporeo = useMemo(() => {
    return bodyLogs
      .filter(b => b.date && b.weight !== undefined && b.weight !== null)
      .map(b => ({ data: formatDataBreve(b.date), dataIso: b.date, kg: Number(b.weight) }))
      .sort((a, b) => (a.dataIso > b.dataIso ? 1 : -1))
  }, [bodyLogs])

  // Record personali: peso massimo mai sollevato per ciascun esercizio con dati
  const recordPersonali = useMemo(() => {
    const max = {} // exerciseId -> kg
    workoutEntries.forEach(entry => {
      const pesi = (entry.sets || []).map(s => s.weight).filter(w => w !== null && w !== undefined)
      if (pesi.length === 0) return
      const top = Math.max(...pesi)
      if (!(entry.exerciseId in max) || top > max[entry.exerciseId]) {
        max[entry.exerciseId] = top
      }
    })
    return Object.entries(max)
      .map(([id, kg]) => ({ id, name: exercisesMap[id]?.name || id, kg }))
      .sort((a, b) => b.kg - a.kg)
      .slice(0, 8)
  }, [workoutEntries, exercisesMap])

  if (loading) {
    return <div className="app"><p className="card-label">Carico i dati da Firestore...</p></div>
  }

  if (error) {
    return <div className="app"><p className="card-label" style={{ color: '#e0847b' }}>Errore: {error}</p></div>
  }

  const gruppi = Object.keys(gruppiConDati)

  return (
    <div className="app">
      <header className="app-header">
        <h1>Gym Progress</h1>
        <span>{workoutEntries.length} sessioni registrate</span>
      </header>

      {gruppi.length === 0 ? (
        <div className="card">
          <p className="card-label">Nessun dato trovato</p>
          <p>Non risultano ancora allenamenti nelle collezioni Firestore.</p>
        </div>
      ) : (
        <div className="grid">

          {/* Progressione forza per esercizio */}
          <div className="card card-full">
            <p className="card-label">Progressione forza</p>
            <div className="select-row">
              <select value={gruppo} onChange={e => {
                const g = e.target.value
                setGruppo(g)
                setEsercizio(gruppiConDati[g][0].id)
              }}>
                {gruppi.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={esercizio} onChange={e => setEsercizio(e.target.value)}>
                {(gruppiConDati[gruppo] || []).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            {datiForza.length === 0 ? (
              <p className="card-subvalue">Nessun dato per questo esercizio.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={datiForza}>
                  <CartesianGrid stroke="#38402f" strokeDasharray="3 3" />
                  <XAxis dataKey="data" stroke="#9fb89a" fontSize={12} />
                  <YAxis stroke="#9fb89a" fontSize={12} />
                  <Tooltip contentStyle={{ background: '#2c3126', border: '1px solid #38402f', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="kg" stroke="#7be08a" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Volume settimanale per gruppo muscolare */}
          <div className="card">
            <p className="card-label">Volume settimanale · {gruppo}</p>
            {datiVolume.length === 0 ? (
              <p className="card-subvalue">Nessun dato.</p>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={datiVolume}>
                  <CartesianGrid stroke="#38402f" strokeDasharray="3 3" />
                  <XAxis dataKey="settimana" stroke="#9fb89a" fontSize={12} />
                  <YAxis stroke="#9fb89a" fontSize={12} />
                  <Tooltip contentStyle={{ background: '#2c3126', border: '1px solid #38402f', borderRadius: 8 }} />
                  <Bar dataKey="volume" fill="#7be08a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Peso corporeo nel tempo */}
          <div className="card">
            <p className="card-label">Peso corporeo</p>
            {datiPesoCorporeo.length === 0 ? (
              <p className="card-subvalue">Nessuna pesata registrata ancora.</p>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={datiPesoCorporeo}>
                  <CartesianGrid stroke="#38402f" strokeDasharray="3 3" />
                  <XAxis dataKey="data" stroke="#9fb89a" fontSize={12} />
                  <YAxis stroke="#9fb89a" fontSize={12} domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip contentStyle={{ background: '#2c3126', border: '1px solid #38402f', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="kg" stroke="#7be08a" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Record personali */}
          <div className="card card-full">
            <p className="card-label">Record personali</p>
            {recordPersonali.length === 0 ? (
              <p className="card-subvalue">Nessun record disponibile ancora.</p>
            ) : (
              recordPersonali.map(r => (
                <div className="record-row" key={r.id}>
                  <span className="exercise">{r.name}</span>
                  <span className="value">{r.kg} kg</span>
                </div>
              ))
            )}
          </div>

        </div>
      )}
    </div>
  )
}

export default App
