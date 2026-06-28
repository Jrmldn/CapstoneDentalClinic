'use client'

import React from 'react'
import { LogOut, Bell, Menu } from 'lucide-react'

interface PatientTopBarProps {
  user: { email: string }
  clinicName: string
  logoutAction: () => void
  onMenuToggle?: () => void
}

export default function PatientTopBar({ user, clinicName, logoutAction, onMenuToggle }: PatientTopBarProps) {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-8 flex-shrink-0 print:hidden">
      {/* Left side (Hamburger & Clinic Context) */}
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuToggle}
          className="p-2 -ml-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 md:hidden transition"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 hidden sm:inline">Clinic:</span>
          <span className="text-sm font-semibold text-slate-800">{clinicName}</span>
          <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Active
          </span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <button
          id="patient-notif-btn"
          className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
        >
          <Bell className="w-5 h-5" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200" />

        {/* User */}
        <span className="text-sm text-gray-600 hidden sm:inline">{user.email}</span>

        {/* Logout */}
        <button
          id="patient-logout-btn"
          onClick={logoutAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-650 hover:text-red-650 transition rounded-lg hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </header>
  )
}
