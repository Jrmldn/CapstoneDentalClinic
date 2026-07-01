'use client'

import React, { useState } from 'react'
import DentistSidebar from './Sidebar'
import DentistTopBar from './TopBar'

interface DentistLayoutClientProps {
  children: React.ReactNode
  user: { email: string }
  clinicName: string
  logoutAction: (formData: FormData) => Promise<void>
  dentistName: string
}

export default function DentistLayoutClient({
  children,
  user,
  clinicName,
  logoutAction,
  dentistName,
}: DentistLayoutClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <DentistSidebar
        dentistName={dentistName}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <DentistTopBar
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
