import React from 'react'
import { Loader2, Check, X, Tag, CalendarDays, Info } from 'lucide-react'

interface ServiceFormProps {
  viewerRole: 'superadmin' | 'staff'
  editingId: number | null
  form: {
    name: string
    price: string
    slot_duration_min: string
    price_type: 'fixed' | 'range'
    price_min: string
    price_max: string
    allows_installment: boolean
    downpayment_amount: string
    num_installments: string
    addToAllBranches: boolean
  }
  isPending: boolean
  msg: { type: 'success' | 'error'; text: string } | null
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: React.FormEvent) => void
  handleCancel: () => void
  showAllBranchesOption?: boolean
}

export default function ServiceForm({
  viewerRole,
  editingId,
  form,
  isPending,
  msg,
  handleChange,
  handleSubmit,
  handleCancel,
  showAllBranchesOption = false,
}: ServiceFormProps) {
  const isRange = form.price_type === 'range'

  // Live installment preview — only when all four inputs are valid
  const minPrice = Number(form.price_min)
  const maxPrice = Number(form.price_max)
  const downpayment = Number(form.downpayment_amount)
  const numInstallments = Number(form.num_installments)
  const previewValid =
    form.price_min !== '' && form.price_max !== '' &&
    form.downpayment_amount !== '' && form.num_installments !== '' &&
    minPrice > 0 && maxPrice >= minPrice && numInstallments > 0 && downpayment >= 0
  const previewExample = previewValid ? Math.round((minPrice + maxPrice) / 2) : 0
  const previewMonthly = previewValid && numInstallments > 0
    ? (previewExample - downpayment) / numInstallments
    : 0
  const showPreview = previewValid && previewMonthly > 0

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-5 p-4 rounded-xl border border-blue-100 bg-blue-50 space-y-3"
    >
      <p className="text-sm font-semibold text-slate-700">
        {editingId ? 'Edit Service' : 'New Service'}
      </p>

      {/* Name + Duration row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Service Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="e.g. Tooth Extraction"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Duration (min)</label>
          <input
            name="slot_duration_min"
            type="number"
            min="5"
            step="5"
            value={form.slot_duration_min}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Superadmin: grouped pricing + installment sections */}
      {viewerRole === 'superadmin' && (
        <div className="space-y-3">

          {/* Pricing section */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" aria-hidden="true" />
              Pricing
            </p>

            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="price_type"
                  value="fixed"
                  checked={form.price_type === 'fixed'}
                  onChange={handleChange}
                  className="accent-blue-600"
                />
                Fixed price
              </label>
              <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="price_type"
                  value="range"
                  checked={form.price_type === 'range'}
                  onChange={handleChange}
                  className="accent-blue-600"
                />
                Price range
              </label>
            </div>

            {isRange ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Min Price (₱)</label>
                  <input
                    name="price_min"
                    type="number"
                    min="0"
                    step="50"
                    value={form.price_min}
                    onChange={handleChange}
                    required
                    placeholder="e.g. 45000"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Max Price (₱)</label>
                  <input
                    name="price_max"
                    type="number"
                    min="0"
                    step="50"
                    value={form.price_max}
                    onChange={handleChange}
                    required
                    placeholder="e.g. 55000"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Price (₱)</label>
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="50"
                  value={form.price}
                  onChange={handleChange}
                  required
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Installment section (range only) */}
          {isRange && (
            <div className="border-l-2 border-indigo-400 bg-indigo-50/50 pl-4 py-3 space-y-3">
              <label className="flex items-center gap-2 text-sm text-indigo-700 font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="allows_installment"
                  checked={form.allows_installment}
                  onChange={handleChange}
                  className="w-4 h-4 accent-indigo-600"
                />
                <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
                Offer installment plan
              </label>

              {form.allows_installment && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Downpayment (₱)</label>
                      <input
                        name="downpayment_amount"
                        type="number"
                        min="0"
                        step="50"
                        value={form.downpayment_amount}
                        onChange={handleChange}
                        required
                        placeholder="e.g. 10000"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">No. of Installments</label>
                      <input
                        name="num_installments"
                        type="number"
                        min="1"
                        step="1"
                        value={form.num_installments}
                        onChange={handleChange}
                        required
                        placeholder="e.g. 4"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                  </div>

                  {showPreview && (
                    <div className="bg-white rounded-lg px-3 py-2 text-xs text-indigo-600 flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                      <span>
                        For a ₱{previewExample.toLocaleString()} case:{' '}
                        ₱{downpayment.toLocaleString()} down, then{' '}
                        ₱{previewMonthly.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/month for{' '}
                        {numInstallments} month{numInstallments === 1 ? '' : 's'}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Staff: plain price input */}
      {viewerRole === 'staff' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Price (₱)</label>
          <input
            name="price"
            type="number"
            min="0"
            step="50"
            value={form.price}
            onChange={handleChange}
            required
            placeholder="0"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Add to all branches (superadmin add only) */}
      {viewerRole === 'superadmin' && !editingId && showAllBranchesOption && (
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
          <input
            type="checkbox"
            name="addToAllBranches"
            checked={form.addToAllBranches}
            onChange={handleChange}
            className="w-4 h-4 accent-blue-600"
          />
          Add to all branches
        </label>
      )}

      {msg && (
        <p className={`text-xs font-medium ${msg.type === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
          {msg.text}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {editingId ? 'Update' : 'Save'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 transition"
        >
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
      </div>
    </form>
  )
}
