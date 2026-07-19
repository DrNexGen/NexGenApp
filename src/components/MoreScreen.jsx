import { getRole } from '../lib/store.js'
import { CLINIC_NAME, IS_DEMO } from '../config.js'

export default function MoreScreen({ onLock }) {
  const admin = getRole() === 'admin'
  return (
    <div>
      <h3 className="section-title">Signed in as</h3>
      <div className="card card-row" style={{ cursor: 'default' }}>
        <div className="report-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {admin
              ? <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6z" />
              : <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" /></>}
          </svg>
        </div>
        <div className="card-main">
          <strong className="card-name">{admin ? 'Admin (doctor)' : 'Staff (assistant)'}</strong>
          <span className="card-sub">
            {admin
              ? 'Full access: money reports, exports, and deletes'
              : 'Bookings, patients, and report uploads. Money reports are admin-only.'}
          </span>
        </div>
      </div>

      <h3 className="section-title">App</h3>
      <button className="btn-outline btn-block" onClick={onLock}>
        Lock app (require passcode)
      </button>
      <p className="muted about-text">
        {IS_DEMO
          ? 'Demo mode: data lives only in this browser. Connect Supabase (see SETUP.md) to share data with your team.'
          : `${CLINIC_NAME} — data is stored securely in the clinic database. Add this app to your home screen for one-tap access.`}
      </p>
    </div>
  )
}
