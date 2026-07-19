import { useState } from 'react'
import { createPatient, updatePatient } from '../lib/store.js'
import { GENDERS, MEDICAL_ALERTS, parseMedicalAlerts, serializeMedicalAlerts } from '../config.js'
import { Modal, Field } from './ui.jsx'

export default function PatientForm({ existing, onClose, onSaved }) {
  const parsedAlerts = parseMedicalAlerts(existing?.medical_alerts)
  const [alerts, setAlerts] = useState(parsedAlerts.chips)
  const [alertNotes, setAlertNotes] = useState(parsedAlerts.notes)
  const [form, setForm] = useState({
    first_name: existing?.first_name || '',
    last_name: existing?.last_name || '',
    phone: existing?.phone || '',
    age: existing?.age ?? '',
    gender: existing?.gender || '',
    address: existing?.address || '',
  })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value })
    if (errors[k]) setErrors({ ...errors, [k]: '' })
  }

  // Age: digits only, capped at 2 characters.
  const setAge = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 2)
    setForm((f) => ({ ...f, age: v }))
    if (errors.age) setErrors({ ...errors, age: '' })
  }

  const submit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.first_name.trim()) errs.first_name = 'First name is required'
    if (!/^[0-9+\-() ]{7,15}$/.test(form.phone.trim())) errs.phone = 'Enter a valid phone number'
    if (form.age !== '' && (!/^\d{1,2}$/.test(String(form.age)) || Number(form.age) < 0)) errs.age = 'Enter a valid age'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    setSubmitError('')
    try {
      const clean = {
        ...form,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        medical_alerts: serializeMedicalAlerts(alerts, alertNotes),
        address: form.address.trim(),
      }
      if (existing) {
        await updatePatient(existing.id, clean)
        onSaved(existing.id)
      } else {
        const id = await createPatient(clean)
        onSaved(id)
      }
    } catch (err) {
      setSubmitError(err.message)
      setBusy(false)
    }
  }

  return (
    <Modal title={existing ? 'Edit patient' : 'New patient'} onClose={onClose}>
      <form onSubmit={submit} noValidate className="stack">
        <div className="field-row">
          <Field label="First name" required error={errors.first_name}>
            <input value={form.first_name} onChange={set('first_name')} autoComplete="off" />
          </Field>
          <Field label="Last name">
            <input value={form.last_name} onChange={set('last_name')} autoComplete="off" />
          </Field>
        </div>
        <Field label="Phone number" required error={errors.phone}>
          <input type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} autoComplete="off" />
        </Field>
        <div className="field-row">
          <Field label="Age" error={errors.age}>
            <input type="number" inputMode="numeric" min="0" max="99" value={form.age} onChange={setAge} />
          </Field>
          <Field label="Gender">
            <select value={form.gender} onChange={set('gender')}>
              <option value="">Select…</option>
              {GENDERS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </Field>
        </div>
        <div className="field">
          <span className="field-label">Medical alerts (tap all that apply)</span>
          <div className="alert-picker">
            {MEDICAL_ALERTS.map((a) => (
              <button
                type="button"
                key={a}
                className={alerts.includes(a) ? 'alert-chip selected' : 'alert-chip'}
                onClick={() => setAlerts((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]))}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        {submitError && <p className="error-text" role="alert">{submitError}</p>}
        <button type="submit" className="btn-primary btn-block" disabled={busy}>
          {busy ? 'Saving…' : existing ? 'Save changes' : 'Add patient'}
        </button>
      </form>
    </Modal>
  )
}
