import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch]     = useState('')
  const [form, setForm] = useState({ name:'', sku:'', category:'', unit:'pcs', description:'', currentStock:0, reorderLevel:10 })

  const load = async () => {
    try { const r = await api.get('/products'); setProducts(r.data.data) } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      await api.post('/products', form)
      toast.success('Product added!'); setShowModal(false)
      setForm({ name:'', sku:'', category:'', unit:'pcs', description:'', currentStock:0, reorderLevel:10 })
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="loading-center"><div className="spinner"/><p>Loading…</p></div>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Product catalog & inventory levels</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Product</button>
      </div>

      <div className="filter-bar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>SKU</th><th>Name</th><th>Category</th><th>Unit</th><th>Stock</th><th>Reorder At</th><th>Status</th></tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p._id}>
                  <td><span style={{ fontFamily:'monospace', fontSize:'0.8rem', color:'var(--primary-light)' }}>{p.sku}</span></td>
                  <td className="bold">{p.name}</td>
                  <td>{p.category}</td>
                  <td>{p.unit}</td>
                  <td style={{ fontWeight:600, color: p.currentStock <= p.reorderLevel ? 'var(--warning)' : 'var(--success)' }}>{p.currentStock}</td>
                  <td style={{ color:'var(--text-muted)' }}>{p.reorderLevel}</td>
                  <td><span className={`badge ${p.currentStock <= p.reorderLevel ? 'badge-yellow' : 'badge-green'}`}>{p.currentStock <= p.reorderLevel ? '⚠ Low Stock' : '✓ OK'}</span></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>No products found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Add New Product</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Product Name *</label><input className="form-control" required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Dell Laptop XPS 15" /></div>
                  <div className="form-group"><label className="form-label">SKU *</label><input className="form-control" required value={form.sku} onChange={e=>setForm(f=>({...f,sku:e.target.value}))} placeholder="LAP-001" /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Category *</label><input className="form-control" required value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} placeholder="Electronics" /></div>
                  <div className="form-group"><label className="form-label">Unit</label>
                    <select className="form-control" value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))}>
                      {['pcs','ream','box','kg','ltr','set'].map(u=><option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Current Stock</label><input className="form-control" type="number" min="0" value={form.currentStock} onChange={e=>setForm(f=>({...f,currentStock:Number(e.target.value)}))} /></div>
                  <div className="form-group"><label className="form-label">Reorder Level</label><input className="form-control" type="number" min="0" value={form.reorderLevel} onChange={e=>setForm(f=>({...f,reorderLevel:Number(e.target.value)}))} /></div>
                </div>
                <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Product details…" /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
