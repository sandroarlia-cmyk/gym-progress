import { useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

// --- DATI DI ESEMPIO ---
// Questi verranno sostituiti con dati letti da Firestore.
// Per ora servono solo a vedere il layout funzionante.

const forzaEsempio = [
  { data: '01/06', kg: 60 },
  { data: '08/06', kg: 62.5 },
  { data: '15/06', kg: 62.5 },
  { data: '22/06', kg: 65 },
  { data: '29/06', kg: 67.5 },
  { data: '06/07', kg: 70 },
]

const volumeEsempio = [
  { settimana: 'S1', volume: 4200 },
  { settimana: 'S2', volume: 4550 },
  { settimana: 'S3', volume: 4100 },
  { settimana: 'S4', volume: 4820 },
]

const pesoCorporeoEsempio = [
  { data: 'Gen', kg: 78.2 },
  { data: 'Feb', kg: 77.8 },
  { data: 'Mar', kg: 77.1 },
  { data: 'Apr', kg: 76.9 },
  { data: 'Mag', kg: 76.3 },
]

const recordEsempio = [
  { esercizio: 'Panca piana', valore: '90 kg' },
  { esercizio: 'Squat', valore: '120 kg' },
  { esercizio: 'Stacco da terra', valore: '140 kg' },
  { esercizio: 'Military press', valore: '55 kg' },
]

const gruppiMuscolari = ['Petto', 'Dorso', 'Gambe', 'Spalle', 'Bicipiti', 'Tricipiti']
const eserciziPerGruppo = {
  Petto: ['Panca piana', 'Panca inclinata', 'Croci manubri'],
  Dorso: ['Trazioni', 'Rematore', 'Lat machine'],
  Gambe: ['Squat', 'Leg press', 'Affondi'],
  Spalle: ['Military press', 'Alzate laterali'],
  Bicipiti: ['Curl bilanciere', 'Curl manubri'],
  Tricipiti: ['French press', 'Push down'],
}

function App() {
  const [gruppo, setGruppo] = useState('Petto')
  const [esercizio, setEsercizio] = useState('Panca piana')

  return (
    <div className="app">
      <header className="app-header">
        <h1>Gym Progress</h1>
        <span>dati di esempio</span>
      </header>

      <div className="grid">

        {/* Progressione forza per esercizio */}
        <div className="card card-full">
          <p className="card-label">Progressione forza</p>
          <div className="select-row">
            <select value={gruppo} onChange={e => {
              setGruppo(e.target.value)
              setEsercizio(eserciziPerGruppo[e.target.value][0])
            }}>
              {gruppiMuscolari.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select value={esercizio} onChange={e => setEsercizio(e.target.value)}>
              {eserciziPerGruppo[gruppo].map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={forzaEsempio}>
              <CartesianGrid stroke="#38402f" strokeDasharray="3 3" />
              <XAxis dataKey="data" stroke="#9fb89a" fontSize={12} />
              <YAxis stroke="#9fb89a" fontSize={12} />
              <Tooltip contentStyle={{ background: '#2c3126', border: '1px solid #38402f', borderRadius: 8 }} />
              <Line type="monotone" dataKey="kg" stroke="#7be08a" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Volume settimanale per gruppo muscolare */}
        <div className="card">
          <p className="card-label">Volume settimanale · {gruppo}</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={volumeEsempio}>
              <CartesianGrid stroke="#38402f" strokeDasharray="3 3" />
              <XAxis dataKey="settimana" stroke="#9fb89a" fontSize={12} />
              <YAxis stroke="#9fb89a" fontSize={12} />
              <Tooltip contentStyle={{ background: '#2c3126', border: '1px solid #38402f', borderRadius: 8 }} />
              <Bar dataKey="volume" fill="#7be08a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Peso corporeo nel tempo */}
        <div className="card">
          <p className="card-label">Peso corporeo</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={pesoCorporeoEsempio}>
              <CartesianGrid stroke="#38402f" strokeDasharray="3 3" />
              <XAxis dataKey="data" stroke="#9fb89a" fontSize={12} />
              <YAxis stroke="#9fb89a" fontSize={12} domain={['dataMin - 1', 'dataMax + 1']} />
              <Tooltip contentStyle={{ background: '#2c3126', border: '1px solid #38402f', borderRadius: 8 }} />
              <Line type="monotone" dataKey="kg" stroke="#7be08a" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Record personali */}
        <div className="card card-full">
          <p className="card-label">Record personali</p>
          {recordEsempio.map(r => (
            <div className="record-row" key={r.esercizio}>
              <span className="exercise">{r.esercizio}</span>
              <span className="value">{r.valore}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

export default App
