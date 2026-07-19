import { createClient } from '@supabase/supabase-js'
import {
  SUPABASE_URL, SUPABASE_ANON_KEY, IS_DEMO,
  DEMO_STAFF_PASSCODE, DEMO_ADMIN_PASSCODE, DEMO_DOCTOR_PASSCODES, parseRole,
} from '../config.js'
import { joinDataUrl } from './images.js'

const supabase = IS_DEMO ? null : createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// The passcode is kept in memory + sessionStorage after unlock and sent
// with every call; the server verifies it on each request. The passcode
// determines the role — admin (all data), a specific doctor (only their
// data), or staff (limited, no money reports / deletes).
let staffCode = sessionStorage.getItem('nexgen_pass') || ''
let role = sessionStorage.getItem('nexgen_role') || ''
let scopeDoctor = sessionStorage.getItem('nexgen_doctor') || ''

export function setSession(code, r, doctor) {
  staffCode = code
  role = r
  scopeDoctor = doctor || ''
  sessionStorage.setItem('nexgen_pass', code)
  sessionStorage.setItem('nexgen_role', r)
  sessionStorage.setItem('nexgen_doctor', scopeDoctor)
}

export function hasStaffCode() {
  return !!staffCode
}

export function getRole() {
  return role
}

export function isAdmin() {
  return role === 'admin'
}

export function isDoctor() {
  return role === 'doctor'
}

// The doctor a doctor-login is scoped to (null for admin/staff = see all).
export function getScopeDoctor() {
  return scopeDoctor || null
}

// Admin + doctors get money reports; staff does not.
export function canSeeReports() {
  return role === 'admin' || role === 'doctor'
}

// For deletes when logged in as admin — the session code IS the admin code.
export function sessionCode() {
  return staffCode
}

export function lock() {
  staffCode = ''
  role = ''
  scopeDoctor = ''
  sessionStorage.removeItem('nexgen_pass')
  sessionStorage.removeItem('nexgen_role')
  sessionStorage.removeItem('nexgen_doctor')
}

async function rpc(name, params) {
  const { data, error } = await supabase.rpc(name, params)
  if (error) throw new Error(friendly(error.message))
  return data
}

function friendly(message) {
  if (/passcode/i.test(message)) return 'Incorrect passcode'
  if (/fetch/i.test(message)) return 'Network error — check your connection'
  return message
}

// ---------------- Demo mode storage ----------------

const DEMO_KEY = 'dentalog_demo'

function demoDb() {
  const raw = localStorage.getItem(DEMO_KEY)
  if (raw) return JSON.parse(raw)
  const db = seedDemo()
  localStorage.setItem(DEMO_KEY, JSON.stringify(db))
  return db
}

function demoSave(db) {
  localStorage.setItem(DEMO_KEY, JSON.stringify(db))
}

function seedDemo() {
  const today = new Date()
  const at = (d, h, m = 0) => {
    const x = new Date(today)
    x.setDate(x.getDate() + d)
    x.setHours(h, m, 0, 0)
    return x.toISOString()
  }
  const p1 = crypto.randomUUID(), p2 = crypto.randomUUID(), p3 = crypto.randomUUID()
  const v1 = crypto.randomUUID() // Ravi's first ortho consultation — demo X-ray attaches here
  const ORTHO = 'Dr. Varun', PHYSIO = 'Dr. Umashankar'
  const DEMO_XRAY =
    'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="#1a2632"/><text x="320" y="54" fill="#9fc3e0" font-family="sans-serif" font-size="24" text-anchor="middle">Sample knee X-ray - Right</text><rect x="292" y="90" width="56" height="150" rx="24" fill="#e8eef2" opacity="0.9"/><ellipse cx="320" cy="255" rx="70" ry="46" fill="#e8eef2" opacity="0.9"/><rect x="296" y="270" width="48" height="150" rx="20" fill="#e8eef2" opacity="0.85"/><ellipse cx="320" cy="255" rx="24" ry="18" fill="#8fa8ba"/></svg>`)
  return {
    patients: [
      { id: p1, first_name: 'Ravi', last_name: 'Kumar', phone: '9876543210', age: 52, gender: 'Male', medical_alerts: 'Diabetes, Osteoporosis | Right knee osteoarthritis', address: 'MG Road', created_at: at(-14, 9) },
      { id: p2, first_name: 'Anita', last_name: 'Sharma', phone: '9845012345', age: 34, gender: 'Female', medical_alerts: '', address: '', created_at: at(-7, 10) },
      { id: p3, first_name: 'Mohammed', last_name: 'Irfan', phone: '9900122334', age: 45, gender: 'Male', medical_alerts: 'On blood thinners | Ecosprin', address: 'Jayanagar', created_at: at(-11, 17) },
    ],
    visits: [
      { id: v1, patient_id: p1, doctor: ORTHO, visit_at: at(-13, 9, 30), category: 'Consultation', affected_area: 'R Knee', treatment_details: 'Knee osteoarthritis, X-ray advised. Physio referral', fee_charged: 600, payment_received: 600, payment_mode: 'Cash', next_appointment: null, notes: '', created_at: at(-13, 9, 30) },
      { id: crypto.randomUUID(), patient_id: p1, doctor: PHYSIO, visit_at: at(-7, 11, 30), category: 'Physiotherapy session', affected_area: 'R Knee', treatment_details: 'IFT + quadriceps strengthening, session 1', fee_charged: 800, payment_received: 800, payment_mode: 'Cash', next_appointment: at(0, 10), notes: '', created_at: at(-7, 11, 30) },
      { id: crypto.randomUUID(), patient_id: p1, doctor: PHYSIO, visit_at: at(0, 10), category: 'Physiotherapy session', affected_area: 'R Knee', treatment_details: 'Session 2 of 6 — improved range of motion', fee_charged: 800, payment_received: 500, payment_mode: 'UPI', next_appointment: at(7, 10), notes: 'Balance to be collected', created_at: at(0, 10) },
      { id: crypto.randomUUID(), patient_id: p2, doctor: ORTHO, visit_at: at(0, 11), category: 'Sprain / Strain', affected_area: 'L Ankle / Foot', treatment_details: 'Grade 1 ankle sprain, crepe bandage + rest advised', fee_charged: 600, payment_received: 600, payment_mode: 'UPI', next_appointment: null, notes: '', created_at: at(0, 11) },
      { id: crypto.randomUUID(), patient_id: p3, doctor: ORTHO, visit_at: at(-4, 17), category: 'Fracture', affected_area: 'L Wrist / Hand', treatment_details: 'Distal radius fracture, cast applied', fee_charged: 4500, payment_received: 2500, payment_mode: 'UPI', next_appointment: at(3, 17), notes: 'Cast review in 3 days', created_at: at(-4, 17) },
      { id: crypto.randomUUID(), patient_id: p2, doctor: PHYSIO, visit_at: at(1, 15, 30), category: 'Assessment', affected_area: 'Lower back', treatment_details: '', fee_charged: 0, payment_received: 0, payment_mode: null, next_appointment: null, notes: 'New complaint - lower back pain', created_at: at(0, 12) },
    ],
    reports: [
      { id: crypto.randomUUID(), patient_id: p1, visit_id: v1, report_date: at(-13, 9).slice(0, 10), report_name: 'Right knee X-ray', mime: 'image/svg+xml', dataUrl: DEMO_XRAY, created_at: at(-13, 9) },
    ],
  }
}

// Patients with a sooner upcoming appointment come first; those with none
// fall to the bottom, then alphabetical.
function byNextAppointment(a, b) {
  const an = a.next_appointment, bn = b.next_appointment
  if (an && bn) return an < bn ? -1 : an > bn ? 1 : 0
  if (an) return -1
  if (bn) return 1
  return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
}

function demoCheck(code, admin = false) {
  if (admin) {
    if (code !== DEMO_ADMIN_PASSCODE) throw new Error('Admin passcode required')
  } else if (code !== DEMO_STAFF_PASSCODE && code !== DEMO_ADMIN_PASSCODE && !DEMO_DOCTOR_PASSCODES[code]) {
    throw new Error('Incorrect passcode')
  }
}

// Money reports: admin or a doctor (scoped), never staff.
function demoCheckReports(code) {
  if (code !== DEMO_ADMIN_PASSCODE && !DEMO_DOCTOR_PASSCODES[code]) {
    throw new Error('Not allowed')
  }
}

// The doctor the current demo session is limited to (null = see all).
function demoScope() {
  return DEMO_DOCTOR_PASSCODES[staffCode] || null
}

// Visits for a patient, optionally limited to one doctor's visits.
function patientVisits(db, id, scope) {
  return db.visits.filter((v) => v.patient_id === id && (!scope || v.doctor === scope))
}

function patientStats(db, id, scope = null) {
  const vs = patientVisits(db, id, scope)
  const ch = vs.reduce((a, v) => a + Number(v.fee_charged), 0)
  const rec = vs.reduce((a, v) => a + Number(v.payment_received), 0)
  const nowIso = new Date().toISOString()
  // Soonest upcoming appointment (a future visit_at) or follow-up.
  const future = []
  for (const v of vs) {
    if (v.visit_at && v.visit_at >= nowIso) future.push(v.visit_at)
    if (v.next_appointment && v.next_appointment >= nowIso) future.push(v.next_appointment)
  }
  future.sort()
  return {
    total_visits: vs.length,
    total_charged: ch,
    total_received: rec,
    balance_due: ch - rec,
    last_visit: vs.map((v) => v.visit_at).sort().pop() || null,
    next_appointment: future[0] || null,
  }
}

// ---------------- Public API ----------------

// Returns "admin" | "staff" | "doctor:Name" | null.
export async function verifyPasscode(code) {
  if (IS_DEMO) {
    if (code === DEMO_ADMIN_PASSCODE) return 'admin'
    if (code === DEMO_STAFF_PASSCODE) return 'staff'
    if (DEMO_DOCTOR_PASSCODES[code]) return `doctor:${DEMO_DOCTOR_PASSCODES[code]}`
    return null
  }
  const { data, error } = await supabase.rpc('verify_passcode', { p_passcode: code })
  if (error) throw new Error(friendly(error.message))
  return data
}

export async function listPatients(search = '') {
  if (IS_DEMO) {
    demoCheck(staffCode)
    const db = demoDb()
    const scope = demoScope()
    const q = search.trim().toLowerCase()
    return db.patients
      // A doctor only sees patients they've treated.
      .filter((p) => !scope || patientVisits(db, p.id, scope).length > 0)
      .filter((p) => !q ||
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
        p.phone.includes(q.replace(/\s/g, '')))
      .map((p) => ({ ...p, ...patientStats(db, p.id, scope) }))
      .sort(byNextAppointment)
  }
  // Re-sort client-side too, so ordering is correct even if the database
  // function hasn't been updated yet.
  const list = await rpc('list_patients', { p_passcode: staffCode, p_search: search })
  return (list || []).sort(byNextAppointment)
}

// Totals (visits, charged, received, balance) are derived from the visits
// array by the caller — no separate query needed.
export async function getPatient(id) {
  if (IS_DEMO) {
    demoCheck(staffCode)
    const db = demoDb()
    const scope = demoScope()
    const visits = patientVisits(db, id, scope)
      .sort((a, b) => b.visit_at.localeCompare(a.visit_at))
    const visitIds = new Set(visits.map((v) => v.id))
    return {
      patient: db.patients.find((p) => p.id === id) || null,
      visits,
      // Doctors only see reports tied to their own visits.
      reports: db.reports.filter((r) => r.patient_id === id && (!scope || visitIds.has(r.visit_id)))
        .map(({ dataUrl, ...meta }) => meta)
        .sort((a, b) => b.report_date.localeCompare(a.report_date)),
    }
  }
  return rpc('get_patient', { p_passcode: staffCode, p_id: id })
}

export async function createPatient(f) {
  if (IS_DEMO) {
    demoCheck(staffCode)
    const db = demoDb()
    const id = crypto.randomUUID()
    db.patients.push({ id, ...f, created_at: new Date().toISOString() })
    demoSave(db)
    return id
  }
  return rpc('create_patient', {
    p_passcode: staffCode, p_first_name: f.first_name, p_last_name: f.last_name,
    p_phone: f.phone, p_age: f.age ? Number(f.age) : null, p_gender: f.gender || null,
    p_medical_alerts: f.medical_alerts || null, p_address: f.address || null,
  })
}

export async function updatePatient(id, f) {
  if (IS_DEMO) {
    demoCheck(staffCode)
    const db = demoDb()
    db.patients = db.patients.map((p) => (p.id === id ? { ...p, ...f } : p))
    demoSave(db)
    return
  }
  await rpc('update_patient', {
    p_passcode: staffCode, p_id: id, p_first_name: f.first_name, p_last_name: f.last_name,
    p_phone: f.phone, p_age: f.age ? Number(f.age) : null, p_gender: f.gender || null,
    p_medical_alerts: f.medical_alerts || null, p_address: f.address || null,
  })
}

export async function deletePatient(id, adminCode) {
  if (IS_DEMO) {
    demoCheck(adminCode, true)
    const db = demoDb()
    db.patients = db.patients.filter((p) => p.id !== id)
    db.visits = db.visits.filter((v) => v.patient_id !== id)
    db.reports = db.reports.filter((r) => r.patient_id !== id)
    demoSave(db)
    return
  }
  await rpc('delete_patient', { p_admin_passcode: adminCode, p_id: id })
}

const visitParams = (f) => ({
  p_doctor: f.doctor || null, p_visit_at: f.visit_at, p_category: f.category,
  p_affected_area: f.affected_area || null, p_treatment_details: f.treatment_details || null,
  p_fee_charged: Number(f.fee_charged) || 0, p_payment_received: Number(f.payment_received) || 0,
  p_payment_mode: f.payment_mode || null,
  p_next_appointment: f.next_appointment || null, p_notes: f.notes || null,
})

export async function addVisit(patientId, f) {
  if (IS_DEMO) {
    demoCheck(staffCode)
    const db = demoDb()
    const scope = demoScope()
    db.visits.push({
      id: crypto.randomUUID(), patient_id: patientId, ...f,
      doctor: scope || f.doctor, // a doctor login can only create their own visits
      fee_charged: Number(f.fee_charged) || 0, payment_received: Number(f.payment_received) || 0,
      next_appointment: f.next_appointment || null, created_at: new Date().toISOString(),
    })
    demoSave(db)
    return
  }
  await rpc('add_visit', { p_passcode: staffCode, p_patient_id: patientId, ...visitParams(f) })
}

export async function updateVisit(id, f) {
  if (IS_DEMO) {
    demoCheck(staffCode)
    const db = demoDb()
    const scope = demoScope()
    db.visits = db.visits.map((v) => (v.id === id
      ? { ...v, ...f, doctor: scope || f.doctor, fee_charged: Number(f.fee_charged) || 0, payment_received: Number(f.payment_received) || 0, next_appointment: f.next_appointment || null }
      : v))
    demoSave(db)
    return
  }
  await rpc('update_visit', { p_passcode: staffCode, p_id: id, ...visitParams(f) })
}

export async function deleteVisit(id, adminCode) {
  if (IS_DEMO) {
    demoCheck(adminCode, true)
    const db = demoDb()
    db.visits = db.visits.filter((v) => v.id !== id)
    demoSave(db)
    return
  }
  await rpc('delete_visit', { p_admin_passcode: adminCode, p_id: id })
}

export async function addReport(patientId, visitId, { report_date, report_name, mime, dataUrl }) {
  if (IS_DEMO) {
    demoCheck(staffCode)
    const db = demoDb()
    const id = crypto.randomUUID()
    db.reports.push({
      id, patient_id: patientId, visit_id: visitId, report_date, report_name,
      mime, dataUrl, created_at: new Date().toISOString(),
    })
    demoSave(db)
    return id
  }
  return rpc('add_report', {
    p_passcode: staffCode, p_patient_id: patientId, p_visit_id: visitId, p_report_date: report_date,
    p_report_name: report_name, p_mime: mime, p_data: dataUrl.split(',')[1],
  })
}

export async function getReportDataUrl(id) {
  if (IS_DEMO) {
    demoCheck(staffCode)
    return demoDb().reports.find((r) => r.id === id)?.dataUrl
  }
  const data = await rpc('get_report', { p_passcode: staffCode, p_id: id })
  return joinDataUrl(data.mime, data.data)
}

export async function deleteReport(id, adminCode) {
  if (IS_DEMO) {
    demoCheck(adminCode, true)
    const db = demoDb()
    db.reports = db.reports.filter((r) => r.id !== id)
    demoSave(db)
    return
  }
  await rpc('delete_report', { p_admin_passcode: adminCode, p_id: id })
}

// ---------- Money reports (admin sees all; a doctor sees only their own) ----------

export async function getReportsSummary() {
  if (IS_DEMO) {
    demoCheckReports(staffCode)
    const db = demoDb()
    const scope = demoScope()
    const now = new Date()
    const since = (months) => new Date(now.getFullYear(), now.getMonth() - months, now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const inRange = (v, from) => new Date(v.visit_at) >= from
    const rec = (list) => list.reduce((a, v) => a + Number(v.payment_received), 0)
    const vs = db.visits.filter((v) => !scope || v.doctor === scope)
    const last12 = vs.filter((v) => inRange(v, since(12)))
    const groupSum = (list, keyFn) => {
      const m = {}
      for (const v of list) {
        const k = keyFn(v)
        m[k] = m[k] || { total: 0, visits: 0 }
        m[k].total += Number(v.payment_received)
        m[k].visits += 1
      }
      return m
    }
    const byCat = groupSum(last12, (v) => v.category)
    const byMode = groupSum(last12, (v) => v.payment_mode || 'Unspecified')
    const byDoctor = groupSum(last12, (v) => v.doctor || 'Unassigned')
    const byPatient = groupSum(last12, (v) => v.patient_id)
    const months = {}
    for (const v of last12) {
      const m = v.visit_at.slice(0, 7)
      months[m] = (months[m] || 0) + Number(v.payment_received)
    }
    const name = (id) => {
      const p = db.patients.find((x) => x.id === id)
      return p ? `${p.first_name} ${p.last_name}` : 'Unknown'
    }
    return {
      totals: {
        today: rec(vs.filter((v) => new Date(v.visit_at).toDateString() === now.toDateString())),
        this_month: rec(vs.filter((v) => inRange(v, monthStart))),
        six_months: rec(vs.filter((v) => inRange(v, since(6)))),
        twelve_months: rec(last12),
        all_time: rec(vs),
        outstanding: vs.reduce((a, v) => a + Number(v.fee_charged) - Number(v.payment_received), 0),
      },
      monthly: Object.entries(months).sort().map(([month, total]) => ({ month, total })),
      by_category: Object.entries(byCat).map(([category, x]) => ({ category, ...x })).sort((a, b) => b.total - a.total),
      by_mode: Object.entries(byMode).map(([mode, x]) => ({ mode, total: x.total })).sort((a, b) => b.total - a.total),
      by_doctor: Object.entries(byDoctor).map(([doctor, x]) => ({ doctor, ...x })).sort((a, b) => b.total - a.total),
      top_patients: Object.entries(byPatient)
        .map(([pid, x]) => ({ patient_id: pid, patient_name: name(pid), ...x }))
        .sort((a, b) => b.total - a.total).slice(0, 10),
    }
  }
  return rpc('get_reports_summary', { p_admin_passcode: staffCode })
}

export async function exportAll() {
  if (IS_DEMO) {
    demoCheckReports(staffCode)
    const db = demoDb()
    const scope = demoScope()
    const name = (id) => {
      const p = db.patients.find((x) => x.id === id)
      return p ? `${p.first_name} ${p.last_name}` : 'Unknown'
    }
    const phone = (id) => db.patients.find((x) => x.id === id)?.phone || ''
    const scopedVisits = db.visits.filter((v) => !scope || v.doctor === scope)
    const scopedVisitIds = new Set(scopedVisits.map((v) => v.id))
    return {
      patients: db.patients
        .filter((p) => !scope || patientVisits(db, p.id, scope).length > 0)
        .map((p) => ({ ...p, ...patientStats(db, p.id, scope) }))
        .sort((a, b) => a.first_name.localeCompare(b.first_name)),
      visits: scopedVisits
        .sort((a, b) => a.visit_at.localeCompare(b.visit_at))
        .map((v) => ({
          visit_at: v.visit_at, patient_name: name(v.patient_id), phone: phone(v.patient_id),
          doctor: v.doctor, category: v.category, affected_area: v.affected_area,
          treatment_details: v.treatment_details, fee_charged: v.fee_charged,
          payment_received: v.payment_received, payment_mode: v.payment_mode,
          next_appointment: v.next_appointment, notes: v.notes,
        })),
      reports: db.reports
        .filter((r) => !scope || scopedVisitIds.has(r.visit_id))
        .map((r) => ({
          id: r.id, patient_name: name(r.patient_id), report_name: r.report_name,
          report_date: r.report_date, mime: r.mime,
        }))
        .sort((a, b) => a.report_date.localeCompare(b.report_date)),
    }
  }
  return rpc('export_all', { p_admin_passcode: staffCode })
}

export async function getDashboard() {
  if (IS_DEMO) {
    demoCheck(staffCode)
    const db = demoDb()
    const scope = demoScope()
    const visits = db.visits.filter((v) => !scope || v.doctor === scope)
    const now = new Date()
    const todayStr = now.toDateString()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toDateString()
    const name = (id) => {
      const p = db.patients.find((x) => x.id === id)
      return p ? `${p.first_name} ${p.last_name}` : 'Unknown'
    }
    const apptRow = (v) => ({ id: v.id, patient_id: v.patient_id, patient_name: name(v.patient_id), doctor: v.doctor, visit_at: v.visit_at, category: v.category, payment_received: v.payment_received, payment_mode: v.payment_mode })
    const onDay = (str) => visits
      .filter((v) => new Date(v.visit_at).toDateString() === str)
      .sort((a, b) => a.visit_at.localeCompare(b.visit_at))
      .map(apptRow)
    return {
      today: onDay(todayStr),
      tomorrow: onDay(tomorrowStr),
      followups: visits
        .filter((v) => v.next_appointment && new Date(v.next_appointment) >= new Date(now.getTime() - 12 * 3600 * 1000))
        .sort((a, b) => a.next_appointment.localeCompare(b.next_appointment))
        .map((v) => ({ id: v.id, patient_id: v.patient_id, patient_name: name(v.patient_id), doctor: v.doctor, next_appointment: v.next_appointment, category: v.category })),
    }
  }
  return rpc('get_dashboard', { p_passcode: staffCode })
}
