import { enforceRole } from '@/lib/authProtection'

export default async function StaffPage() {
  await enforceRole('superadmin')
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Staff</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Staff management coming soon...</p>
      </div>
    </div>
  )
}
