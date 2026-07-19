import { useState } from 'react'
import { verifyPasscode, setSession } from '../lib/store.js'
import { IS_DEMO, DEMO_STAFF_PASSCODE, DEMO_ADMIN_PASSCODE } from '../config.js'

export default function PasscodeGate({ onUnlock }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!code.trim()) return
    setChecking(true)
    setError('')
    try {
      const role = await verifyPasscode(code.trim())
      if (role) {
        setSession(code.trim(), role)
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
        <h2>Clinic access</h2>
        <p className="gate-hint">
          Patient records are private. Enter the clinic passcode to continue.
          {IS_DEMO && <> (Demo passcodes — staff: <strong>{DEMO_STAFF_PASSCODE}</strong>, admin: <strong>{DEMO_ADMIN_PASSCODE}</strong>)</>}
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
      </div>
    </main>
  )
}
