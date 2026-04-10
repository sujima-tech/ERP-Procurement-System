import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const statusColor = { draft:'badge-gray', sent:'badge-blue', quotes_received:'badge-yellow', evaluated:'badge-purple', po_generated:'badge-green', closed:'badge-cyan' }

export default function RFQPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [rfqs, setRfqs]       = useState([])
  const [products, setProducts] = useState([])
  const [vendors, setVendors]  = useState([])
  const [loading, setLoading]  = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch]   = useState('')
  const [form, setForm] = useState({
    title:'', description:'', deadline:'', notes:'',
    items: [{ product:'', quantity:1, unit:'pcs', specifications:'' }],
    vendors: [],
  })

  const load = async () => {
    try {
      const [r, p, v] = await Promise.all([api.get('/rfqs'), api.get('/products'), api.get('/vendors')])
      setRfqs(r.data.data); setProducts(p.data.data); setVendors(v.data.data)
    } catch { toast.error('Failed to load data') }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { product:'', quantity:1, unit:'pcs', specifications:'' }] }))
  const removeItem = i => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))
  const updateItem = (i, field, val) => setForm(f => ({ ...f, items: f.items.map((it, idx) => idx===i ? {...it, [field]:val} : it) }))

  const toggleVendor = id => setForm(f => ({
    ...f, vendors: f.vendors.includes(id) ? f.vendors.filter(v => v!==id) : [...f.vendors, id]
  }))

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      await api.post('/rfqs', form)
      toast.success('RFQ created & sent to vendors!')
      setShowModal(false)
      setForm({ title:'', description:'', deadline:'', notes:'', items:[{ product:'', quantity:1, unit:'pcs', specifications:'' }], vendors:[] })
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create RFQ') }
  }

  const sendRFQ = async (id) => {
    try {
      await api.put(`/rfqs/${id}`, { status:'sent' })
      toast.success('RFQ sent to vendors!'); load()
    } catch { toast.error('Failed to update RFQ') }
  }

  const filtered = rfqs.filter(r =>
    r.title?.toLowerCase().includes(search.toLowerCase()) ||
    r.rfqNumber?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="loading-center"><div className="spinner"/><p>Loading RFQs…</p></div>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">RFQ Management</h1>
          <p className="page-subtitle">{isAdmin ? 'Create and manage Request for Quotations' : 'RFQs assigned to your vendor account'}</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Create RFQ</button>}
      </div>

      <div className="filter-bar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Search RFQs…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card">
        {filtered.length === 0
          ? <div className="empty-state"><div className="empty-icon">📋</div><h3>No RFQs Found</h3><p>Create your first RFQ to begin procurement</p></div>
          : <div className="table-wrapper"><table>
              <thead><tr><th>RFQ #</th><th>Title</th><th>Products</th><th>Vendors</th><th>Deadline</th><th>Status</th>{isAdmin && <th>Actions</th>}</tr></thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r._id}>
                    <td className="bold">{r.rfqNumber}</td>
                    <td>{r.title}</td>
                    <td>{r.items?.length} items</td>
                    <td>{r.vendors?.length} vendors</td>
                    <td>{r.deadline ? new Date(r.deadline).toLocaleDateString('en-IN') : '—'}</td>
                    <td><span className={`badge ${statusColor[r.status] || 'badge-gray'}`}>{r.status?.replace(/_/g,' ')}</span></td>
                    {isAdmin && <td>
                      {r.status === 'draft' && <button className="btn btn-secondary btn-sm" onClick={() => sendRFQ(r._id)}>Send →</button>}
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>

      {/* Create RFQ Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth:700 }}>
            <div className="modal-header">
              <span className="modal-title">Create New RFQ</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">RFQ Title *</label>
                    <input className="form-control" required value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Q2 Office Equipment" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Deadline *</label>
                    <input className="form-control" type="date" required value={form.deadline} onChange={e => setForm(f=>({...f,deadline:e.target.value}))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} placeholder="Describe requirements…" />
                </div>

                {/* Products */}
                <div style={{ marginBottom:'1rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
                    <label className="form-label" style={{ margin:0 }}>Products *</label>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>+ Add Product</button>
                  </div>
                  {form.items.map((item, i) => (
                    <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr auto', gap:'0.5rem', marginBottom:'0.5rem' }}>
                      <select className="form-control" required value={item.product} onChange={e => updateItem(i,'product',e.target.value)}>
                        <option value="">Select product…</option>
                        {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
                      </select>
                      <input className="form-control" type="number" min="1" value={item.quantity} onChange={e => updateItem(i,'quantity',Number(e.target.value))} placeholder="Qty" />
                      <input className="form-control" value={item.specifications} onChange={e => updateItem(i,'specifications',e.target.value)} placeholder="Specs" />
                      {form.items.length > 1 && <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(i)}>✕</button>}
                    </div>
                  ))}
                </div>

                {/* Vendors */}
                <div className="form-group">
                  <label className="form-label">Select Vendors *</label>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'0.5rem' }}>
                    {vendors.map(v => (
                      <label key={v._id} style={{
                        display:'flex', alignItems:'center', gap:'0.5rem',
                        padding:'0.6rem 0.75rem', borderRadius:'var(--radius-sm)',
                        border:`1px solid ${form.vendors.includes(v._id) ? 'var(--primary)' : 'var(--border)'}`,
                        background: form.vendors.includes(v._id) ? 'rgba(99,102,241,0.1)' : 'var(--bg-input)',
                        cursor:'pointer', fontSize:'0.8rem', transition:'all 0.2s'
                      }}>
                        <input type="checkbox" checked={form.vendors.includes(v._id)} onChange={() => toggleVendor(v._id)} style={{ accentColor:'var(--primary)' }} />
                        <div>
                          <div style={{ color:'var(--text)', fontWeight:500 }}>{v.name}</div>
                          <div style={{ color:'var(--text-dim)', fontSize:'0.7rem' }}>⭐ {v.rating}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create RFQ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
