import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'

export default function AIReviewPage() {
  const [rfqs, setRfqs]       = useState([])
  const [selected, setSelected] = useState('')
  const [results, setResults]  = useState(null)
  const [loading, setLoading]  = useState(false)
  const [loadingRFQs, setLoadingRFQs] = useState(true)
  const [genPO, setGenPO]      = useState(false)

  useEffect(() => {
    api.get('/rfqs').then(r => {
      setRfqs(r.data.data.filter(r => ['quotes_received','evaluated'].includes(r.status)))
      setLoadingRFQs(false)
    })
  }, [])

  const evaluate = async () => {
    if (!selected) return toast.error('Select an RFQ')
    setLoading(true); setResults(null)
    try {
      const r = await api.get(`/ai/evaluate/${selected}`)
      setResults(r.data)
      toast.success(`AI evaluated ${r.data.totalProducts} products across ${r.data.totalQuotes} quotes`)
    } catch (err) { toast.error(err.response?.data?.message || 'Evaluation failed') }
    setLoading(false)
  }

  const generatePO = async () => {
    if (!results) return
    setGenPO(true)
    try {
      const items = results.results.map(r => ({
        product: r.productId,
        vendor: r.bestVendorId,
        quantity: r.allBids[0]?.quantity || 1,
        unitPrice: r.bestUnitPrice,
        deliveryDays: r.bestDeliveryDays,
        aiScore: r.bestScore,
      }))
      const expectedDelivery = new Date(Date.now() + 14*24*60*60*1000).toISOString()
      await api.post('/po', { rfqId: selected, items, expectedDelivery, terms:'Net 30' })
      toast.success('🎉 Purchase Order generated successfully!')
      setResults(null); setSelected('')
    } catch (err) { toast.error(err.response?.data?.message || 'PO generation failed') }
    setGenPO(false)
  }

  const scoreColor = s => s >= 0.8 ? '#22c55e' : s >= 0.6 ? '#f59e0b' : '#ef4444'

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🧠 AI Evaluation Engine</h1>
          <p className="page-subtitle">Compare vendor quotes using AI scoring — Price (50%) · Delivery (30%) · Rating (20%)</p>
        </div>
      </div>

      {/* Algorithm Info */}
      <div className="card" style={{ marginBottom:'1.5rem', background:'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(14,165,233,0.05))', borderColor:'rgba(99,102,241,0.2)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1.25rem' }}>
          {[
            { label:'Price Weight', val:'50%', icon:'💰', desc:'min_price / vendor_price', color:'#6366f1' },
            { label:'Delivery Weight', val:'30%', icon:'🚚', desc:'min_delivery / vendor_delivery', color:'#0ea5e9' },
            { label:'Rating Weight', val:'20%', icon:'⭐', desc:'vendor_rating / max_rating', color:'#f59e0b' },
          ].map(w => (
            <div key={w.label} style={{ textAlign:'center', padding:'1rem' }}>
              <div style={{ fontSize:'1.5rem', marginBottom:'0.5rem' }}>{w.icon}</div>
              <div style={{ fontSize:'1.75rem', fontWeight:800, color:w.color }}>{w.val}</div>
              <div style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--text)', marginBottom:'0.25rem' }}>{w.label}</div>
              <div style={{ fontSize:'0.72rem', color:'var(--text-dim)', fontFamily:'monospace' }}>{w.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RFQ Selector */}
      <div className="card" style={{ marginBottom:'1.5rem' }}>
        <div style={{ display:'flex', gap:'1rem', alignItems:'flex-end', flexWrap:'wrap' }}>
          <div className="form-group" style={{ flex:1, margin:0, minWidth:250 }}>
            <label className="form-label">Select RFQ to Evaluate</label>
            <select className="form-control" value={selected} onChange={e => setSelected(e.target.value)}>
              <option value="">Choose an RFQ…</option>
              {rfqs.map(r => <option key={r._id} value={r._id}>{r.rfqNumber} — {r.title}</option>)}
            </select>
          </div>
          <button className="btn btn-primary btn-lg" onClick={evaluate} disabled={loading || !selected}>
            {loading ? <><span className="spinner"/>Evaluating…</> : '🧠 Run AI Evaluation'}
          </button>
        </div>
        {loadingRFQs && <p style={{ color:'var(--text-muted)', fontSize:'0.8rem', marginTop:'0.75rem' }}>Loading RFQs…</p>}
        {!loadingRFQs && rfqs.length === 0 && <p style={{ color:'var(--text-muted)', fontSize:'0.8rem', marginTop:'0.75rem' }}>No RFQs with quotes available. Vendors must submit quotes first.</p>}
      </div>

      {/* AI Results */}
      {results && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <div>
              <h2 style={{ fontSize:'1.1rem', fontWeight:600, color:'var(--text)' }}>Evaluation Results</h2>
              <p style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{results.totalProducts} products · {results.totalQuotes} quotes analysed</p>
            </div>
            <button className="btn btn-success" onClick={generatePO} disabled={genPO}>
              {genPO ? <><span className="spinner"/>Generating…</> : '📄 Generate Purchase Order'}
            </button>
          </div>

          {results.results.map(product => (
            <div key={product.productId} className="card" style={{ marginBottom:'1rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                <div>
                  <h3 style={{ fontSize:'1rem', fontWeight:600, color:'var(--text)' }}>{product.productName}</h3>
                  <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginTop:'0.2rem' }}>
                    Best vendor: <strong style={{ color:'var(--accent)' }}>{product.bestVendorName}</strong> —
                    ₹{product.bestUnitPrice?.toLocaleString('en-IN')} / {product.bestDeliveryDays} days / ⭐{product.bestRating}
                  </p>
                </div>
                <span className="badge badge-green">🏆 Winner: {product.bestVendorName}</span>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Vendor</th>
                      <th>Unit Price</th>
                      <th>Delivery</th>
                      <th>Rating</th>
                      <th>Price Score</th>
                      <th>Delivery Score</th>
                      <th>Rating Score</th>
                      <th>Total Score</th>
                      <th>Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.allBids.map((bid, i) => (
                      <tr key={bid.vendorId} style={{ background: i===0 ? 'rgba(16,185,129,0.06)' : 'transparent' }}>
                        <td className="bold" style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                          {i===0 && <span style={{ color:'var(--accent)', fontSize:'0.9rem' }}>🏆</span>}
                          {bid.vendorName}
                        </td>
                        <td>₹{bid.unitPrice?.toLocaleString('en-IN')}</td>
                        <td>{bid.deliveryDays} days</td>
                        <td>⭐ {bid.rating}</td>
                        <td style={{ fontFamily:'monospace', fontSize:'0.78rem', color:'var(--primary-light)' }}>{(bid.breakdown.normalizedPrice*100).toFixed(1)}%</td>
                        <td style={{ fontFamily:'monospace', fontSize:'0.78rem', color:'var(--secondary)' }}>{(bid.breakdown.normalizedDelivery*100).toFixed(1)}%</td>
                        <td style={{ fontFamily:'monospace', fontSize:'0.78rem', color:'var(--warning)' }}>{(bid.breakdown.normalizedRating*100).toFixed(1)}%</td>
                        <td>
                          <div className="score-bar">
                            <div className="score-track"><div className="score-fill" style={{ width:`${bid.score*100}%`, background:`linear-gradient(90deg, ${scoreColor(bid.score)}, ${scoreColor(bid.score)}88)` }}/></div>
                            <span className="score-val" style={{ color:scoreColor(bid.score) }}>{(bid.score*100).toFixed(1)}%</span>
                          </div>
                        </td>
                        <td><span className={`badge ${i===0?'badge-green':i===1?'badge-yellow':'badge-gray'}`}>#{i+1}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
