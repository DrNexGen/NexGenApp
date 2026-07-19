// Hospital identity — shown in the app header.
export const CLINIC_NAME = 'NexGen Hospital'
export const CLINIC_TAGLINE = 'Orthopaedics & Physiotherapy'

// Supabase credentials come from environment variables.
// Locally: copy .env.example to .env. On Vercel: Project Settings -> Env Variables.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Without credentials the app runs in demo mode (data stays on this device).
export const IS_DEMO = !SUPABASE_URL || !SUPABASE_ANON_KEY
export const DEMO_STAFF_PASSCODE = '1234'
export const DEMO_ADMIN_PASSCODE = '9999'
// Demo passcodes for each doctor login (see only their own data).
export const DEMO_DOCTOR_PASSCODES = {
  '1111': 'Dr. Varun',
  '2222': 'Dr. Umashankar',
}

// Parse the server/demo passcode result "admin" | "staff" | "doctor:Name"
// into a session object. Returns null for an unknown passcode.
export function parseRole(result) {
  if (!result) return null
  if (result === 'admin') return { role: 'admin', doctor: null }
  if (result === 'staff') return { role: 'staff', doctor: null }
  if (result.startsWith('doctor:')) return { role: 'doctor', doctor: result.slice(7) }
  return null
}

// The two practitioners, each with their department.
export const DOCTORS = [
  { name: 'Dr. Varun', dept: 'Orthopaedics' },
  { name: 'Dr. Umashankar', dept: 'Physiotherapy' },
]

export const deptForDoctor = (name) => DOCTORS.find((d) => d.name === name)?.dept || ''

// Treatment categories depend on which department the appointment is with.
export const CATEGORIES_BY_DEPT = {
  Orthopaedics: [
    'Consultation',
    'Follow-up',
    'Fracture',
    'Dislocation',
    'Arthritis',
    'Back / joint pain',
    'Sprain / Strain',
    'Sports injury',
    'Injection',
    'Pre-surgery',
    'Post-surgery review',
    'X-Ray / MRI review',
    'Other',
  ],
  Physiotherapy: [
    'Assessment',
    'Physiotherapy session',
    'Exercise therapy',
    'Electrotherapy (IFT/TENS/US)',
    'Manual therapy',
    'Post-op rehab',
    'Post-fracture rehab',
    'Package session',
    'Other',
  ],
}

// Every category across both departments (used where department is unknown).
export const ALL_CATEGORIES = [
  ...new Set([...CATEGORIES_BY_DEPT.Orthopaedics, ...CATEGORIES_BY_DEPT.Physiotherapy]),
]

export const categoriesFor = (dept) => CATEGORIES_BY_DEPT[dept] || ALL_CATEGORIES

// Affected body regions — the ortho/physio equivalent of the dental tooth chart.
export const BODY_REGIONS = [
  { label: 'Spine', items: ['Neck', 'Upper back', 'Lower back'] },
  { label: 'Left arm', items: ['L Shoulder', 'L Elbow', 'L Wrist / Hand'] },
  { label: 'Right arm', items: ['R Shoulder', 'R Elbow', 'R Wrist / Hand'] },
  { label: 'Left leg', items: ['L Hip', 'L Knee', 'L Ankle / Foot'] },
  { label: 'Right leg', items: ['R Hip', 'R Knee', 'R Ankle / Foot'] },
]

export const PAYMENT_MODES = ['Cash', 'UPI']

// Convert 24h "HH:MM" to a 12-hour label like "9:00 AM".
export function to12h(hhmm) {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  const period = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

// Bookable time slots: 9:00 AM to 9:00 PM, every 30 minutes.
export const TIME_SLOTS = (() => {
  const out = []
  for (let mins = 9 * 60; mins <= 21 * 60; mins += 30) {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    out.push({ value, label: to12h(value) })
  }
  return out
})()

export const MEDICAL_ALERTS = [
  'Diabetes',
  'High BP (Hypertension)',
  'Heart disease',
  'On blood thinners',
  'Osteoporosis',
  'Previous surgery / implant',
  'Asthma',
  'Thyroid disorder',
  'Epilepsy / seizures',
  'Pregnancy',
  'Allergy: Penicillin',
  'Other drug allergy',
  'Bleeding disorder',
  'Smoker / tobacco use',
  'Immunocompromised',
]

// Alerts are stored in one text column as "Chip1, Chip2 | free notes" so
// no database change is needed and old free-text entries keep working.
export function serializeMedicalAlerts(chips, notes) {
  const n = (notes || '').trim()
  if (chips.length && n) return `${chips.join(', ')} | ${n}`
  if (chips.length) return chips.join(', ')
  return n
}

export function parseMedicalAlerts(text) {
  const t = (text || '').trim()
  if (!t) return { chips: [], notes: '' }
  const [head, ...rest] = t.split(' | ')
  const tokens = head.split(',').map((s) => s.trim()).filter(Boolean)
  const chips = tokens.filter((x) => MEDICAL_ALERTS.includes(x))
  const unknown = tokens.filter((x) => !MEDICAL_ALERTS.includes(x))
  const notes = [unknown.join(', '), rest.join(' | ')].filter(Boolean).join(' ').trim()
  return { chips, notes }
}

export const GENDERS = ['Male', 'Female']

export const rupees = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
