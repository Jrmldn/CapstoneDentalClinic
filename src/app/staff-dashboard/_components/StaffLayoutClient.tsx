'use client'

import React, { useState } from 'react'
import StaffSidebar from './Sidebar'
import StaffTopBar from './TopBar'

interface StaffLayoutClientProps {
  children: React.ReactNode
  user: { email: string }
  clinicName: string
  logoutAction: (formData: FormData) => Promise<void>
}

export default function StaffLayoutClient({
  children,
  user,
  clinicName,
  logoutAction,
}: StaffLayoutClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <StaffSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <StaffTopBar
          user={user}
          clinicName={clinicName}
          logoutAction={logoutAction}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
