'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutGrid, 
  Home, 
  Users,
  Image as ImageIcon
} from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname.startsWith(path)

  const menuItems = [
    { 
      label: 'Dashboard', 
      href: '/superadmin-dashboard', 
      icon: LayoutGrid,
      key: 'dashboard'
    },
    { 
      label: 'Clinic', 
      href: '/superadmin-dashboard/clinic', 
      icon: Home,
      key: 'clinic'
    },
    { 
      label: 'Personnel', 
      href: '/superadmin-dashboard/personnel', 
      icon: Users,
      key: 'personnel'
    },
  ]

  return (
    <aside className="w-56 bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-slate-900" />
          </div>
          <span className="text-lg font-semibold">AppointDent</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-8 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = item.key === 'dashboard' ? pathname === '/superadmin-dashboard' || pathname === '/superadmin-dashboard/' : isActive(item.href)
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-700">
        <button className="flex items-center gap-3 w-full px-4 py-2 rounded-lg hover:bg-slate-700/50 transition">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold">SA</span>
          </div>
          <span className="text-sm font-medium truncate">Superadmin</span>
        </button>
      </div>
    </aside>
  )
}
