import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getPreferredCalendarMonth } from './calendar-grid'

/** Noon Brisbane so the calendar day is unambiguous across host timezones. */
function brisbaneNoon(year: number, month: number, day: number): Date {
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return new Date(`${year}-${mm}-${dd}T12:00:00+10:00`)
}

describe('getPreferredCalendarMonth', () => {
  it('keeps September when today is 22 Sep 2026 (before last grid week)', () => {
    const result = getPreferredCalendarMonth([], brisbaneNoon(2026, 9, 22))
    assert.deepEqual(result, { year: 2026, month: 9 })
  })

  it('advances to October when today is 28 Sep 2026 (Monday of last grid week)', () => {
    const result = getPreferredCalendarMonth([], brisbaneNoon(2026, 9, 28))
    assert.deepEqual(result, { year: 2026, month: 10 })
  })

  it('stays on current month mid-month even with no events', () => {
    const result = getPreferredCalendarMonth([], brisbaneNoon(2026, 9, 15))
    assert.deepEqual(result, { year: 2026, month: 9 })
  })
})
