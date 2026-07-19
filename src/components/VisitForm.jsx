import { useState } from 'react'
import { addVisit, updateVisit, addReport } from '../lib/store.js'
import { prepareReportFile } from '../lib/images.js'
import {
  DOCTORS, deptForDoctor, categoriesFor, PAYMENT_MODES, BODY_REGIONS, TIME_SLOTS, to12h,
} from '../config.js'
import { Modal, Field, toLocalInput, fromLocalInput } from './ui.jsx'

export default function VisitForm({ patientId, existing, reports = [], onReportsChanged, onClose, onSaved }) {
  // Booking (new) captures only when + why + which doctor. Money, outcomes and
  // a follow-up are filled in afterwards by editing the appointment once done.
  const isEdit = existing != null
  const nowLocalDate = toLocalInput(new Date().toISOString()).split('T')[0]
  const [initDate, initTime] = existing?.visit_at
    ? toLocalInput(existing.visit_at).split('T')
    : [nowLocalDate, '']
  const [naDate, naTime] = existing?.next_appointment
    ? toLocalInput(existing.next_appointment).split('T')
    : ['', '']

  const [form, setForm] = useState({
    doctor: existing?.doctor || '',
    visit_date: initDate,
    visit_time: initTime,
    category: existing?.category || '',
    treatment_details: existing?.treatment_details || '',
    fee_charged: existing?.fee_charged ?? '',
    payment_received: existing?.payment_received ?? '',
    payment_mode: existing?.payment_mode || 'Cash',
    next_date: naDate,
    next_time: naTime,
    notes: existing?.notes || '',
  })
  const [regions, setRegions] = useState(
    existing?.affected_area ? existing.affected_area.split(',').map((t) => t.trim()).filter(Boolean) : []
  )
  const [showRegions, setShowRegions] = useState(!!existing?.affected_area)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [submitError, setSubmitError] = useState('')
  // Pre-fill payment with the charged amount until the user edits it themselves.
  const [paymentTouched, setPaymentTouched] = useState(existing != null)
  // Reports attached to this consultation (uploaded immediately on pick).
  const [attached, setAttached] = useState(reports)
  const [uploading, setUploading] = useState(false)
  const [reportError, setReportError] = useState('')

  const categoryOptions = categoriesFor(deptForDoctor(form.doctor))

  const pickReport = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setReportError('')
    try {
      const prepared = await prepareReportFile(file)
      const report_name = file.name.replace(/\.[^.]+$/, '').slice(0, 60) || 'Report'
      const id = await addReport(patientId, existing.id, {
        report_date: new Date().toISOString().slice(0, 10),
        report_name, mime: prepared.mime, dataUrl: prepared.dataUrl,
      })
      setAttached((cur) => [...cur, { id, report_name, mime: prepared.mime }])
      onReportsChanged?.()
    } catch (err) {
      setReportError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const set = (k) => (e) => {
    const value = e.target.value
    setForm((f) => {
      const next = { ...f, [k]: value }
      if (k === 'fee_charged' && !paymentTouched) next.payment_received = value
      // Switching doctor may make the chosen category invalid — clear it.
      if (k === 'doctor') {
        const allowed = categoriesFor(deptForDoctor(value))
        if (next.category && !allowed.includes(next.category)) next.category = ''
      }
      return next
    })
    if (k === 'payment_received') setPaymentTouched(true)
    if (errors[k]) setErrors({ ...errors, [k]: '' })
  }

  const toggleRegion = (t) =>
    setRegions((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))

  // Show the standard slots; if an existing time is off-grid, include it too.
  const slotOptions = (time) => {
    const values = TIME_SLOTS.map((s) => s.value)
    return time && !values.includes(time)
      ? [{ value: time, label: to12h(time) }, ...TIME_SLOTS]
      : TIME_SLOTS
  }

  const submit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.doctor) errs.doctor = 'Select a doctor'
    if (!form.visit_date) errs.visit_date = 'Date required'
    if (!form.visit_time) errs.visit_time = 'Time required'
    if (!form.category) errs.category = 'Select a category'
    if (isEdit) {
      if (Number(form.fee_charged) < 0) errs.fee_charged = 'Enter a valid amount'
      if (Number(form.payment_received) < 0) errs.payment_received = 'Enter a valid amount'
      if (!!form.next_date !== !!form.next_time) errs.next_time = 'Pick both a date and time'
    }
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    setSubmitError('')
    try {
      const { visit_date, visit_time, next_date, next_time, ...rest } = form
      const payload = {
        ...rest,
        visit_at: fromLocalInput(`${visit_date}T${visit_time}`),
        next_appointment: isEdit && next_date && next_time
          ? fromLocalInput(`${next_date}T${next_time}`)
          : null,
        affected_area: regions.join(', '),
        treatment_details: form.treatment_details.trim(),
        notes: form.notes.trim(),
      }
      if (existing) await updateVisit(existing.id, payload)
      else await addVisit(patientId, payload)
      onSaved()
    } catch (err) {
      setSubmitError(err.message)
      setBusy(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Update appointment' : 'Book appointment'} onClose={onClose}>
      <form onSubmit={submit} noValidate className="stack">
        {!isEdit && (
          <p className="form-hint">Book the appointment now. After the consultation, open it again to add the fee, payment, and reports.</p>
        )}
        <Field label="Doctor" required error={errors.doctor}>
          <select value={form.doctor} onChange={set('doctor')}>
            <option value="">Select…</option>
            {DOCTORS.map((d) => <option key={d.name} value={d.name}>{d.name} — {d.dept}</option>)}
          </select>
        </Field>
        <div className="field-row">
          <Field label="Date" required error={errors.visit_date}>
            <input type="date" value={form.visit_date} onChange={set('visit_date')} />
          </Field>
          <Field label="Time" required error={errors.visit_time}>
            <select value={form.visit_time} onChange={set('visit_time')}>
              <option value="">Select…</option>
              {slotOptions(form.visit_time).map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Treatment category" required error={errors.category}>
          <select value={form.category} onChange={set('category')} disabled={!form.doctor}>
            <option value="">{form.doctor ? 'Select…' : 'Choose a doctor first'}</option>
            {categoryOptions.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>

        <div className="field">
          <span className="field-label">
            Affected area {regions.length > 0 && <span className="teeth-summary">— {regions.join(', ')}</span>}
          </span>
          {!showRegions ? (
            <button type="button" className="btn-outline btn-small-full" onClick={() => setShowRegions(true)}>
              Select area
            </button>
          ) : (
            <div className="region-picker">
              {BODY_REGIONS.map((g) => (
                <div key={g.label} className="region-group">
                  <span className="quadrant-label">{g.label}</span>
                  <div className="region-row">
                    {g.items.map((t) => (
                      <button
                        type="button"
                        key={t}
                        className={regions.includes(t) ? 'region-chip selected' : 'region-chip'}
                        onClick={() => toggleRegion(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {isEdit && (
          <>
            <Field label="Treatment / notes for this visit">
              <textarea rows="2" value={form.treatment_details} onChange={set('treatment_details')} placeholder="What was done in this session" />
            </Field>

            <div className="field">
              <span className="field-label">Reports, X-rays &amp; scans</span>
              {attached.length > 0 && (
                <div className="report-chips">
                  {attached.map((r) => (
                    <span key={r.id} className="report-chip report-chip-static">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
                      {r.report_name}
                    </span>
                  ))}
                </div>
              )}
              <label className="file-drop file-drop-compact">
                <input type="file" accept="image/*,application/pdf" capture="environment" hidden onChange={pickReport} disabled={uploading} />
                <span className="file-cta">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7l1.5-3h5L16 7" /><circle cx="12" cy="13" r="3.5" /></svg>
                  {uploading ? 'Uploading…' : 'Take photo or upload document'}
                </span>
              </label>
              {reportError && <span className="field-error">{reportError}</span>}
            </div>

            <div className="field-row">
              <Field label="Fee charged (₹)" error={errors.fee_charged}>
                <input type="number" inputMode="numeric" min="0" value={form.fee_charged} onChange={set('fee_charged')} placeholder="500" />
              </Field>
              <Field label="Payment received (₹)" error={errors.payment_received}>
                <input type="number" inputMode="numeric" min="0" value={form.payment_received} onChange={set('payment_received')} placeholder="500" />
              </Field>
            </div>

            <Field label="Payment mode">
              <select value={form.payment_mode} onChange={set('payment_mode')}>
                {PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}
              </select>
            </Field>

            <div className="field-row">
              <Field label="Follow-up date (optional)">
                <input type="date" value={form.next_date} onChange={set('next_date')} />
              </Field>
              <Field label="Follow-up time" error={errors.next_time}>
                <select value={form.next_time} onChange={set('next_time')}>
                  <option value="">Select…</option>
                  {slotOptions(form.next_time).map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
            </div>
          </>
        )}

        <Field label="Comments (optional)">
          <textarea rows="2" value={form.notes} onChange={set('notes')} placeholder="Anything to remember" />
        </Field>

        {submitError && <p className="error-text" role="alert">{submitError}</p>}
        <button type="submit" className="btn-primary btn-block" disabled={busy}>
          {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Book appointment'}
        </button>
      </form>
    </Modal>
  )
}
