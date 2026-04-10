import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const adminNav = [
  { section: 'Overview', items: [
    { to: '/dashboard', icon: '▦', label: 'Dashboard' },
  ]},
  { section: 'Procurement', items: [
    { to: '/rfq',      icon: '📋', label: 'RFQ Management' },
    { to: '/vendors',  icon: '🏢', label: 'Vendors' },
    { to: '/products', icon: '📦', label: 'Products' },
    { to: '/quotes',   icon: '💬', label: 'Quotes' },
  ]},
  { section: 'AI & Orders', items: [
    { to: '/ai-review', icon: '🧠', label: 'AI Evaluation' },
    { to: '/po',        icon: '📄', label: 'Purchase Orders' },
  ]},
  { section: 'Operations', items: [
    { to: '/delivery', icon: '🚚', label: 'Delivery' },
    { to: '/finance',  icon: '💰', label: 'Finance / Payments' },
  ]},
]

const vendorNav = [
  { section: 'My Portal', items: [
    { to: '/vendor-dashboard', icon: '▦', label: 'Dashboard' },
    { to: '/my-rfqs',          icon: '📋', label: 'My RFQs' },
    { to: '/submit-quote',     icon: '✍️', label: 'Submit Quote' },
    { to: '/my-quotes',        icon: '💬', label: 'My Quotes' },
  ]},
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const nav = user?.role === 'admin' ? adminNav : vendorNav
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || 'U'

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">M</div>
        <div>
          <div className="logo-text">MoiiDev ERP</div>
          <div className="logo-sub">Procurement Portal</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {nav.map(section => (
          <div key={section.section}>
            <div className="nav-section-label">{section.section}</div>
            {section.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-badge">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">⏻</button>
        </div>
      </div>
    </aside>
  )
}
