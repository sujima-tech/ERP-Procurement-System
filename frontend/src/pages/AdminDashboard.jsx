import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'



export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ rfqs:0, vendors:0, quotes:0, pos:0, products:0, payments:0 })
  const [rfqs,  setRfqs]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [r, v, q, po, p, pay] = await Promise.all([
          api.get('/rfqs'), api.get('/vendors'), api.get('/quotes'),
          api.get('/po'),   api.get('/products'), api.get('/payments'),
        ])
        setStats({
          rfqs: r.data.data.length, vendors: v.data.data.length,
          quotes: q.data.data.length, pos: po.data.data.length,
          products: p.data.data.length, payments: pay.data.data.length,
        })
        setRfqs(r.data.data.slice(0,5))
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const statCards = [
    { icon:'📋', label:'Active RFQs',       value: stats.rfqs,    color:'#6366f1', to:'/rfq' },
    { icon:'🏢', label:'Registered Vendors', value: stats.vendors,  color:'#0ea5e9', to:'/vendors' },
    { icon:'💬', label:'Quotes Received',    value: stats.quotes,  color:'#f59e0b', to:'/quotes' },
    { icon:'📄', label:'Purchase Orders',    value: stats.pos,     color:'#10b981', to:'/po' },
    { icon:'📦', label:'Products',           value: stats.products,color:'#a855f7', to:'/products' },
    { icon:'💰', label:'Payments Made',      value: stats.payments,color:'#22c55e', to:'/finance' },
  ]

  const chartData = [
    { name:'RFQs',    value: stats.rfqs    },
    { name:'Vendors', value: stats.vendors },
    { name:'Quotes',  value: stats.quotes  },
    { name:'POs',     value: stats.pos     },
  ]
  const COLORS = ['#6366f1','#0ea5e9','#f59e0b','#10b981']

  const statusBadge = s => {
    const map = { draft:'badge-gray', sent:'badge-blue', quotes_received:'badge-yellow', evaluated:'badge-purple', po_generated:'badge-green', closed:'badge-cyan' }
    return map[s] || 'badge-gray'
  }

  if (loading) return <div className="loading-center"><div className="spinner"/><p>Loading dashboard…</p></div>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Overview of your procurement pipeline</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/rfq')}>+ New RFQ</button>
      </div>



      {/* Stat Cards */}
      <div className="stats-grid">
        {statCards.map(c => (
          <div key={c.label} className="stat-card" style={{ cursor:'pointer' }} onClick={() => navigate(c.to)}>
            <div className="stat-icon" style={{ background: c.color+'22' }}>
              <span style={{ fontSize:'1.25rem' }}>{c.icon}</span>
            </div>
            <div className="stat-value">{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Chart + Recent RFQs */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:'1.5rem' }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Activity Overview</span></div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barCategoryGap="30%">
              <XAxis dataKey="name" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background:'#ffffff', border:'1px solid #e2e8f0', borderRadius:8, color:'#0f172a' }} />
              <Bar dataKey="value" radius={[6,6,0,0]}>
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent RFQs</span>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/rfq')}>View All</button>
          </div>
          {rfqs.length === 0
            ? <div className="empty-state"><div className="empty-icon">📋</div><h3>No RFQs yet</h3><p>Create your first RFQ to get started</p></div>
            : <div className="table-wrapper"><table>
                <thead><tr><th>RFQ #</th><th>Title</th><th>Items</th><th>Status</th></tr></thead>
                <tbody>
                  {rfqs.map(r => (
                    <tr key={r._id} style={{ cursor:'pointer' }} onClick={() => navigate('/rfq')}>
                      <td className="bold">{r.rfqNumber}</td>
                      <td>{r.title}</td>
                      <td>{r.items?.length || 0} products</td>
                      <td><span className={`badge ${statusBadge(r.status)}`}>{r.status?.replace(/_/g,' ')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>
    </div>
  )
}
