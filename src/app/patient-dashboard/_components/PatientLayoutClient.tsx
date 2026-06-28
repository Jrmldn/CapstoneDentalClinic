'use client'

import React, { useState } from 'react'
import PatientSidebar from './Sidebar'
import PatientTopBar from './TopBar'

interface PatientLayoutClientProps {
  children: React.ReactNode
  patientName: string
  user: { email: string }
  logoutAction: () => Promise<void> | void
}

export default function PatientLayoutClient({
  children,
  patientName,
  user,
  logoutAction,
}: PatientLayoutClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <PatientSidebar
        patientName={patientName}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <PatientTopBar
          user={user}
          clinicName="AppointDent"
          logoutAction={logoutAction}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Page content */}
        <main className="flex-1 p-6 max-w-5xl w-full mx-auto space-y-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
