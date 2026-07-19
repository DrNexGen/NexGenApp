import { useState } from 'react'
import PasscodeGate from './components/PasscodeGate.jsx'
import PatientsScreen from './components/PatientsScreen.jsx'
import PatientDetail from './components/PatientDetail.jsx'
import TodayScreen from './components/TodayScreen.jsx'
import DuesScreen from './components/DuesScreen.jsx'
import ReportsScreen from './components/ReportsScreen.jsx'
import MoreScreen from './components/MoreScreen.jsx'
import { hasStaffCode, isAdmin, canSeeReports, getScopeDoctor, lock } from './lib/store.js'
import { CLINIC_NAME, CLINIC_TAGLINE, IS_DEMO, deptForDoctor } from './config.js'

const TAB_TITLES = {
  patients: null, // home tab shows the plain clinic name
  today: 'Appointments',
  dues: 'Dues',
  reports: 'Reports',
  more: 'More',
}

export default function App() {
  const [unlocked, setUnlocked] = useState(hasStaffCode())
  const [tab, setTab] = useState('patients')
  // When set, the patient detail screen covers the current tab.
  const [patientId, setPatientId] = useState(null)
  const [patientName, setPatientName] = useState('')

  if (!unlocked) return <Shell><PasscodeGate onUnlock={() => setUnlocked(true)} /></Shell>

  const admin = isAdmin()
  const scopeDoctor = getScopeDoctor()
  const tabs = [
    { key: 'patients', label: 'Patients', icon: IconUsers },
    { key: 'today', label: 'Appointments', icon: IconCalendar },
    { key: 'dues', label: 'Dues', icon: IconRupee },
    ...(canSeeReports() ? [{ key: 'reports', label: 'Reports', icon: IconChart }] : []),
    { key: 'more', label: 'More', icon: IconDots },
  ]

  const openPatient = (id) => {
    setPatientName('')
    setPatientId(id)
  }

  const closePatient = () => {
    setPatientName('')
    setPatientId(null)
  }

  const doLock = () => {
    lock()
    setUnlocked(false)
    closePatient()
    setTab('patients')
  }

  const suffix = patientId ? patientName : TAB_TITLES[tab]
  const title = suffix ? `${CLINIC_NAME} - ${suffix}` : CLINIC_NAME
  const subtitle = scopeDoctor ? `${scopeDoctor} · ${deptForDoctor(scopeDoctor)}` : CLINIC_TAGLINE

  return (
    <Shell title={title} subtitle={subtitle}>
      <main className="content">
        {patientId ? (
          <PatientDetail id={patientId} onBack={closePatient} onName={setPatientName} />
        ) : tab === 'patients' ? (
          <PatientsScreen onOpen={openPatient} />
        ) : tab === 'today' ? (
          <TodayScreen onOpen={openPatient} />
        ) : tab === 'dues' ? (
          <DuesScreen onOpen={openPatient} />
        ) : tab === 'reports' && canSeeReports() ? (
          <ReportsScreen onOpen={openPatient} />
        ) : (
          <MoreScreen onLock={doLock} />
        )}
      </main>
      <nav className="bottom-nav">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={tab === key && !patientId ? 'nav-btn active' : 'nav-btn'}
            onClick={() => { closePatient(); setTab(key) }}
          >
            <Icon />
            {label}
          </button>
        ))}
      </nav>
    </Shell>
  )
}

function Shell({ title, subtitle, children }) {
  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8.5 8.5l7 7" />
              <path d="M8.5 8.5a2 2 0 1 0-2-2 2 2 0 0 0-2 2 2 2 0 0 0 2 2 2 2 0 0 0 2-2z" />
              <path d="M15.5 15.5a2 2 0 1 0 2 2 2 2 0 0 0 2-2 2 2 0 0 0-2-2 2 2 0 0 0-2 2z" />
            </svg>
          </div>
          <div className="header-text">
            <h1>{title || CLINIC_NAME}</h1>
            <p className="tagline">{subtitle || CLINIC_TAGLINE}</p>
          </div>
        </div>
        {IS_DEMO && <div className="demo-banner">Demo mode — data is saved on this device only</div>}
      </header>
      {children}
    </div>
  )
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.5c1.9.9 2.9 2.9 2.9 5.5" />
    </svg>
  )
}
function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="3" /><path d="M16 3v4M8 3v4M3 11h18" />
    </svg>
  )
}
function IconRupee() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h12M6 8.5h12M6 4c4.5 0 7.5 1 7.5 4.5S10.5 13 6 13l7 8" />
    </svg>
  )
}
function IconChart() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />
    </svg>
  )
}
function IconDots() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="5" cy="12" r="1.6" fill="currentColor" /><circle cx="12" cy="12" r="1.6" fill="currentColor" /><circle cx="19" cy="12" r="1.6" fill="currentColor" />
    </svg>
  )
}
