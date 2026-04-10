import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const flow = [
  'Login (Role-based)',
  'Create RFQ → Select Vendors',
  'Vendors Submit Quotes',
  'AI Compares & Scores',
  'Generate Purchase Orders',
  'Delivery & Inventory Update',
  'Finance Payment → Done ✓',
]

export default function Login() {
  const [form, setForm]       = useState({ email: 'admin@erp.com', password: 'admin123' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.name}!`)
      navigate(user.role === 'admin' ? '/dashboard' : '/vendor-dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Left Panel */}
      <div className="login-left">
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'2.5rem' }}>
          <div className="logo-icon" style={{ width:48, height:48, background:'linear-gradient(135deg,#6366f1,#0ea5e9)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', fontWeight:800, color:'white' }}>M</div>
          <div>
            <div style={{ fontSize:'1.3rem', fontWeight:700 }}>MoiiDev ERP</div>
            <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>AI-Powered Procurement System</div>
          </div>
        </div>

        <h1 className="login-heading">
          Smarter<br /><span>Procurement.</span><br />Faster Decisions.
        </h1>
        <p style={{ color:'var(--text-muted)', fontSize:'0.9rem', marginTop:'1rem', lineHeight:1.6 }}>
          End-to-end ERP system with AI-driven vendor selection, automated RFQs, and real-time procurement analytics.
        </p>

        <div className="login-flow">
          <div style={{ fontSize:'0.72rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-dim)', marginBottom:'0.75rem' }}>Procurement Flow</div>
          {flow.map((step, i) => (
            <div key={i} className="login-flow-item">
              <div className="login-flow-dot" style={{ background: i === 0 ? 'var(--primary)' : i === 3 ? 'var(--accent)' : 'var(--border-light)' }} />
              {step}
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="login-right">
        <div className="login-box">
          <h2 style={{ fontSize:'1.6rem', fontWeight:700, marginBottom:0.25+'rem' }}>Sign In</h2>
          <p style={{ color:'var(--text-muted)', fontSize:'0.875rem', marginBottom:'2rem' }}>Access your ERP portal</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-control" type="email" required
                value={form.email}
                placeholder="admin@erp.com"
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-control" type="password" required
                value={form.password}
                placeholder="••••••••"
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width:'100%', marginTop:'0.5rem', justifyContent:'center' }}>
              {loading ? <><span className="spinner" />Signing in…</> : '→  Sign In'}
            </button>
          </form>

          <div style={{ marginTop:'2rem', padding:'1rem', background:'var(--bg-card2)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)' }}>
            <div style={{ fontSize:'0.72rem', fontWeight:600, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.6rem' }}>Demo Credentials</div>
            <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', lineHeight:1.8 }}>
              <div>🔑 <strong style={{color:'var(--text)'}}>Admin:</strong> admin@erp.com / admin123</div>
              <div>🏢 <strong style={{color:'var(--text)'}}>Vendor:</strong> vendor1@techsupply.com / vendor123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
