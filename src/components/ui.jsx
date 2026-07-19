import { useState } from 'react'
import { isAdmin, sessionCode } from '../lib/store.js'

export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, required, error, children }) {
  return (
    <label className={error ? 'field has-error' : 'field'}>
      <span className="field-label">
        {label} {required && <em aria-hidden="true">*</em>}
      </span>
      {children}
      {error && <span className="field-error">{error}</span>}
    </label>
  )
}

// Delete confirmation. Admins are already authenticated with the admin
// passcode, so they just confirm; anyone else must type it.
export function AdminConfirm({ what, onConfirm, onClose }) {
  const admin = isAdmin()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const go = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onConfirm(admin ? sessionCode() : code.trim())
      onClose()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <Modal title={`Delete ${what}?`} onClose={onClose}>
      <p className="muted" style={{ marginBottom: 12 }}>
        {admin
          ? 'This cannot be undone.'
          : <>This cannot be undone. Enter the <strong>admin passcode</strong> to confirm.</>}
      </p>
      <form onSubmit={go} className="gate-form" style={{ maxWidth: 'none' }}>
        {!admin && (
          <input
            type="password"
            autoComplete="off"
            placeholder="Admin passcode"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-label="Admin passcode"
          />
        )}
        {error && <p className="error-text" role="alert">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-danger" disabled={busy || (!admin && !code.trim())}>
            {busy ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function Avatar({ name }) {
  const initials = name
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map((w) => w[0].toUpperCase()).join('')
  return <div className="avatar" aria-hidden="true">{initials || '?'}</div>
}

export function Spinner({ text = 'Loading…' }) {
  return <div className="empty-state">{text}</div>
}

export function fmtDateTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

export function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// value for <input type="datetime-local"> from an ISO string
export function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fromLocalInput(v) {
  return v ? new Date(v).toISOString() : null
}
