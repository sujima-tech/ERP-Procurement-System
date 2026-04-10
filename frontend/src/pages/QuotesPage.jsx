import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function QuotesPage() {
  const { user } = useAuth()
  const isVendor = user?.role === 'vendor'
  const [quotes, setQuotes]   = useState([])
  const [rfqs, setRfqs]       = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedRFQ, setSelectedRFQ] = useState(null)
  const [form, setForm] = useState({ rfq:'', items:[], validUntil:'', remarks:'' })

  const load = async () => {
    try {
      const [q, r, p] = await Promise.all([api.get('/quotes'), api.get('/rfqs'), api.get('/products')])
      setQuotes(q.data.data); setRfqs(r.data.data); setProducts(p.data.data)
    } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const handleRFQSelect = (rfqId) => {
    const rfq = rfqs.find(r => r._id === rfqId)
    setSelectedRFQ(rfq)
    setForm(f => ({
      ...f, rfq: rfqId,
      items: (rfq?.items || []).map(item => ({
        product: item.product?._id || item.product,
        productName: item.product?.name || '',
        quantity: item.quantity,
        unitPrice: '',
        deliveryDays: '',
        notes: '',
      }))
    }))
  }

  const updateItem = (i, field, val) =>
    setForm(f => ({ ...f, items: f.items.map((it,idx) => idx===i ? {...it,[field]:val} : it) }))

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      const payload = { ...form, items: form.items.map(({ productName, ...rest }) => rest) }
      await api.post('/quotes', payload)
      toast.success('Quote submitted successfully!'); setShowModal(false); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit quote') }
  }

  const statusColor = { submitted:'badge-blue', under_review:'badge-yellow', accepted:'badge-green', rejected:'badge-red' }

  if (loading) return <div className="loading-center"><div className="spinner"/><p>Loading quotes…</p></div>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isVendor ? 'Submit Quote' : 'Quotes'}</h1>
          <p className="page-subtitle">{isVendor ? 'Submit your pricing for assigned RFQs' : 'All vendor quotes received'}</p>
        </div>
        {isVendor && <button className="btn btn-primary" onClick={() => setShowModal(true)}>✍️ Submit Quote</button>}
      </div>

      {/* Quotes Table */}
      <div className="card">
        {quotes.length === 0
          ? <div className="empty-state"><div className="empty-icon">💬</div><h3>No Quotes Yet</h3><p>{isVendor ? 'Submit a quote for an active RFQ' : 'Waiting for vendor quotes'}</p></div>
          : <div className="table-wrapper"><table>
              <thead><tr><th>RFQ</th><th>Vendor</th><th>Items</th><th>AI Score</th><th>Valid Until</th><th>Status</th></tr></thead>
              <tbody>
                {quotes.map(q => (
                  <tr key={q._id}>
                    <td className="bold">{q.rfq?.rfqNumber || '—'}</td>
                    <td>{q.vendor?.name || '—'}</td>
                    <td>
                      {q.items?.map((item, i) => (
                        <div key={i} style={{ fontSize:'0.78rem', color:'var(--text-muted)', lineHeight:1.6 }}>
                          {item.product?.name}: <strong style={{color:'var(--text)'}}>₹{item.unitPrice?.toLocaleString('en-IN')}</strong> / {item.deliveryDays}d
                        </div>
                      ))}
                    </td>
                    <td>
                      {q.aiScore != null
                        ? <div className="score-bar">
                            <div className="score-track"><div className="score-fill" style={{ width:`${q.aiScore*100}%` }}/></div>
                            <span className="score-val">{(q.aiScore*100).toFixed(1)}%</span>
                          </div>
                        : <span style={{ color:'var(--text-dim)', fontSize:'0.78rem' }}>Pending eval</span>}
                    </td>
                    <td>{q.validUntil ? new Date(q.validUntil).toLocaleDateString('en-IN') : '—'}</td>
                    <td><span className={`badge ${statusColor[q.status] || 'badge-gray'}`}>{q.status?.replace(/_/g,' ')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>

      {/* Submit Quote Modal (vendor) */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth:650 }}>
            <div className="modal-header">
              <span className="modal-title">Submit Quote</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select RFQ *</label>
                  <select className="form-control" required value={form.rfq} onChange={e => handleRFQSelect(e.target.value)}>
                    <option value="">Choose an RFQ…</option>
                    {rfqs.filter(r => ['sent','quotes_received'].includes(r.status)).map(r =>
                      <option key={r._id} value={r._id}>{r.rfqNumber} — {r.title}</option>
                    )}
                  </select>
                </div>

                {form.items.length > 0 && (
                  <div style={{ marginBottom:'1rem' }}>
                    <label className="form-label">Quote Items</label>
                    <div style={{ background:'var(--bg-card2)', borderRadius:'var(--radius-sm)', padding:'0.75rem', display:'flex', gap:'0.5rem', justifyContent:'space-between', marginBottom:'0.5rem', fontSize:'0.72rem', color:'var(--text-dim)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                      <span style={{flex:2}}>Product</span><span style={{flex:1}}>Qty</span><span style={{flex:1}}>Unit Price (₹)</span><span style={{flex:1}}>Delivery (days)</span>
                    </div>
                    {form.items.map((item, i) => (
                      <div key={i} style={{ display:'flex', gap:'0.5rem', marginBottom:'0.5rem', alignItems:'center' }}>
                        <div style={{ flex:2, fontSize:'0.8rem', color:'var(--text)', fontWeight:500, padding:'0.6rem 0' }}>{item.productName || `Product ${i+1}`}</div>
                        <div style={{ flex:1, fontSize:'0.8rem', color:'var(--text-muted)' }}>{item.quantity}</div>
                        <input className="form-control" style={{flex:1}} type="number" min="0" required value={item.unitPrice} onChange={e => updateItem(i,'unitPrice',Number(e.target.value))} placeholder="0" />
                        <input className="form-control" style={{flex:1}} type="number" min="1" required value={item.deliveryDays} onChange={e => updateItem(i,'deliveryDays',Number(e.target.value))} placeholder="days" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group"><label className="form-label">Valid Until</label><input className="form-control" type="date" value={form.validUntil} onChange={e=>setForm(f=>({...f,validUntil:e.target.value}))} /></div>
                </div>
                <div className="form-group"><label className="form-label">Remarks</label><textarea className="form-control" value={form.remarks} onChange={e=>setForm(f=>({...f,remarks:e.target.value}))} placeholder="Any additional notes…" /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Quote</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
