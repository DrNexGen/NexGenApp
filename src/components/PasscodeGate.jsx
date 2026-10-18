import { useState } from 'react'
import { verifyPasscode, setSession } from '../lib/store.js'
import { IS_DEMO, DEMO_STAFF_PASSCODE, DEMO_ADMIN_PASSCODE, DEMO_DOCTOR_PASSCODES, parseRole } from '../config.js'

export default function PasscodeGate({ onUnlock, onBack }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!code.trim()) return
    setChecking(true)
    setError('')
    try {
      const parsed = parseRole(await verifyPasscode(code.trim()))
      if (parsed) {
        setSession(code.trim(), parsed.role, parsed.doctor)
        onUnlock()
      } else {
        setError('Incorrect passcode. Please try again.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setChecking(false)
    }
  }

  return (
    <main className="content">
      <div className="gate">
        <div className="gate-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="10" width="16" height="11" rx="2.5" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            <circle cx="12" cy="15.5" r="1.6" fill="currentColor" stroke="none" />
          </svg>
        </div>
        <h2>Hospital access</h2>
        <p className="gate-hint">
          Patient records are private. Enter your passcode to continue.
          {IS_DEMO && (
            <><br />Demo — staff: <strong>{DEMO_STAFF_PASSCODE}</strong>, admin: <strong>{DEMO_ADMIN_PASSCODE}</strong>
            {Object.entries(DEMO_DOCTOR_PASSCODES).map(([code, name]) => (
              <span key={code}>, {name.replace('Dr. ', '')}: <strong>{code}</strong></span>
            ))}</>
          )}
        </p>
        <form onSubmit={submit} className="gate-form">
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Enter passcode"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-label="Passcode"
          />
          <button type="submit" className="btn-primary" disabled={checking}>
            {checking ? 'Checking…' : 'Unlock'}
          </button>
        </form>
        {error && <p className="error-text" role="alert">{error}</p>}
        {onBack && <button type="button" className="btn-ghost" onClick={onBack} style={{ marginTop: 8 }}>← Back to Website</button>}
      </div>
    </main>
  )
}
