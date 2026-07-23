export function isValidLocalDateTime(value: string): boolean {
  if (!value) return true
  const parsed = new Date(value)
  return !Number.isNaN(parsed.getTime())
}

export function isDateRangeValid(dateFrom: string, dateTo: string): boolean {
  if (!dateFrom || !dateTo) return true
  if (!isValidLocalDateTime(dateFrom) || !isValidLocalDateTime(dateTo)) return false
  return new Date(dateFrom).getTime() <= new Date(dateTo).getTime()
}

export function normalizeDateRange(
  key: 'dateFrom' | 'dateTo',
  value: string,
  current: { dateFrom: string; dateTo: string },
): { dateFrom: string; dateTo: string } {
  if (!value) {
    return key === 'dateFrom'
      ? { dateFrom: '', dateTo: current.dateTo }
      : { dateFrom: current.dateFrom, dateTo: '' }
  }

  if (key === 'dateFrom') {
    const dateFrom = value
    let dateTo = current.dateTo
    if (dateTo && new Date(dateFrom).getTime() > new Date(dateTo).getTime()) {
      dateTo = dateFrom
    }
    return { dateFrom, dateTo }
  }

  const dateTo = value
  let dateFrom = current.dateFrom
  if (dateFrom && new Date(dateTo).getTime() < new Date(dateFrom).getTime()) {
    dateFrom = dateTo
  }
  return { dateFrom, dateTo }
}
