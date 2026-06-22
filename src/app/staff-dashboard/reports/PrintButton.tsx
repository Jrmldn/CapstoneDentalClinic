'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-semibold text-sm shadow-sm">
      Print / Save PDF</button>
  )
}
