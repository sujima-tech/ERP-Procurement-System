import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState([])
  const [pos, setPos]               = useState([])
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [form, setForm] = useState({ purchaseOrder:'', vendor:'', items:[], warehouseLocation:'', notes:'' })
  const [selectedPO, setSelectedPO] = useState(null)

  const load = async () => {
    try {
      const [d, p] = await Promise.all([api.get('/delivery'), api.get('/po')])
      setDeliveries(d.data.data)
      setPos(p.data.data.filter(p => ['confirmed','in_delivery'].includes(p.status)))
    } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const handlePOSelect = (poId) => {
    const po = pos.find(p => p._id === poId)
    setSelectedPO(po)
    setForm(f => ({
      ...f, purchaseOrder: poId,
      vendor: po?.items?.[0]?.vendor?._id || po?.items?.[0]?.vendor || '',
      items: (po?.items || []).map(item => ({
        product: item.product?._id || item.product,
        productName: item.product?.name || '',
        orderedQty: item.quantity,
        receivedQty: item.quantity,
        condition: 'good',
      }))
    }))
  }

  const updateItem = (i, field, val) =>
    setForm(f => ({ ...f, items: f.items.map((it,idx) => idx===i ? {...it,[field]:val} : it) }))

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      const payload = { ...form, items: form.items.map(({ productName, ...r }) => r) }
      await api.post('/delivery', payload)
      toast.success('✅ Delivery recorded & inventory updated!'); setShowModal(false); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const conditionBadge = c => ({ good:'badge-green', partial:'badge-yellow', damaged:'badge-red' }[c] || 'badge-gray')

  if (loading) return <div className="loading-center"><div className="spinner"/><p>Loading deliveries…</p></div>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🚚 Delivery & Inventory</h1>
          <p className="page-subtitle">Record deliveries and auto-update inventory stock levels</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Record Delivery</button>
      </div>

      <div className="card">
        {deliveries.length === 0
          ? <div className="empty-state"><div className="empty-icon">🚚</div><h3>No Deliveries Yet</h3><p>Record a delivery once a PO is confirmed</p></div>
          : <div className="table-wrapper"><table>
              <thead><tr><th>PO #</th><th>Vendor</th><th>Items</th><th>Delivered At</th><th>Warehouse</th><th>Inventory</th><th>Status</th></tr></thead>
              <tbody>
                {deliveries.map(d => (
                  <tr key={d._id}>
                    <td className="bold">{d.purchaseOrder?.poNumber || '—'}</td>
                    <td>{d.vendor?.name}</td>
                    <td>
                      {d.items?.map((item, i) => (
                        <div key={i} style={{ fontSize:'0.78rem', lineHeight:1.6 }}>
                          {item.product?.name}: <span style={{color:'var(--accent)'}}>+{item.receivedQty}</span>
                          <span className={`badge ${conditionBadge(item.condition)}`} style={{marginLeft:'0.35rem'}}>{item.condition}</span>
                        </div>
                      ))}
                    </td>
                    <td>{new Date(d.deliveredAt).toLocaleDateString('en-IN')}</td>
                    <td>{d.warehouseLocation || '—'}</td>
                    <td><span className={`badge ${d.inventoryUpdated ? 'badge-green' : 'badge-yellow'}`}>{d.inventoryUpdated ? '✓ Updated' : 'Pending'}</span></td>
                    <td><span className="badge badge-green">{d.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth:650 }}>
            <div className="modal-header">
              <span className="modal-title">Record Delivery</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Purchase Order *</label>
                  <select className="form-control" required value={form.purchaseOrder} onChange={e => handlePOSelect(e.target.value)}>
                    <option value="">Choose PO…</option>
                    {pos.map(p => <option key={p._id} value={p._id}>{p.poNumber}</option>)}
                  </select>
                  {pos.length === 0 && <p style={{ fontSize:'0.78rem', color:'var(--warning)', marginTop:'0.4rem' }}>No POs ready for delivery. Confirm a PO first.</p>}
                </div>

                {form.items.length > 0 && (
                  <div style={{ marginBottom:'1rem' }}>
                    <label className="form-label">Received Items</label>
                    {form.items.map((item, i) => (
                      <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:'0.5rem', marginBottom:'0.5rem', alignItems:'center' }}>
                        <div style={{ fontSize:'0.8rem', color:'var(--text)', fontWeight:500 }}>{item.productName}</div>
                        <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>Ordered: {item.orderedQty}</div>
                        <input className="form-control" type="number" min="0" value={item.receivedQty} onChange={e => updateItem(i,'receivedQty',Number(e.target.value))} placeholder="Received" />
                        <select className="form-control" value={item.condition} onChange={e => updateItem(i,'condition',e.target.value)}>
                          <option value="good">Good</option>
                          <option value="partial">Partial</option>
                          <option value="damaged">Damaged</option>
                        </select>
                      </div>
                    ))}
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group"><label className="form-label">Warehouse Location</label><input className="form-control" value={form.warehouseLocation} onChange={e=>setForm(f=>({...f,warehouseLocation:e.target.value}))} placeholder="Warehouse A, Rack 5" /></div>
                </div>
                <div className="form-group"><label className="form-label">Notes</label><textarea className="form-control" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Delivery notes…" /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Record & Update Inventory</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
