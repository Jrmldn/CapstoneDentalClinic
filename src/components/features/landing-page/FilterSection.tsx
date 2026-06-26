import React from 'react'
import { cn } from '@/lib/utils'
import { RATING_OPTIONS } from './constants'

interface FilterSectionProps {
  minRating: number
  setMinRating: (val: number) => void
  showOpenOnly: boolean
  setShowOpenOnly: (val: boolean) => void
}

/**
 * FilterSection Component
 * Renders the filter controls (Rating dropdown, Open Status checkbox).
 */
export const FilterSection = ({
  minRating,
  setMinRating,
  showOpenOnly,
  setShowOpenOnly,
}: FilterSectionProps) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Minimum Rating
        </label>
        <select
          value={minRating}
          onChange={(e) => setMinRating(Number(e.target.value))}
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-blue-500 transition-all"
        >
          {RATING_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Status
        </label>
        <label
          className={cn(
            "flex items-center gap-3 px-4 h-[42px] border rounded-lg cursor-pointer transition-all",
            showOpenOnly ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-200"
          )}
        >
          <input
            type="checkbox"
            checked={showOpenOnly}
            onChange={(e) => setShowOpenOnly(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm font-medium text-slate-700">Open Now Only</span>
        </label>
      </div>
    </div>
  </div>
)
