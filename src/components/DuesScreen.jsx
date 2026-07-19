import { useEffect, useState } from 'react'
import { listPatients } from '../lib/store.js'
import { rupees } from '../config.js'
import { Avatar, Spinner } from './ui.jsx'

export default function DuesScreen({ onOpen }) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    listPatients('')
      .then((all) => setRows(
        all.filter((p) => Number(p.balance_due) > 0)
          .sort((a, b) => b.balance_due - a.balance_due)
      ))
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="empty-state"><p className="error-text">{error}</p></div>
  if (!rows) return <Spinner text="Loading dues…" />

  const total = rows.reduce((a, p) => a + Number(p.balance_due), 0)

  return (
    <div>
      <div className="stats-grid stats-1">
        <div className={total > 0 ? 'stat stat-due' : 'stat'}>
          <span className="stat-label">Total outstanding</span>
          <span className="stat-value">{rupees(total)}</span>
        </div>
      </div>

      {rows.length === 0 && (
        <div className="empty-state"><p>No outstanding dues. 🎉</p></div>
      )}
      {rows.map((p) => (
        <article key={p.id} className="card card-row" onClick={() => onOpen(p.id)}>
          <Avatar name={`${p.first_name} ${p.last_name}`} />
          <div className="card-main">
            <strong className="card-name">{p.first_name} {p.last_name}</strong>
            <span className="card-sub">{p.phone} · received {rupees(p.total_received)} of {rupees(p.total_charged)}</span>
          </div>
          <span className="pill pill-due">{rupees(p.balance_due)}</span>
        </article>
      ))}
    </div>
  )
}
