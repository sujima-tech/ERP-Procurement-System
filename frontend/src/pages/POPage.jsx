import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const statusColor = { pending:'badge-gray', confirmed:'badge-blue', in_delivery:'badge-yellow', delivered:'badge-green', paid:'badge-cyan', cancelled:'badge-red' }

export default function POPage() {
  const [pos, setPos]         = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  const load = async () => {
    try { const r = await api.get('/po'); setPos(r.data.data) } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/po/${id}/status`, { status })
      toast.success('Status updated'); load()
    } catch { toast.error('Failed to update') }
  }

  if (loading) return <div className="loading-center"><div className="spinner"/><p>Loading POs…</p></div>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Orders</h1>
          <p className="page-subtitle">Track and manage all generated purchase orders</p>
        </div>
      </div>

      {pos.length === 0
        ? <div className="card"><div className="empty-state"><div className="empty-icon">📄</div><h3>No Purchase Orders</h3><p>Run AI Evaluation and generate a PO first</p></div></div>
        : <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {pos.map(po => (
              <div key={po._id} className="card" style={{ cursor:'pointer' }} onClick={() => setSelected(selected?._id===po._id ? null : po)}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem' }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.35rem' }}>
                      <span style={{ fontSize:'1rem', fontWeight:700, color:'var(--text)' }}>{po.poNumber}</span>
                      <span className={`badge ${statusColor[po.status] || 'badge-gray'}`}>{po.status?.replace(/_/g,' ')}</span>
                    </div>
                    <div style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>
                      RFQ: {po.rfq?.rfqNumber} — {po.rfq?.title}
                    </div>
                    <div style={{ fontSize:'0.78rem', color:'var(--text-dim)', marginTop:'0.2rem' }}>
                      {po.items?.length} item(s) · Expected: {po.expectedDelivery ? new Date(po.expectedDelivery).toLocaleDateString('en-IN') : '—'}
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:'1.5rem', fontWeight:800, color:'var(--accent)' }}>₹{po.totalAmount?.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize:'0.72rem', color:'var(--text-dim)' }}>Terms: {po.terms}</div>
                  </div>
                </div>

                {selected?._id === po._id && (
                  <div style={{ marginTop:'1.25rem', paddingTop:'1.25rem', borderTop:'1px solid var(--border)' }}>
                    <div className="table-wrapper">
                      <table>
                        <thead><tr><th>Product</th><th>Vendor</th><th>Qty</th><th>Unit Price</th><th>Total</th><th>Delivery</th><th>AI Score</th></tr></thead>
                        <tbody>
                          {po.items?.map((item, i) => (
                            <tr key={i}>
                              <td className="bold">{item.product?.name}</td>
                              <td>{item.vendor?.name}</td>
                              <td>{item.quantity}</td>
                              <td>₹{item.unitPrice?.toLocaleString('en-IN')}</td>
                              <td style={{ fontWeight:600, color:'var(--accent)' }}>₹{item.totalPrice?.toLocaleString('en-IN')}</td>
                              <td>{item.deliveryDays}d</td>
                              <td>
                                {item.aiScore != null && (
                                  <div className="score-bar">
                                    <div className="score-track"><div className="score-fill" style={{width:`${item.aiScore*100}%`}}/></div>
                                    <span className="score-val">{(item.aiScore*100).toFixed(1)}%</span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ display:'flex', gap:'0.5rem', marginTop:'1rem', flexWrap:'wrap' }}>
                      {['confirmed','in_delivery','delivered','paid'].map(s => (
                        po.status !== s &&
                        <button key={s} className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); updateStatus(po._id, s) }}>
                          Mark as {s.replace(/_/g,' ')}
                        </button>
                      ))}
                      {po.status !== 'cancelled' &&
                        <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); updateStatus(po._id,'cancelled') }}>Cancel PO</button>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
      }
    </div>
  )
}
