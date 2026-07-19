// CSV building + download helpers. The BOM prefix makes Excel open
// files with correct ₹/Unicode handling.
const esc = (v) => {
  if (v == null) return ''
  const s = String(v)
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

export function csvString(headers, rows) {
  const lines = [headers.map(esc).join(',')]
  for (const row of rows) lines.push(row.map(esc).join(','))
  return '﻿' + lines.join('\r\n')
}

export function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadCsv(filename, headers, rows) {
  downloadBlob(filename, new Blob([csvString(headers, rows)], { type: 'text/csv;charset=utf-8' }))
}

const fmt = (iso) => (iso ? new Date(iso).toLocaleString('en-IN') : '')

export function patientsTable(patients) {
  return {
    headers: ['First Name', 'Last Name', 'Phone', 'Age', 'Gender', 'Medical Alerts',
      'Address', 'Total Visits', 'Total Charged', 'Total Received', 'Balance Due', 'Added On'],
    rows: patients.map((p) => [
      p.first_name, p.last_name, p.phone, p.age, p.gender, p.medical_alerts, p.address,
      p.total_visits, p.total_charged, p.total_received, p.balance_due, fmt(p.created_at),
    ]),
  }
}

export function visitsTable(visits) {
  return {
    headers: ['Date & Time', 'Patient', 'Phone', 'Doctor', 'Category', 'Affected Area', 'Treatment Details',
      'Fee Charged', 'Payment Received', 'Payment Mode', 'Next Appointment', 'Notes'],
    rows: visits.map((v) => [
      fmt(v.visit_at), v.patient_name, v.phone, v.doctor, v.category, v.affected_area,
      v.treatment_details, v.fee_charged, v.payment_received, v.payment_mode,
      fmt(v.next_appointment), v.notes,
    ]),
  }
}

// Month-by-month financial summary derived from the visits export.
export function financialsTable(visits) {
  const months = {}
  for (const v of visits) {
    const m = String(v.visit_at).slice(0, 7)
    months[m] = months[m] || { charged: 0, received: 0, visits: 0 }
    months[m].charged += Number(v.fee_charged) || 0
    months[m].received += Number(v.payment_received) || 0
    months[m].visits += 1
  }
  return {
    headers: ['Month', 'Visits', 'Total Charged', 'Total Received', 'Pending That Month'],
    rows: Object.entries(months).sort().map(([m, x]) => [
      m, x.visits, x.charged, x.received, x.charged - x.received,
    ]),
  }
}

export function safeFileName(s) {
  return String(s || '').replace(/[^a-zA-Z0-9 _.-]/g, '').trim().replace(/\s+/g, '_').slice(0, 60) || 'file'
}

export function mimeToExt(mime) {
  if (mime === 'application/pdf') return 'pdf'
  if (mime === 'image/png') return 'png'
  if (mime === 'image/svg+xml') return 'svg'
  return 'jpg'
}
