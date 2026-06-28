import { describe, it, expect } from 'vitest'
import { toDateKey, formatDate, formatDateTime, formatTime, formatDateLong, formatTo12h } from '@/lib/date'

describe('date helpers — Asia/Manila (UTC+8)', () => {
  it('toDateKey rolls to the next day for evening-UTC instants', () => {
    // 16:30 UTC == 00:30 the next day in Manila
    expect(toDateKey('2026-06-23T16:30:00Z')).toBe('2026-06-24')
    // 02:00 UTC == 10:00 same day in Manila
    expect(toDateKey('2026-06-23T02:00:00Z')).toBe('2026-06-23')
  })

  it('toDateKey keeps a plain date string on the same day', () => {
    expect(toDateKey('2026-06-23')).toBe('2026-06-23')
  })

  it('formatDate renders the Manila calendar day', () => {
    expect(formatDate('2026-06-23T16:30:00Z')).toBe('Jun 24, 2026')
    expect(formatDate('2026-06-23')).toBe('Jun 23, 2026')
  })

  it('formatDateTime renders Manila local time', () => {
    // 06:30 UTC == 14:30 Manila
    expect(formatDateTime('2026-06-23T06:30:00Z')).toBe('Jun 23, 2026, 2:30 PM')
  })

  it('formatTime renders Manila local time', () => {
    expect(formatTime('2026-06-23T06:30:00Z')).toBe('2:30 PM')
  })

  it('formatDateLong includes the weekday', () => {
    expect(formatDateLong('2026-06-23')).toBe('Tuesday, June 23, 2026')
  })

  it('display helpers return an em dash for empty or invalid input', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
    expect(formatDate('')).toBe('—')
    expect(formatDateTime('not-a-date')).toBe('—')
  })

  describe('formatTo12h', () => {
    it('formats 24-hour time strings to 12-hour AM/PM format', () => {
      expect(formatTo12h('08:00')).toBe('8:00 AM')
      expect(formatTo12h('13:30')).toBe('1:30 PM')
      expect(formatTo12h('12:00')).toBe('12:00 PM')
      expect(formatTo12h('00:15')).toBe('12:15 AM')
    })

    it('returns the input if it cannot be parsed', () => {
      expect(formatTo12h('invalid')).toBe('invalid')
    })

    it('returns em dash for empty input', () => {
      expect(formatTo12h(null)).toBe('—')
      expect(formatTo12h(undefined)).toBe('—')
      expect(formatTo12h('')).toBe('—')
    })
  })
})

