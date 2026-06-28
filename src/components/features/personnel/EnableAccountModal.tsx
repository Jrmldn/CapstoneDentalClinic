'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FormattedStaff } from '@/types/clinic'

interface EnableAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  person: FormattedStaff | null
  isSubmitting: boolean
}

export default function EnableAccountModal({
  isOpen,
  onClose,
  onConfirm,
  person,
  isSubmitting,
}: EnableAccountModalProps) {
  const [mounted, setMounted] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!isOpen) setConfirmText('')
  }, [isOpen])

  if (!mounted || !isOpen || !person) return null

  const fullName = `${person.firstName} ${person.lastName}`

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Enable Account</h2>
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to re-enable{' '}
          <span className="font-medium text-gray-900">{fullName}</span>?
          They will regain full access to the system.
        </p>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-emerald-800">
            This account&apos;s login credentials will be restored immediately.
          </p>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Type <span className="font-mono font-bold">ENABLE</span> to confirm
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="ENABLE"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4"
          autoComplete="off"
        />

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmText !== 'ENABLE' || isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Confirm Enable
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
