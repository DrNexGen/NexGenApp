import { useEffect, useState } from 'react'
import { listPatients } from '../lib/store.js'
import { rupees } from '../config.js'
import { Avatar, Spinner } from './ui.jsx'
import PatientForm from './PatientForm.jsx'

// "Today 3:00 PM", "Tomorrow 10:30 AM", or "12 Aug, 10:30 AM".
function apptLabel(iso) {
  const d = new Date(iso)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const t = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  if (d.toDateString() === today.toDateString()) return `Today ${t}`
  if (d.toDateString() === tomorrow.toDateString()) return `Tomorrow ${t}`
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + `, ${t}`
}

export default function PatientsScreen({ onOpen }) {
  const [query, setQuery] = useState('')
  const [patients, setPatients] = useState(null)
  const [error, setError] = useState('')
  const [showNew, setShowNew] = useState(false)

  useEffect(() => {
    let stale = false
    const t = setTimeout(async () => {
      try {
        const list = await listPatients(query)
        if (!stale) { setPatients(list); setError('') }
      } catch (e) {
        if (!stale) setError(e.message)
      }
    }, query ? 250 : 0)
    return () => { stale = true; clearTimeout(t) }
  }, [query])

  return (
    <div>
      <div className="search-row">
        <svg className="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          className="search-input"
          placeholder="Search by name or phone"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search patients"
        />
      </div>

      {error && <p className="error-text" role="alert">{error}</p>}
      {!patients && !error && <Spinner text="Loading patients…" />}

      {patients && patients.length === 0 && (
        <div className="empty-state">
          <p>{query ? 'No patients match your search.' : 'No patients yet.'}</p>
          {!query && <p className="muted">Tap the + button to add your first patient.</p>}
        </div>
      )}

      {patients && patients.map((p) => (
        <article key={p.id} className="card card-row" onClick={() => onOpen(p.id)}>
          <Avatar name={`${p.first_name} ${p.last_name}`} />
          <div className="card-main">
            <strong className="card-name">
              {p.first_name} {p.last_name}
              {p.medical_alerts && <span className="alert-dot" title="Medical alert">!</span>}
            </strong>
            <span className="card-sub">{p.phone} · {p.total_visits} visit{p.total_visits === 1 ? '' : 's'}</span>
            {p.next_appointment && (
              <span className="card-appt">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M16 3v4M8 3v4M3 11h18" /></svg>
                {apptLabel(p.next_appointment)}
              </span>
            )}
          </div>
          {Number(p.balance_due) > 0 ? (
            <span className="pill pill-due">due {rupees(p.balance_due)}</span>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="chev" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
          )}
        </article>
      ))}

      <button className="fab" onClick={() => setShowNew(true)}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        Add Patient
      </button>

      {showNew && (
        <PatientForm
          onClose={() => setShowNew(false)}
          onSaved={(id) => { setShowNew(false); onOpen(id) }}
        />
      )}
    </div>
  )
}
