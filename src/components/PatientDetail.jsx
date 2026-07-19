import { useCallback, useEffect, useState } from 'react'
import {
  getPatient, deletePatient, deleteReport, getReportDataUrl, isAdmin,
} from '../lib/store.js'
import { rupees } from '../config.js'
import { Avatar, Spinner, AdminConfirm, Modal, fmtDate, fmtDateTime } from './ui.jsx'
import PatientForm from './PatientForm.jsx'
import VisitForm from './VisitForm.jsx'

export default function PatientDetail({ id, onBack, onName }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null) // {type, payload}

  const refresh = useCallback(async () => {
    try {
      const d = await getPatient(id)
      if (!d.patient) { onBack(); return }
      setData(d)
      onName?.(`${d.patient.first_name} ${d.patient.last_name}`.trim())
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }, [id, onBack, onName])

  useEffect(() => { refresh() }, [refresh])

  if (error) return <div className="empty-state"><p className="error-text">{error}</p><button className="btn-primary" onClick={refresh}>Retry</button></div>
  if (!data) return <Spinner text="Loading patient…" />

  const { patient: p, visits, reports } = data
  const admin = isAdmin()
  const charged = visits.reduce((a, v) => a + Number(v.fee_charged), 0)
  const received = visits.reduce((a, v) => a + Number(v.payment_received), 0)
  const balance = charged - received
  const close = () => setModal(null)
  const closeAndRefresh = () => { setModal(null); refresh() }

  // Group reports under the consultation they belong to.
  const reportsByVisit = {}
  const looseReports = []
  for (const r of reports) {
    if (r.visit_id) (reportsByVisit[r.visit_id] ||= []).push(r)
    else looseReports.push(r)
  }

  const viewReport = (r) => setModal({ type: 'viewReport', payload: r })

  return (
    <div>
      <button className="back-btn" onClick={onBack}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        All patients
      </button>

      <div className="detail-head">
        <Avatar name={`${p.first_name} ${p.last_name}`} />
        <div className="card-main">
          <strong className="detail-name">{p.first_name} {p.last_name}</strong>
          <span className="card-sub">
            {[p.age && `${p.age} yrs`, p.gender, p.address].filter(Boolean).join(' · ')}
          </span>
          <a className="phone-link" href={`tel:${p.phone}`}>{p.phone}</a>
        </div>
        <button className="icon-btn" onClick={() => setModal({ type: 'editPatient' })} aria-label="Edit patient">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3zM13.5 6.5l3 3" /></svg>
        </button>
      </div>

      {p.medical_alerts && (
        <div className="alert-banner" role="note">
          <strong>Medical alert:</strong> {p.medical_alerts.replace(' | ', ' · ')}
        </div>
      )}

      <div className="stats-grid stats-2">
        <div className="stat"><span className="stat-label">Total Visits</span><span className="stat-value">{visits.length}</span></div>
        <div className={balance > 0 ? 'stat stat-due' : 'stat'}><span className="stat-label">Balance Payment</span><span className="stat-value">{rupees(balance)}</span></div>
      </div>

      <button className="btn-primary btn-block create-appt-btn" onClick={() => setModal({ type: 'newVisit' })}>
        Create Appointment
      </button>

      <h3 className="section-title">Appointment history</h3>
      {visits.length === 0 && <p className="muted section-empty">No appointments yet.</p>}
      {visits.map((v) => {
        const billed = Number(v.fee_charged) > 0 || Number(v.payment_received) > 0
        const vReports = reportsByVisit[v.id] || []
        return (
          <article key={v.id} className="card visit-card" onClick={() => setModal({ type: 'editVisit', payload: v })}>
            <div className="visit-top">
              <span className="pill pill-cat">{v.category}</span>
              <span className="visit-when">{fmtDateTime(v.visit_at)}</span>
            </div>
            {v.doctor && <p className="visit-doctor">{v.doctor}</p>}
            {(v.affected_area || v.treatment_details) && (
              <p className="visit-details">
                {v.affected_area && <span className="muted">{v.affected_area} · </span>}
                {v.treatment_details}
              </p>
            )}
            {billed ? (
              <div className="visit-money">
                <span>Charged <strong>{rupees(v.fee_charged)}</strong></span>
                <span>Paid <strong>{rupees(v.payment_received)}</strong>{v.payment_mode ? ` (${v.payment_mode})` : ''}</span>
                {Number(v.fee_charged) > Number(v.payment_received) && (
                  <span className="due-text">due {rupees(v.fee_charged - v.payment_received)}</span>
                )}
              </div>
            ) : (
              <p className="pending-note">Tap to add fee, payment and reports after the consultation</p>
            )}
            {vReports.length > 0 && (
              <div className="report-chips" onClick={(e) => e.stopPropagation()}>
                {vReports.map((r) => (
                  <button key={r.id} type="button" className="report-chip" onClick={() => viewReport(r)}>
                    <ReportIcon mime={r.mime} />
                    {r.report_name}
                  </button>
                ))}
              </div>
            )}
            {v.next_appointment && (
              <p className="next-appt">Next: {fmtDateTime(v.next_appointment)}</p>
            )}
            {v.notes && <p className="visit-notes">{v.notes}</p>}
          </article>
        )
      })}

      {looseReports.length > 0 && (
        <>
          <h3 className="section-title">Other reports</h3>
          {looseReports.map((r) => (
            <article key={r.id} className="card card-row" onClick={() => viewReport(r)}>
              <div className="report-icon" aria-hidden="true"><ReportIcon mime={r.mime} /></div>
              <div className="card-main">
                <strong className="card-name">{r.report_name}</strong>
                <span className="card-sub">{fmtDate(r.report_date)}</span>
              </div>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="chev" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
            </article>
          ))}
        </>
      )}

      {admin && (
        <div className="danger-zone">
          <button className="btn-danger-ghost" onClick={() => setModal({ type: 'deletePatient' })}>
            Delete patient…
          </button>
        </div>
      )}

      {modal?.type === 'editPatient' && (
        <PatientForm existing={p} onClose={close} onSaved={closeAndRefresh} />
      )}
      {modal?.type === 'newVisit' && (
        <VisitForm patientId={p.id} onClose={close} onSaved={closeAndRefresh} />
      )}
      {modal?.type === 'editVisit' && (
        <VisitForm
          patientId={p.id}
          existing={modal.payload}
          reports={reportsByVisit[modal.payload.id] || []}
          onReportsChanged={refresh}
          onClose={close}
          onSaved={closeAndRefresh}
        />
      )}
      {modal?.type === 'viewReport' && (
        <ReportViewer
          report={modal.payload}
          onClose={close}
          onDelete={admin ? () => setModal({ type: 'deleteReport', payload: modal.payload }) : null}
        />
      )}
      {modal?.type === 'deletePatient' && (
        <AdminConfirm
          what={`patient ${p.first_name} ${p.last_name} and their entire history`}
          onConfirm={async (code) => { await deletePatient(p.id, code); onBack() }}
          onClose={close}
        />
      )}
      {modal?.type === 'deleteReport' && (
        <AdminConfirm
          what={`report "${modal.payload.report_name}"`}
          onConfirm={async (code) => { await deleteReport(modal.payload.id, code); refresh() }}
          onClose={close}
        />
      )}
    </div>
  )
}

function ReportIcon({ mime }) {
  return mime === 'application/pdf' ? (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10" r="1.5" /><path d="M21 15l-5-4-9 8" /></svg>
  )
}

function ReportViewer({ report, onClose, onDelete }) {
  const [dataUrl, setDataUrl] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getReportDataUrl(report.id).then(setDataUrl).catch((e) => setError(e.message))
  }, [report.id])

  return (
    <Modal title={report.report_name} onClose={onClose}>
      {error && <p className="error-text">{error}</p>}
      {!dataUrl && !error && <Spinner text="Loading report…" />}
      {dataUrl && report.mime === 'application/pdf' && (
        <a className="btn-primary btn-block" href={dataUrl} download={`${report.report_name}.pdf`} style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}>
          Open PDF
        </a>
      )}
      {dataUrl && report.mime !== 'application/pdf' && (
        <img src={dataUrl} alt={report.report_name} className="report-img" />
      )}
      <p className="muted" style={{ textAlign: 'center', marginTop: 8 }}>{fmtDate(report.report_date)}</p>
      <div className="modal-actions">
        {onDelete && <button className="btn-danger-ghost" onClick={onDelete}>Delete…</button>}
        <button className="btn-ghost" onClick={onClose}>Close</button>
      </div>
    </Modal>
  )
}
