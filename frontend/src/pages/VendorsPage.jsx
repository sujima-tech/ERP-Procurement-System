import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'

export default function VendorsPage() {
  const [vendors, setVendors]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch]     = useState('')
  const [form, setForm] = useState({ name:'', email:'', phone:'', address:'', category:'', rating:3, contactPerson:'' })

  const load = async () => {
    try { const r = await api.get('/vendors'); setVendors(r.data.data) } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      await api.post('/vendors', form)
      toast.success('Vendor added!'); setShowModal(false)
      setForm({ name:'', email:'', phone:'', address:'', category:'', rating:3, contactPerson:'' })
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const filtered = vendors.filter(v =>
    v.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.email?.toLowerCase().includes(search.toLowerCase()) ||
    v.category?.toLowerCase().includes(search.toLowerCase())
  )

  const stars = n => '⭐'.repeat(Math.round(n || 0))

  if (loading) return <div className="loading-center"><div className="spinner"/><p>Loading…</p></div>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendors</h1>
          <p className="page-subtitle">Manage your supplier network</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Vendor</button>
      </div>

      <div className="filter-bar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Search vendors…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'1rem' }}>
        {filtered.map(v => (
          <div key={v._id} className="card" style={{ cursor:'default' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>
              <div>
                <div style={{ fontWeight:600, color:'var(--text)', fontSize:'1rem' }}>{v.name}</div>
                <div style={{ fontSize:'0.75rem', color:'var(--text-dim)', marginTop:'0.2rem' }}>{v.category}</div>
              </div>
              <span className="badge badge-blue">{stars(v.rating)} {v.rating}</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem', fontSize:'0.8rem', color:'var(--text-muted)' }}>
              <div>📧 {v.email}</div>
              {v.phone && <div>📞 {v.phone}</div>}
              {v.address && <div>📍 {v.address}</div>}
              {v.contactPerson && <div>👤 {v.contactPerson}</div>}
            </div>
            <div style={{ marginTop:'1rem', paddingTop:'0.75rem', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', fontSize:'0.78rem', color:'var(--text-muted)' }}>
              <span>📦 {v.totalOrders} orders</span>
              <span className={`badge ${v.isActive ? 'badge-green' : 'badge-red'}`}>{v.isActive ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="empty-state" style={{gridColumn:'1/-1'}}><div className="empty-icon">🏢</div><h3>No Vendors Found</h3><p>Add your first vendor to get started</p></div>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Add New Vendor</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Company Name *</label><input className="form-control" required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="TechSupply Co." /></div>
                  <div className="form-group"><label className="form-label">Email *</label><input className="form-control" type="email" required value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="vendor@company.com" /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Phone</label><input className="form-control" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="9876543210" /></div>
                  <div className="form-group"><label className="form-label">Contact Person</label><input className="form-control" value={form.contactPerson} onChange={e=>setForm(f=>({...f,contactPerson:e.target.value}))} placeholder="John Doe" /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Category</label><input className="form-control" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} placeholder="Electronics / Furniture" /></div>
                  <div className="form-group"><label className="form-label">Rating (1–5)</label><input className="form-control" type="number" min="1" max="5" step="0.1" value={form.rating} onChange={e=>setForm(f=>({...f,rating:Number(e.target.value)}))} /></div>
                </div>
                <div className="form-group"><label className="form-label">Address</label><input className="form-control" value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} placeholder="City, State" /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
