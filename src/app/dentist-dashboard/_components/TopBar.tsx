'use client'

import { LogOut, Bell } from 'lucide-react'

interface DentistTopBarProps {
  user: { email: string }
  clinicName: string
  logoutAction: (formData: FormData) => Promise<void>
}

export default function DentistTopBar({ user, clinicName, logoutAction }: DentistTopBarProps) {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 flex-shrink-0 print:hidden">
      {/* Clinic context */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Clinic:</span>
        <span className="text-sm font-semibold text-slate-800">{clinicName}</span>
        <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          Dentist Portal
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <button
          className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
        >
          <Bell className="w-5 h-5" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200" />

        {/* User */}
        <span className="text-sm text-gray-600">{user.email}</span>

        {/* Logout */}
        <form action={logoutAction} className="inline">
          <button
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
