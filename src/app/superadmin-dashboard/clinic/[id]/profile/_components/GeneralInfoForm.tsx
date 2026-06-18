'use client'

import { useState, useTransition } from 'react'
import { Save, Loader2 } from 'lucide-react'
import { updateClinicProfile } from '@/actions/clinicSetupActions'

interface Props {
  clinicId: number
  clinic: Record<string, unknown>
}

const STATUS_OPTIONS = [
  { value: 'open',   label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'auto',   label: 'Auto (Based on Hours)' },
]

export default function GeneralInfoForm({ clinicId, clinic }: Props) {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [form, setForm] = useState({
    phone:                    String(clinic.phone ?? ''),
    email:                    String(clinic.email ?? ''),
    address:                  String(clinic.address ?? ''),
    manual_status:            String(clinic.manual_status ?? 'open'),
    max_appointments_per_day: Number(clinic.max_appointments_per_day ?? 20),
    default_downpayment_amount: Number(clinic.default_downpayment_amount ?? 0),
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    startTransition(async () => {
      const result = await updateClinicProfile(clinicId, {
        phone:                      form.phone,
        email:                      form.email,
        address:                    form.address,
        manual_status:              form.manual_status,
        max_appointments_per_day:   Number(form.max_appointments_per_day),
        default_downpayment_amount: Number(form.default_downpayment_amount),
      })
      setMsg(result.success
        ? { type: 'success', text: 'Clinic profile updated successfully.' }
        : { type: 'error', text: result.error ?? 'An error occurred.' }
      )
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-4">General Information</h2>

        {/* Readonly name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Name</label>
          <input
            type="text"
            value={String(clinic.name ?? '')}
            readOnly
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-400 text-sm cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-1">Edit the clinic name from the main Clinics & Branches page.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Phone Number" name="phone" value={form.phone} onChange={handleChange} placeholder="+63 912 345 6789" />
          <Field label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} placeholder="clinic@example.com" />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Full clinic address"
          />
        </div>
      </div>

      <hr className="border-gray-100" />

      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-4">Appointment Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Status</label>
            <select
              name="manual_status"
              value={form.manual_status}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            {form.manual_status === 'auto' && (
              <p className="text-xs text-blue-600 mt-1 leading-snug">
                🕐 Status will automatically switch between Open / Closed based on today&apos;s operating hours.
              </p>
            )}
            {form.manual_status === 'open' && (
              <p className="text-xs text-emerald-600 mt-1">
                ✅ Always shown as Open regardless of operating hours.
              </p>
            )}
            {form.manual_status === 'closed' && (
              <p className="text-xs text-red-500 mt-1">
                🔒 Always shown as Closed regardless of operating hours.
              </p>
            )}
          </div>

          <Field
            label="Max Appointments / Day"
            name="max_appointments_per_day"
            type="number"
            value={String(form.max_appointments_per_day)}
            onChange={handleChange}
            min="1"
            max="100"
          />

          <Field
            label="Default Downpayment (₱)"
            name="default_downpayment_amount"
            type="number"
            value={String(form.default_downpayment_amount)}
            onChange={handleChange}
            min="0"
            step="50"
          />
        </div>
      </div>

      {/* Feedback */}
      {msg && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${
          msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {msg.text}
        </div>
      )}

      <div className="flex justify-end">
        <button
          id="save-general-info-btn"
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

function Field({
  label, name, value, onChange, type = 'text', placeholder, min, max, step,
}: {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  placeholder?: string
  min?: string
  max?: string
  step?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        id={`field-${name}`}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  )
}
