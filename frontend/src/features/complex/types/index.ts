export interface ComplexScheduleItem {
  dayOfWeek: number
  openingTime: string
  closingTime: string
  isClosed: boolean
}

export interface ComplexProfile {
  id: string
  name: string
  taxId?: string
  cbuAlias?: string
  address?: string
  phone?: string
  city?: string
  logoUrl?: string
  schedules: ComplexScheduleItem[]
}

export interface UpdateComplexProfilePayload {
  name: string
  taxId?: string
  cbuAlias?: string
  address?: string
  phone?: string
  city?: string
  logoUrl?: string
}

export interface UpdateComplexSchedulesPayload {
  schedules: ComplexScheduleItem[]
}
