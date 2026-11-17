import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { confirmLogout } from '../../utils/swal'

export default function Sidebar({ onLogout, isOpen = false, onClose }) {
  const location = useLocation()
  const navigate = useNavigate()

  const menuItems = [
    {
      id: 'dashboard',
      path: '/',
      altPaths: ['/dashboard'],
      label: 'Dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      )
    },
    {
      id: 'vendors',
      path: '/vendors',
      label: 'Vendors',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      )
    },
    {
      id: 'item-master',
      path: '/item-master',
      label: 'Item Master',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
          <path d="m3.3 7 8.7 5 8.7-5"/>
          <path d="M12 22V12"/>
        </svg>
      )
    },
    {
      id: 'demands',
      path: '/demands',
      altPaths: ['/demands/create', '/demands/active'],
      label: 'Demands',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      )
    },
    {
      id: 'quotations',
      path: '/quotations',
      label: 'Quotations',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2"/>
          <path d="M7 8h10"/>
          <path d="M7 12h10"/>
          <path d="M7 16h6"/>
        </svg>
      )
    },
    {
      id: 'allocations',
      path: '/allocations',
      altPaths: ['/allocations/final-order'],
      label: 'Allocations',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"/>
          <circle cx="6" cy="12" r="3"/>
          <circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
      )
    },
    {
      id: 'reports',
      path: '/reports',
      label: 'Reports',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      )
    },
    {
      id: 'email-logs',
      path: '/email-logs',
      label: 'Email Logs',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="16" x="2" y="4" rx="2"/>
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
        </svg>
      )
    },
    {
      id: 'settings',
      path: '/settings',
      label: 'Settings',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      )
    }
  ]

  const handleLogoutClick = async () => {
    const isConfirmed = await confirmLogout()
    if (!isConfirmed) return
    if (onClose) onClose()
    if (onLogout) {
      onLogout()
    }
    navigate('/login')
  }

  return (
    <aside
      className={`fixed lg:sticky top-0 left-0 z-50 lg:z-40 h-screen w-64 bg-gradient-to-b from-[#05381d] via-[#05321a] to-[#042815] text-white flex flex-col shrink-0 select-none border-r border-[#074b27] shadow-2xl lg:shadow-xl overflow-hidden transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Brand Logo Container with Clean White Card for High Visibility (Pinned Top) */}
      <div className="pt-6 pb-4 px-4 flex items-center justify-between gap-2 shrink-0">
        <Link
          to="/"
          onClick={() => onClose && onClose()}
          className="flex-1 bg-white rounded-2xl p-2 px-3 flex items-center justify-center shadow-md shadow-black/15 border border-white/60 hover:shadow-lg transition-shadow"
        >
          <img
            src="/logo.png"
            alt="Mirch Masala Grocery Shop"
            className="h-14 w-auto object-contain select-none"
          />
        </Link>

        {/* Mobile Close Button ('X') visible only on small screens */}
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          title="Close Navigation Menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Navigation List (Scrollable only if menu overflows vertically on small screen) */}
      <nav className="flex-1 px-3.5 py-2 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.altPaths && item.altPaths.some((p) => location.pathname.startsWith(p))) ||
            (item.path !== '/' && location.pathname.startsWith(item.path))

          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => onClose && onClose()}
              className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-150 text-left cursor-pointer group ${
                isActive
                  ? 'bg-[#0f8b4a] text-white font-semibold shadow-md shadow-black/20 border border-emerald-400/25'
                  : 'text-slate-200 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <span
                className={`transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'text-emerald-200/80 group-hover:text-white'
                }`}
              >
                {item.icon}
              </span>
              <span className="tracking-wide">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout Section at the Bottom (Pinned Bottom) */}
      <div className="p-3.5 mx-2 mb-3 pt-3 border-t border-white/10 shrink-0">
        <button
          type="button"
          onClick={handleLogoutClick}
          className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-[14px] font-medium text-rose-200 bg-rose-500/10 hover:bg-rose-600 hover:text-white border border-rose-500/20 hover:border-rose-600 transition-all duration-150 cursor-pointer group shadow-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-rose-300 group-hover:text-white transition-colors"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
          <span className="font-semibold tracking-wide">Logout</span>
        </button>
      </div>
    </aside>
  )
}
