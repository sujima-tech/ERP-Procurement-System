import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function VendorDashboard() {
  const { user } = useAuth()
  const [rfqs, setRfqs]     = useState([])
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [r, q] = await Promise.all([api.get('/rfqs'), api.get('/quotes')])
        setRfqs(r.data.data); setQuotes(q.data.data)
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const pendingRFQs  = rfqs.filter(r => ['sent','quotes_received'].includes(r.status))
  const myQuotes     = quotes.filter(q => q.status !== 'rejected')
  const acceptedPOs  = quotes.filter(q => q.status === 'accepted')

  if (loading) return <div className="loading-center"><div className="spinner"/><p>Loading…</p></div>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendor Dashboard</h1>
          <p className="page-subtitle">Welcome back, <strong style={{ color:'var(--primary-light)' }}>{user?.name}</strong></p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom:'2rem' }}>
        {[
          { icon:'📋', label:'Open RFQs',      value: pendingRFQs.length, color:'#6366f1' },
          { icon:'💬', label:'Quotes Submitted',value: myQuotes.length,   color:'#0ea5e9' },
          { icon:'✅', label:'Orders Won',       value: acceptedPOs.length,color:'#10b981' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background:s.color+'22' }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Open RFQs */}
      <div className="card" style={{ marginBottom:'1.5rem' }}>
        <div className="card-header">
          <span className="card-title">Open RFQs — Action Required</span>
          <span className="badge badge-yellow">{pendingRFQs.length} pending</span>
        </div>
        {pendingRFQs.length === 0
          ? <div className="empty-state" style={{ padding:'2rem' }}><div className="empty-icon">📋</div><h3>No Open RFQs</h3><p>You'll be notified when new RFQs are assigned</p></div>
          : <div className="table-wrapper"><table>
              <thead><tr><th>RFQ #</th><th>Title</th><th>Products</th><th>Deadline</th><th>Status</th></tr></thead>
              <tbody>
                {pendingRFQs.map(r => (
                  <tr key={r._id}>
                    <td className="bold">{r.rfqNumber}</td>
                    <td>{r.title}</td>
                    <td>
                      {r.items?.map((item, i) => (
                        <div key={i} style={{ fontSize:'0.78rem', color:'var(--text-muted)', lineHeight:1.6 }}>
                          • {item.product?.name} × {item.quantity}
                        </div>
                      ))}
                    </td>
                    <td style={{ color: new Date(r.deadline) < new Date() ? 'var(--danger)' : 'var(--text-muted)' }}>
                      {r.deadline ? new Date(r.deadline).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td><span className="badge badge-yellow">{r.status?.replace(/_/g,' ')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>

      {/* My Quotes */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">My Submitted Quotes</span>
        </div>
        {myQuotes.length === 0
          ? <div className="empty-state" style={{ padding:'2rem' }}><div className="empty-icon">💬</div><h3>No Quotes Yet</h3><p>Go to Submit Quote to respond to an RFQ</p></div>
          : <div className="table-wrapper"><table>
              <thead><tr><th>RFQ</th><th>Items</th><th>AI Score</th><th>Status</th></tr></thead>
              <tbody>
                {myQuotes.map(q => (
                  <tr key={q._id}>
                    <td className="bold">{q.rfq?.rfqNumber}</td>
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
                            <div className="score-track"><div className="score-fill" style={{width:`${q.aiScore*100}%`}}/></div>
                            <span className="score-val">{(q.aiScore*100).toFixed(1)}%</span>
                          </div>
                        : <span style={{ fontSize:'0.78rem', color:'var(--text-dim)' }}>Awaiting eval</span>}
                    </td>
                    <td><span className={`badge ${q.status==='accepted'?'badge-green':q.status==='rejected'?'badge-red':'badge-blue'}`}>{q.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  )
}
