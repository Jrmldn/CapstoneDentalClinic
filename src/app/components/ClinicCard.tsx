import Link from 'next/link'

interface ClinicCardProps {
  id: string
  name: string
  address: string
  phone: string
}

export function ClinicCard({ id, name, address, phone }: ClinicCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{name}</h3>
      <div className="space-y-3 mb-6">
        <div>
          <p className="text-sm text-gray-600">Address</p>
          <p className="text-gray-700">{address}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Phone</p>
          <p className="text-gray-700">{phone}</p>
        </div>
      </div>
      <Link
        href={`/login?clinic=${id}`}
        className="inline-flex items-center justify-center w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition"
      >
        Book Appointment
      </Link>
    </div>
  )
}
