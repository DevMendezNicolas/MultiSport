export interface BookingResponse {
  id: string
  courtId: string
  customerName: string
  customerPhone: string
  totalPrice: number
  depositAmount: number
  isPaid: boolean
  startTimeUtc: string // ISO 8601 UTC
  endTimeUtc: string   // ISO 8601 UTC
  createdAt: string
  createdBy: string | null
  updatedAt: string
  updatedBy: string | null
}

export interface CreateBookingPayload {
  courtId: string
  customerName: string
  customerPhone: string
  startTimeUtc: string
  endTimeUtc: string
  depositAmount: number
}
