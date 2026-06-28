'use client'

import { LogOut, Bell, Menu } from 'lucide-react'

interface StaffTopBarProps {
  user: { email: string }
  clinicName: string
  logoutAction: (formData: FormData) => Promise<void>
  onMenuToggle?: () => void
}

export default function StaffTopBar({ user, clinicName, logoutAction, onMenuToggle }: StaffTopBarProps) {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-8 flex-shrink-0 print:hidden">
      {/* Left side: hamburger + Clinic context */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 md:hidden"
          type="button"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 hidden xs:inline">Clinic:</span>
          <span className="text-sm font-semibold text-slate-800 truncate max-w-[120px] sm:max-w-none">{clinicName}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hidden xs:inline">
            Active
          </span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Notification bell */}
        <button
          id="staff-notif-btn"
          className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
        >
          <Bell className="w-5 h-5" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200" />

        {/* User */}
        <span className="text-sm text-gray-600 hidden md:inline">{user.email}</span>

        {/* Logout */}
        <form action={logoutAction} className="inline">
          <button
            id="staff-logout-btn"
            type="submit"
            className="inline-flex items-center gap-2 px-2 sm:px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 transition rounded-lg hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </form>
      </div>
    </header>
  )
}
