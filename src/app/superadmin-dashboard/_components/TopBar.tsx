'use client'

import { LogOut } from 'lucide-react'

interface TopBarProps {
  user: { email: string }
  logoutAction: (formData: FormData) => Promise<void>
}

export default function TopBar({ user, logoutAction }: TopBarProps) {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 flex-shrink-0 print:hidden">
      {/* Context indicator */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Scope:</span>
        <span className="text-sm font-semibold text-slate-800">All Branches</span>
        <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Active
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* User email */}
        <span className="text-sm text-gray-600">{user?.email}</span>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200" />

        {/* Logout */}
        <form action={logoutAction} className="inline">
          <button
            id="superadmin-logout-btn"
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 transition rounded-lg hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </form>
      </div>
    </header>
  )
}
