import { useEffect, useState } from 'react'
import { getDashboard } from '../lib/store.js'
import { Avatar, Spinner, fmtDateTime } from './ui.jsx'

export default function TodayScreen({ onOpen }) {
  const [dash, setDash] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getDashboard().then(setDash).catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="empty-state"><p className="error-text">{error}</p></div>
  if (!dash) return <Spinner text="Loading appointments…" />

  const today = dash.today || []
  const tomorrow = dash.tomorrow || []
  const followups = dash.followups || []

  const time = (iso) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

  const apptCard = (v) => (
    <article key={v.id} className="card card-row" onClick={() => onOpen(v.patient_id)}>
      <Avatar name={v.patient_name} />
      <div className="card-main">
        <strong className="card-name">{v.patient_name}</strong>
        <span className="card-sub">{[v.category, v.doctor].filter(Boolean).join(' · ')}</span>
      </div>
      <span className="visit-when">{time(v.visit_at)}</span>
    </article>
  )

  return (
    <div>
      <div className="stats-grid stats-2">
        <div className="stat"><span className="stat-label">Today</span><span className="stat-value">{today.length}</span></div>
        <div className="stat"><span className="stat-label">Tomorrow</span><span className="stat-value">{tomorrow.length}</span></div>
      </div>

      <h3 className="section-title">Today's appointments</h3>
      {today.length === 0 && <p className="muted section-empty">No appointments today.</p>}
      {today.map(apptCard)}

      <h3 className="section-title">Tomorrow's appointments</h3>
      {tomorrow.length === 0 && <p className="muted section-empty">No appointments tomorrow.</p>}
      {tomorrow.map(apptCard)}

      <h3 className="section-title">Upcoming follow-ups</h3>
      {followups.length === 0 && <p className="muted section-empty">No follow-ups scheduled.</p>}
      {followups.map((f) => (
        <article key={f.id} className="card card-row" onClick={() => onOpen(f.patient_id)}>
          <Avatar name={f.patient_name} />
          <div className="card-main">
            <strong className="card-name">{f.patient_name}</strong>
            <span className="card-sub">{f.category}</span>
          </div>
          <span className="next-appt">{fmtDateTime(f.next_appointment)}</span>
        </article>
      ))}
    </div>
  )
}
