'use client'

import { useState, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  X,
  Trash2,
  AlertCircle,
  RefreshCw,
  Clock
} from 'lucide-react'
import { fetchCalendarData, manageClinicHolidays } from '@/actions/managementActions'
import { updateAppointmentStatus } from '@/actions/appointmentActions'
import RescheduleModal from '../appointments/RescheduleModal'

interface Holiday {
  id: number
  date: string
  description: string
  is_special_day: boolean
}

interface Appointment {
  id: number
  scheduled_at: string
  end_at: string
  status: string
  patients: { id: number; first_name: string; last_name: string; phone?: string } | { id: number; first_name: string; last_name: string; phone?: string }[] | null
  services: { id: number; name: string; slot_duration_min?: number } | { id: number; name: string; slot_duration_min?: number }[] | null
  dentists?: { id: number; first_name: string; last_name: string } | { id: number; first_name: string; last_name: string }[] | null
  dentist_id?: number | null
}

interface CalendarClientProps {
  clinicId: number
  initialHolidays: Holiday[]
  initialAppointments: Appointment[]
  currentYear: number
  currentMonth: number
  canManageHolidays?: boolean
  userId?: string
  role?: string
  dentistId?: number
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function CalendarClient({
  clinicId,
  initialHolidays,
  initialAppointments,
  currentYear,
  currentMonth,
  canManageHolidays = true,
  userId,
  role,
  dentistId
}: CalendarClientProps) {
  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState(currentMonth)
  const [holidays, setHolidays] = useState<Holiday[]>(initialHolidays)
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  // Status updates & rescheduling state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<number | null>(null)
  const [reschedulingAppointment, setReschedulingAppointment] = useState<any | null>(null)

  // Holiday Modal State
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false)
  const [holidayDate, setHolidayDate] = useState('')
  const [holidayDesc, setHolidayDesc] = useState('')
  const [isSpecialDay, setIsSpecialDay] = useState(false) // false = clinic closed, true = special (open but notable)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch data when year/month changes
  const loadMonthData = async (targetYear: number, targetMonth: number) => {
    setIsLoading(true)
    const calendarResult = await fetchCalendarData(clinicId, targetYear, targetMonth, dentistId)
    setIsLoading(false)
    if (calendarResult.success) {
      setHolidays(calendarResult.holidays as Holiday[])
      setAppointments(calendarResult.appointments as Appointment[])
    }
  }

  const handleApprove = async (apptId: number) => {
    if (!userId || !role) return
    setIsUpdatingStatus(apptId)
    const res = await updateAppointmentStatus(apptId, 'confirmed', userId, role)
    setIsUpdatingStatus(null)
    if (res.success) {
      loadMonthData(year, month)
    } else {
      alert(res.error || 'Failed to approve appointment')
    }
  }

  const handlePrevMonth = () => {
    let newMonth = month - 1
    let newYear = year
    if (newMonth < 1) {
      newMonth = 12
      newYear -= 1
    }
    setMonth(newMonth)
    setYear(newYear)
    loadMonthData(newYear, newMonth)
  }

  const handleNextMonth = () => {
    let newMonth = month + 1
    let newYear = year
    if (newMonth > 12) {
      newMonth = 1
      newYear += 1
    }
    setMonth(newMonth)
    setYear(newYear)
    loadMonthData(newYear, newMonth)
  }

  // Manage Holiday submit
  const handleHolidaySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!holidayDate || !holidayDesc) return
    setIsSubmitting(true)

    const addHolidayResult = await manageClinicHolidays(clinicId, 'add', {
      date: holidayDate,
      description: holidayDesc,
      is_special_day: isSpecialDay
    })

    setIsSubmitting(false)
    if (addHolidayResult.success) {
      alert('Holiday/Closure added successfully!')
      setIsHolidayModalOpen(false)
      setHolidayDate('')
      setHolidayDesc('')
      setIsSpecialDay(false)
      loadMonthData(year, month)
    } else {
      alert(addHolidayResult.error || 'Failed to add holiday')
    }
  }

  const handleDeleteHoliday = async (holidayId: number) => {
    if (!confirm('Are you sure you want to remove this holiday/closure?')) return
    const removeHolidayResult = await manageClinicHolidays(clinicId, 'remove', undefined, holidayId)
    if (removeHolidayResult.success) {
      alert('Holiday removed!')
      loadMonthData(year, month)
    } else {
      alert(removeHolidayResult.error || 'Failed to remove holiday')
    }
  }

  // Generate days in month helper
  const getDaysInMonthGrid = () => {
    const firstDayIndex = new Date(year, month - 1, 1).getDay()
    const totalDays = new Date(year, month, 0).getDate()

    const days = []
    // Padding for previous month days
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: null, dateStr: null })
    }
    // Days of current month
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({ day: d, dateStr })
    }

    return days
  }

  const daysGrid = getDaysInMonthGrid()

  // Find events for each day
  const getDayDetails = (dateStr: string | null) => {
    if (!dateStr) return { appts: [], holiday: null }
    const dayAppts = appointments.filter(a => {
      const d = new Date(a.scheduled_at)
      const apptDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      return apptDateStr === dateStr
    })
    const dayHoliday = holidays.find(h => h.date === dateStr)
    return { appts: dayAppts, holiday: dayHoliday }
  }

  // Selected date details
  const selectedDetails = selectedDate ? getDayDetails(selectedDate) : { appts: [], holiday: null }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm">
        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Legend:</span>
        {[
          { label: 'Appointments', bg: 'bg-blue-100', text: 'text-blue-700' },
          { label: 'Special Event', bg: 'bg-amber-100', text: 'text-amber-800' },
          { label: 'Clinic Closed', bg: 'bg-red-100', text: 'text-red-800' },
        ].map(l => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-sm ${l.bg}`} />
            <span className={l.text}>{l.label}</span>
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid Section */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          {/* Calendar Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-800">
                {MONTHS[month - 1]} {year}
              </h2>
              {isLoading && <RefreshCw className="w-4.5 h-4.5 text-blue-600 animate-spin" />}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-gray-100 border border-gray-200 rounded-lg transition"
              >
                <ChevronLeft className="w-5 h-5 text-gray-650" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-gray-100 border border-gray-200 rounded-lg transition"
              >
                <ChevronRight className="w-5 h-5 text-gray-650" />
              </button>
              {canManageHolidays && (
                <button
                  onClick={() => setIsHolidayModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition shadow-sm ml-2"
                >
                  <Plus className="w-3.5 h-3.5" /> Set Closure
                </button>
              )}
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 text-center border-b border-gray-100 pb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            {WEEKDAYS.map(w => (
              <div key={w} className="py-2">{w}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {daysGrid.map((cell, idx) => {
              const { day, dateStr } = cell
              if (!day || !dateStr) {
                return <div key={`empty-${idx}`} className="aspect-square bg-gray-50/50 border border-transparent rounded-lg" />
              }

              const { appts, holiday } = getDayDetails(dateStr)
              const isToday = new Date().toISOString().slice(0, 10) === dateStr
              const isSelected = selectedDate === dateStr

              let cellBg = 'bg-white hover:border-blue-500'
              let borderStyle = 'border-gray-100'

              if (isSelected) {
                cellBg = 'bg-blue-50/50'
                borderStyle = 'border-blue-500'
              } else if (holiday) {
                cellBg = holiday.is_special_day ? 'bg-amber-50/40 hover:border-amber-300' : 'bg-red-50/30 hover:border-red-300'
                borderStyle = holiday.is_special_day ? 'border-amber-100' : 'border-red-100'
              } else if (isToday) {
                cellBg = 'bg-slate-50'
                borderStyle = 'border-slate-300'
              }

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`aspect-square border rounded-xl p-2 flex flex-col justify-between items-start transition ${cellBg} ${borderStyle} text-left outline-none relative group`}
                >
                  <span className={`text-sm font-bold ${isSelected ? 'text-blue-600' :
                      isToday ? 'text-slate-900 ring-2 ring-slate-900/5 px-1.5 py-0.5 rounded-md bg-slate-200' :
                        holiday ? (holiday.is_special_day ? 'text-amber-705' : 'text-red-700') :
                          'text-slate-700'
                    }`}>
                    {day}
                  </span>

                  {/* Day content indicators */}
                  <div className="w-full space-y-1">
                    {holiday && (
                      <span className={`text-[9px] font-bold block truncate px-1 rounded uppercase ${holiday.is_special_day ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {holiday.description}
                      </span>
                    )}
                    {appts.length > 0 && (
                      <span className="text-[9px] font-bold bg-blue-100 text-blue-700 block truncate px-1 rounded uppercase">
                        {appts.length} {appts.length === 1 ? 'Appt' : 'Appts'}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected Day Details Section */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between max-h-[600px]">
          <div>
            <div className="border-b border-gray-100 pb-3 mb-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                Day Details
              </h3>
              {selectedDate && (
                <span className="text-xs text-gray-500 font-semibold">
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              )}
            </div>

            {!selectedDate ? (
              <div className="text-center py-20 text-gray-400">
                <CalendarIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-sm">Select a day on the calendar to view appointments and closures.</p>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[400px] pr-1">
                {/* Day Holiday info */}
                {selectedDetails.holiday && (
                  <div className={`p-4 rounded-xl border flex justify-between items-start ${selectedDetails.holiday.is_special_day ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-850'
                    }`}>
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider">
                        {selectedDetails.holiday.is_special_day ? 'Special Day Event' : 'Clinic Closure'}
                      </h4>
                      <p className="text-sm font-semibold mt-1">{selectedDetails.holiday.description}</p>
                    </div>
                    {canManageHolidays && (
                      <button
                        onClick={() => handleDeleteHoliday(selectedDetails.holiday!.id)}
                        className="p-1 hover:bg-black/5 rounded text-red-650"
                        title="Remove Holiday"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}

                {/* Day Appointments */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Appointments ({selectedDetails.appts.length})
                  </h4>
                  {selectedDetails.appts.length === 0 ? (
                    <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-xl text-center">
                      No appointments scheduled for this day.
                    </p>
                  ) : (
                    selectedDetails.appts.map((appt) => {
                      const time = new Date(appt.scheduled_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })
                      const patientObj = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients
                      const serviceObj = Array.isArray(appt.services) ? appt.services[0] : appt.services
                      const dentistObj = Array.isArray((appt as any).dentists) ? (appt as any).dentists[0] : (appt as any).dentists

                      const normAppt = {
                        ...appt,
                        patients: patientObj,
                        services: serviceObj,
                        dentists: dentistObj
                      }

                      const showActions = userId && role && (appt.status === 'pending' || appt.status === 'confirmed' || appt.status === 'rescheduled')

                      return (
                        <div key={appt.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-slate-800 text-sm">
                              {patientObj ? `${patientObj.first_name} ${patientObj.last_name}` : 'Unknown'}
                            </span>
                            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded capitalize">
                              {appt.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              {time}
                            </span>
                            <span className="font-semibold text-slate-700">{serviceObj?.name ?? '—'}</span>
                          </div>
                          {showActions && (
                            <div className="flex gap-2 pt-2 border-t border-gray-200/60 mt-1.5">
                              {(appt.status === 'pending' || appt.status === 'rescheduled') && (
                                <button
                                  onClick={() => handleApprove(appt.id)}
                                  disabled={isUpdatingStatus === appt.id}
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold shadow-2xs transition disabled:opacity-50"
                                >
                                  Approve
                                </button>
                              )}
                              <button
                                onClick={() => setReschedulingAppointment(normAppt)}
                                disabled={isUpdatingStatus === appt.id}
                                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-bold transition disabled:opacity-50"
                              >
                                Reschedule
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MODAL: Add Clinic Holiday/Closure */}
        {isHolidayModalOpen && (
          <div className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4 backdrop-blur-xs animate-in zoom-in-95 duration-150">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                <h3 className="font-bold text-slate-900 text-lg">Set Clinic Holiday / Closure</h3>
                <button onClick={() => setIsHolidayModalOpen(false)} className="p-1 hover:bg-gray-200 rounded-full transition">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleHolidaySubmit} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-800">Date *</label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50 focus:ring-2 focus:ring-blue-500 text-slate-700"
                    value={holidayDate}
                    onChange={e => setHolidayDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-800">Holiday / Closure Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Independence Day, Clinic Renovations"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50 focus:ring-2 focus:ring-blue-500 text-slate-750"
                    value={holidayDesc}
                    onChange={e => setHolidayDesc(e.target.value)}
                  />
                </div>

                <div className="space-y-2.5 pt-2">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 focus:ring-blue-500 w-4 h-4"
                      checked={isSpecialDay}
                      onChange={e => setIsSpecialDay(e.target.checked)}
                    />
                    <span>Special Event (Clinic remains open)</span>
                  </label>
                  <p className="text-[10px] text-gray-400 italic">
                    * If unchecked, the clinic will be marked as closed, and patients will not be able to book appointments on this date.
                  </p>
                </div>

                <div className="border-t border-gray-100 pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsHolidayModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !holidayDate || !holidayDesc}
                    className="px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-semibold text-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Set Date'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {reschedulingAppointment && (
          <RescheduleModal
            appointment={reschedulingAppointment}
            onClose={() => setReschedulingAppointment(null)}
            userId={userId || ''}
            clinicId={clinicId}
            onSuccess={() => {
              setReschedulingAppointment(null)
              loadMonthData(year, month)
            }}
          />
        )}
      </div>
    </div>
  )
}
