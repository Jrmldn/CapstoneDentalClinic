'use client'

import { useState } from 'react'
import { Lock, Trash2 } from 'lucide-react'
import { addBlockedSlot, deleteBlockedSlot } from '@/actions/dentistScheduleActions'
import { formatDateLong, formatTo12h } from '@/lib/date'

export interface BlockedSlot {
  id: number
  blocked_date: string
  start_time: string | null
  end_time: string | null
  reason: string | null
}

interface AvailabilityClientProps {
  dentistId: number
  initialBlockedSlots: BlockedSlot[]
}

export default function AvailabilityClient({ dentistId, initialBlockedSlots }: AvailabilityClientProps) {
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>(initialBlockedSlots)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [blockType, setBlockType] = useState<'full' | 'slot' | 'leave'>('full')
  const [startTime, setStartTime] = useState('13:00')
  const [endTime, setEndTime] = useState('14:00')
  // Calendar state: June 2026 as per mockup
  const [currentYear, setCurrentYear] = useState(2026)
  const [currentMonth, setCurrentMonth] = useState(5) // June (0-indexed, so 5 is June)

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay()

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Get blocks for a specific day
  const getBlocksForDay = (day: number) => {
    const dateString = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
    return blockedSlots.filter(slot => slot.blocked_date === dateString)
  }

  // Handle previous month
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(prev => prev - 1)
    } else {
      setCurrentMonth(prev => prev - 1)
    }
    setSelectedDate(null)
  }

  // Handle next month
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(prev => prev + 1)
    } else {
      setCurrentMonth(prev => prev + 1)
    }
    setSelectedDate(null)
  }

  const handleSelectDay = (day: number) => {
    const dateString = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
    setSelectedDate(dateString)
  }

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate) return

    const reason = blockType === 'full' ? 'Blocked' : blockType === 'leave' ? 'Leave' : 'Time Slot Block'
    const start = blockType === 'slot' ? startTime : null
    const end = blockType === 'slot' ? endTime : null

    const res = await addBlockedSlot(dentistId, selectedDate, start, end, reason)

    if (res.success && res.blockedSlot) {
      setBlockedSlots(prev => [...prev, res.blockedSlot])
      alert('Block saved successfully!')
    } else {
      alert(res.error || 'Failed to save blocked date')
    }
  }

  const handleRemoveBlock = async (blockId: number) => {
    if (!confirm('Are you sure you want to remove this block?')) return

    const res = await deleteBlockedSlot(blockId)

    if (res.success) {
      setBlockedSlots(prev => prev.filter(b => b.id !== blockId))
      alert('Block removed successfully!')
    } else {
      alert(res.error || 'Failed to remove block')
    }
  }

  // Compute month summary statistics
  const blockedDaysCount = new Set(blockedSlots.filter(s => s.blocked_date.startsWith(`${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}`)).map(s => s.blocked_date)).size
  const slotBlocksCount = blockedSlots.filter(s => s.blocked_date.startsWith(`${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}`) && s.start_time !== null).length
  const workingDaysCount = daysInMonth - blockedDaysCount

  // Selected date block list
  const selectedDateBlocks = selectedDate ? blockedSlots.filter(b => b.blocked_date === selectedDate) : []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
      {/* Calendar Area */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          {/* Calendar Header */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition"
            >
              &lt;
            </button>
            <h3 className="font-bold text-slate-800 text-base">
              {monthNames[currentMonth]} {currentYear}
            </h3>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition"
            >
              &gt;
            </button>
          </div>

          {/* Weekday Titles */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty slots for spacing */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24" />
            ))}

            {/* Calendar Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateString = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
              const isSelected = selectedDate === dateString
              const dayBlocks = getBlocksForDay(day)

              // Determine styling based on blocks
              const hasFullBlock = dayBlocks.some(b => b.reason === 'Blocked')
              const hasLeave = dayBlocks.some(b => b.reason === 'Leave')
              const timeSlots = dayBlocks.filter(b => b.start_time !== null)

              let dayBg = 'bg-white hover:bg-slate-50 border-gray-200'
              if (hasFullBlock) dayBg = 'bg-red-50/70 border-red-200 hover:bg-red-100/60'
              else if (hasLeave) dayBg = 'bg-purple-50/70 border-purple-200 hover:bg-purple-100/60'

              return (
                <div
                  key={day}
                  onClick={() => handleSelectDay(day)}
                  className={`h-24 border rounded-xl p-2.5 cursor-pointer flex flex-col justify-between transition-all select-none ${dayBg} ${
                    isSelected ? 'ring-2 ring-blue-600 border-blue-600 scale-[1.02] shadow-sm' : ''
                  }`}
                >
                  <span className={`text-xs font-bold ${hasFullBlock ? 'text-red-700' : hasLeave ? 'text-purple-700' : 'text-slate-800'}`}>
                    {day}
                  </span>

                  {/* Render block labels inside cell */}
                  <div className="space-y-1">
                    {hasFullBlock && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-700 flex items-center justify-between">
                        Blocked
                        <Lock className="w-2 h-2" />
                      </span>
                    )}
                    {hasLeave && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 flex items-center justify-between">
                        Leave
                        <Lock className="w-2 h-2" />
                      </span>
                    )}
                    {timeSlots.map(ts => (
                      <span
                        key={ts.id}
                        className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 block truncate"
                      >
                        {formatTo12h(ts.start_time)}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Monthly Summary Statistics Grid */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{monthNames[currentMonth]} Summary</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-slate-50 rounded-xl border border-gray-150 shadow-2xs">
              <span className="text-2xl font-black text-slate-850 leading-none">{workingDaysCount}</span>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1.5">Working days</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-gray-150 shadow-2xs">
              <span className="text-2xl font-black text-red-650 leading-none">{blockedDaysCount}</span>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1.5">Blocked days</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-gray-150 shadow-2xs">
              <span className="text-2xl font-black text-amber-600 leading-none">{slotBlocksCount}</span>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1.5">Slot blocks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Block management panel */}
      <div className="space-y-6">
        {/* Legend */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Block Types</span>
          <div className="space-y-3 font-semibold text-xs text-slate-650">
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-red-500 border border-white shadow-2xs" />
              <span>Full Day Block</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-white shadow-2xs" />
              <span>Time Slot Block</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-purple-500 border border-white shadow-2xs" />
              <span>Leave / Day Off</span>
            </div>
          </div>
        </div>

        {/* Date block config form */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm min-h-[300px] flex flex-col justify-between">
          {!selectedDate ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <Lock className="w-12 h-12 text-slate-300 mb-3" />
              <h5 className="font-bold text-slate-500 text-sm">Select a Day</h5>
              <p className="text-xs text-gray-400 mt-1">Select a calendar cell to manage schedule blocks.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="border-b border-gray-100 pb-2">
                <span className="text-xs font-bold text-slate-800 block">Manage Blocks</span>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Date: <span className="font-semibold">{formatDateLong(selectedDate)}</span>
                </p>
              </div>

              {/* List existing blocks for selected date */}
              {selectedDateBlocks.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Blocks</span>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {selectedDateBlocks.map(b => (
                      <div key={b.id} className="flex justify-between items-center p-2.5 rounded-lg border border-gray-150 bg-slate-50/50 text-xs font-bold text-slate-750">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            b.reason === 'Blocked' ? 'bg-red-500' : b.reason === 'Leave' ? 'bg-purple-500' : 'bg-amber-500'
                          }`} />
                          <span>
                            {b.reason} {b.start_time ? `(${formatTo12h(b.start_time)} - ${formatTo12h(b.end_time)})` : ''}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveBlock(b.id)}
                          className="p-1 hover:bg-red-50 text-red-500 hover:text-red-700 rounded transition"
                          title="Remove block"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form to add a new block */}
              <form onSubmit={handleAddBlock} className="space-y-4 pt-2 border-t border-gray-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Add New Block</span>

                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-600 block">Block Type</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setBlockType('full')}
                      className={`py-1.5 px-1 rounded-lg border text-[10px] font-bold transition text-center ${
                        blockType === 'full'
                          ? 'bg-red-500 border-red-500 text-white shadow-2xs'
                          : 'bg-white border-gray-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Full Day
                    </button>
                    <button
                      type="button"
                      onClick={() => setBlockType('slot')}
                      className={`py-1.5 px-1 rounded-lg border text-[10px] font-bold transition text-center ${
                        blockType === 'slot'
                          ? 'bg-amber-500 border-amber-500 text-white shadow-2xs'
                          : 'bg-white border-gray-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Time Slot
                    </button>
                    <button
                      type="button"
                      onClick={() => setBlockType('leave')}
                      className={`py-1.5 px-1 rounded-lg border text-[10px] font-bold transition text-center ${
                        blockType === 'leave'
                          ? 'bg-purple-500 border-purple-500 text-white shadow-2xs'
                          : 'bg-white border-gray-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Leave
                    </button>
                  </div>
                </div>

                {/* Time slot picker */}
                {blockType === 'slot' && (
                  <div className="grid grid-cols-2 gap-3 animate-in fade-in duration-200">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Start Time</span>
                      <input
                        type="time"
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white"
                        value={startTime}
                        onChange={e => setStartTime(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">End Time</span>
                      <input
                        type="time"
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white"
                        value={endTime}
                        onChange={e => setEndTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs shadow-xs transition"
                >
                  Save Schedule Block
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
