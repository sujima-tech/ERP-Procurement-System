import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'

export default function FinancePage() {
  const [payments, setPayments] = useState([])
  const [pos, setPos]           = useState([])
  const [summary, setSummary]   = useState({ totalPaid:0, paymentCount:0, pendingPayments:0 })
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ purchaseOrder:'', vendor:'', amount:'', method:'bank_transfer', referenceNumber:'', notes:'' })

  const load = async () => {
    try {
      const [pay, po, sum] = await Promise.all([api.get('/payments'), api.get('/po'), api.get('/payments/stats/summary')])
      setPayments(pay.data.data)
      setPos(po.data.data.filter(p => ['delivered'].includes(p.status)))
      setSummary(sum.data.data)
    } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const handlePOSelect = (poId) => {
    const po = pos.find(p => p._id === poId)
    setForm(f => ({
      ...f,
      purchaseOrder: poId,
      vendor: po?.items?.[0]?.vendor?._id || po?.items?.[0]?.vendor || '',
      amount: po?.totalAmount || '',
    }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      await api.post('/payments', form)
      toast.success('💰 Payment recorded! Process completed.'); setShowModal(false)
      setForm({ purchaseOrder:'', vendor:'', amount:'', method:'bank_transfer', referenceNumber:'', notes:'' })
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const methodBadge = { bank_transfer:'badge-blue', cheque:'badge-yellow', cash:'badge-gray', upi:'badge-purple', online:'badge-cyan' }

  if (loading) return <div className="loading-center"><div className="spinner"/><p>Loading finance data…</p></div>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">💰 Finance & Payments</h1>
          <p className="page-subtitle">Record payments and close procurement cycles</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Record Payment</button>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom:'1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background:'rgba(34,197,94,0.15)' }}>💰</div>
          <div className="stat-value">₹{summary.totalPaid?.toLocaleString('en-IN') || 0}</div>
          <div className="stat-label">Total Paid</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background:'rgba(99,102,241,0.15)' }}>📝</div>
          <div className="stat-value">{summary.paymentCount || 0}</div>
          <div className="stat-label">Completed Payments</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background:'rgba(245,158,11,0.15)' }}>⏳</div>
          <div className="stat-value">{summary.pendingPayments || 0}</div>
          <div className="stat-label">Pending Payments</div>
        </div>
      </div>

      {/* Process Completed Banner */}
      {summary.paymentCount > 0 && summary.pendingPayments === 0 && (
        <div style={{ background:'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(34,197,94,0.08))', border:'1px solid rgba(16,185,129,0.25)', borderRadius:'var(--radius)', padding:'1.25rem 1.5rem', marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:'1rem' }}>
          <span style={{ fontSize:'2rem' }}>🎉</span>
          <div>
            <div style={{ fontWeight:700, color:'var(--success)', fontSize:'1rem' }}>All Payments Completed!</div>
            <div style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>Full procurement cycle completed successfully — RFQ → Quote → AI → PO → Delivery → Finance ✓</div>
          </div>
        </div>
      )}

      <div className="card">
        {payments.length === 0
          ? <div className="empty-state"><div className="empty-icon">💰</div><h3>No Payments Yet</h3><p>Record a payment after delivery is confirmed</p></div>
          : <div className="table-wrapper"><table>
              <thead><tr><th>PO #</th><th>Vendor</th><th>Amount</th><th>Method</th><th>Ref #</th><th>Paid At</th><th>Status</th></tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p._id}>
                    <td className="bold">{p.purchaseOrder?.poNumber || '—'}</td>
                    <td>{p.vendor?.name}</td>
                    <td style={{ fontWeight:700, color:'var(--accent)' }}>₹{p.amount?.toLocaleString('en-IN')}</td>
                    <td><span className={`badge ${methodBadge[p.method] || 'badge-gray'}`}>{p.method?.replace(/_/g,' ')}</span></td>
                    <td style={{ fontFamily:'monospace', fontSize:'0.78rem', color:'var(--text-muted)' }}>{p.referenceNumber || '—'}</td>
                    <td>{new Date(p.paidAt).toLocaleDateString('en-IN')}</td>
                    <td><span className="badge badge-green">✓ Paid</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Record Payment</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Purchase Order *</label>
                  <select className="form-control" required value={form.purchaseOrder} onChange={e => handlePOSelect(e.target.value)}>
                    <option value="">Select delivered PO…</option>
                    {pos.map(p => <option key={p._id} value={p._id}>{p.poNumber} — ₹{p.totalAmount?.toLocaleString('en-IN')}</option>)}
                  </select>
                  {pos.length === 0 && <p style={{ fontSize:'0.78rem', color:'var(--warning)', marginTop:'0.4rem' }}>No delivered POs pending payment.</p>}
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Amount (₹) *</label><input className="form-control" type="number" required value={form.amount} onChange={e=>setForm(f=>({...f,amount:Number(e.target.value)}))} placeholder="0" /></div>
                  <div className="form-group"><label className="form-label">Payment Method</label>
                    <select className="form-control" value={form.method} onChange={e=>setForm(f=>({...f,method:e.target.value}))}>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                      <option value="upi">UPI</option>
                      <option value="online">Online</option>
                      <option value="cash">Cash</option>
                    </select>
                  </div>
                </div>
                <div className="form-group"><label className="form-label">Reference Number</label><input className="form-control" value={form.referenceNumber} onChange={e=>setForm(f=>({...f,referenceNumber:e.target.value}))} placeholder="TXN123456789" /></div>
                <div className="form-group"><label className="form-label">Notes</label><textarea className="form-control" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Payment notes…" /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">💰 Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
