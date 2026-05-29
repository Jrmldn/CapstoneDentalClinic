import { enforceRole } from '@/lib/authProtection'
import { handleLogout } from '@/app/actions/handleLogout'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'

interface SuperadminLayoutProps {
  children: React.ReactNode
}

export default async function SuperadminLayout({ children }: SuperadminLayoutProps) {
  const authUser = await enforceRole('superadmin')
  const user = { email: authUser.email || '' }
  const logoutAction = handleLogout.bind(null, '/superadmin-login')

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <TopBar user={user} logoutAction={logoutAction} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-100">
          {children}
        </main>
      </div>
    </div>
  )
}
