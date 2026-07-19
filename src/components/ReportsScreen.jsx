import { useEffect, useState } from 'react'
import { getReportsSummary, exportAll, getReportDataUrl } from '../lib/store.js'
import {
  csvString, downloadCsv, downloadBlob,
  patientsTable, visitsTable, financialsTable, safeFileName, mimeToExt,
} from '../lib/csv.js'
import { rupees } from '../config.js'
import { Spinner } from './ui.jsx'

export default function ReportsScreen({ onOpen }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState('')
  const [exportMsg, setExportMsg] = useState('')

  useEffect(() => {
    getReportsSummary().then(setData).catch((e) => setError(e.message))
  }, [])

  const stamp = () => new Date().toISOString().slice(0, 10)

  // Data backup: three Excel-ready CSV files.
  const doExport = async () => {
    setExporting('csv')
    setExportMsg('')
    try {
      const all = await exportAll()
      const d = stamp()
      const pt = patientsTable(all.patients)
      const vt = visitsTable(all.visits)
      const ft = financialsTable(all.visits)
      downloadCsv(`patients_${d}.csv`, pt.headers, pt.rows)
      downloadCsv(`visits_${d}.csv`, vt.headers, vt.rows)
      downloadCsv(`financials_monthly_${d}.csv`, ft.headers, ft.rows)
      setExportMsg(`Backup downloaded: patients (${all.patients.length}), visits (${all.visits.length}), and monthly financials — 3 CSV files, open in Excel. Keep them somewhere safe.`)
    } catch (e) {
      setExportMsg(e.message)
    } finally {
      setExporting('')
    }
  }

  // Full backup: one zip with the CSVs plus every X-ray / report file.
  const doFullBackup = async () => {
    setExporting('zip')
    setExportMsg('')
    try {
      const { default: JSZip } = await import('jszip')
      const all = await exportAll()
      const d = stamp()
      const zip = new JSZip()
      const pt = patientsTable(all.patients)
      const vt = visitsTable(all.visits)
      const ft = financialsTable(all.visits)
      zip.file(`patients_${d}.csv`, csvString(pt.headers, pt.rows))
      zip.file(`visits_${d}.csv`, csvString(vt.headers, vt.rows))
      zip.file(`financials_monthly_${d}.csv`, csvString(ft.headers, ft.rows))

      const files = all.reports || []
      let done = 0
      for (const r of files) {
        setExportMsg(`Adding report files… ${done + 1} of ${files.length}`)
        try {
          const dataUrl = await getReportDataUrl(r.id)
          const fname = `reports/${safeFileName(r.patient_name)}_${safeFileName(r.report_name)}_${r.report_date}.${mimeToExt(r.mime)}`
          const [head, body] = dataUrl.split(',')
          if (head.includes('base64')) zip.file(fname, body, { base64: true })
          else zip.file(fname, decodeURIComponent(body))
        } catch {
          zip.file(`reports/FAILED_${safeFileName(r.report_name)}.txt`, 'Could not download this report.')
        }
        done++
      }
      const blob = await zip.generateAsync({ type: 'blob' })
      downloadBlob(`anugiri_full_backup_${d}.zip`, blob)
      setExportMsg(`Full backup downloaded: anugiri_full_backup_${d}.zip — data CSVs plus ${files.length} report file${files.length === 1 ? '' : 's'}. Keep a copy outside this phone/computer.`)
    } catch (e) {
      setExportMsg(e.message)
    } finally {
      setExporting('')
    }
  }

  if (error) return <div className="empty-state"><p className="error-text">{error}</p></div>
  if (!data) return <Spinner text="Crunching the numbers…" />

  const t = data.totals

  return (
    <div>
      <h3 className="section-title">Collections</h3>
      <div className="stats-grid stats-2">
        <div className="stat"><span className="stat-label">Today</span><span className="stat-value">{rupees(t.today)}</span></div>
        <div className="stat"><span className="stat-label">This month</span><span className="stat-value">{rupees(t.this_month)}</span></div>
        <div className="stat"><span className="stat-label">Last 6 months</span><span className="stat-value">{rupees(t.six_months)}</span></div>
        <div className="stat"><span className="stat-label">Last 12 months</span><span className="stat-value">{rupees(t.twelve_months)}</span></div>
        <div className="stat"><span className="stat-label">All time</span><span className="stat-value">{rupees(t.all_time)}</span></div>
        <div className={Number(t.outstanding) > 0 ? 'stat stat-due' : 'stat'}>
          <span className="stat-label">Outstanding</span><span className="stat-value">{rupees(t.outstanding)}</span>
        </div>
      </div>

      <h3 className="section-title">By doctor (12 months)</h3>
      <Bars rows={(data.by_doctor || []).map((r) => ({ label: r.doctor, total: r.total, sub: `${r.visits} visit${r.visits === 1 ? '' : 's'}` }))} />

      <h3 className="section-title">Monthly collections (12 months)</h3>
      <Bars rows={data.monthly.map((r) => ({ label: monthLabel(r.month), total: r.total }))} />

      <h3 className="section-title">By treatment (12 months)</h3>
      <Bars rows={data.by_category.map((r) => ({ label: r.category, total: r.total, sub: `${r.visits} visit${r.visits === 1 ? '' : 's'}` }))} />

      <h3 className="section-title">By payment mode (12 months)</h3>
      <Bars rows={data.by_mode.map((r) => ({ label: r.mode, total: r.total }))} />

      <h3 className="section-title">Top patients (12 months)</h3>
      {data.top_patients.length === 0 && <p className="muted section-empty">No payments recorded yet.</p>}
      {data.top_patients.map((p, i) => (
        <article key={p.patient_id} className="card card-row" onClick={() => onOpen(p.patient_id)}>
          <div className="rank" aria-hidden="true">{i + 1}</div>
          <div className="card-main">
            <strong className="card-name">{p.patient_name}</strong>
            <span className="card-sub">{p.visits} visit{p.visits === 1 ? '' : 's'}</span>
          </div>
          <strong>{rupees(p.total)}</strong>
        </article>
      ))}

      <h3 className="section-title">Backup (admin only)</h3>
      <div className="stack">
        <button className="btn-outline btn-block" onClick={doExport} disabled={!!exporting}>
          {exporting === 'csv' ? 'Preparing…' : 'Download data backup (Excel / CSV)'}
        </button>
        <button className="btn-outline btn-block" onClick={doFullBackup} disabled={!!exporting}>
          {exporting === 'zip' ? 'Building zip…' : 'Download FULL backup (data + X-rays, zip)'}
        </button>
      </div>
      {exportMsg && <p className="muted about-text">{exportMsg}</p>}
      <p className="muted about-text">
        Tip: take a backup every week or two and keep it on your personal computer or
        a pen drive. Even if the online database is ever lost, you'll have every
        patient, payment, and report file.
      </p>
    </div>
  )
}

function Bars({ rows }) {
  if (!rows || rows.length === 0) return <p className="muted section-empty">No payments recorded yet.</p>
  const max = Math.max(...rows.map((r) => Number(r.total)), 1)
  return (
    <div className="revenue-chart">
      {rows.map((r) => (
        <div key={r.label} className="rev-row">
          <span className="rev-month rev-month-wide" title={r.label}>
            {r.label}
            {r.sub && <em className="rev-sub">{r.sub}</em>}
          </span>
          <div className="rev-track">
            <div className="rev-bar" style={{ width: `${Math.max(4, (Number(r.total) / max) * 100)}%` }} />
          </div>
          <span className="rev-amt">{rupees(r.total)}</span>
        </div>
      ))}
    </div>
  )
}

function monthLabel(ym) {
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
}
