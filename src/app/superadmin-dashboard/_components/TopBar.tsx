'use client'

import { LogOut } from 'lucide-react'

interface TopBarProps {
  user: { email: string }
  logoutAction: (formData: FormData) => Promise<void>
}

export default function TopBar({ user, logoutAction }: TopBarProps) {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8">
      <div className="flex-1">
        {/* Page title will be injected by child components */}
      </div>
      
      <div className="flex items-center gap-6">
        <span className="text-sm text-gray-600">{user?.email}</span>
        <form
          action={logoutAction}
          className="inline"
        >
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </form>
      </div>
    </header>
  )
}
