export interface PaymentResponse {
  id: string
  bookingId: string
  amount: number
  paymentMethod: 'cash' | 'transfer' | 'card' | 'mercadopago' | string
  paymentType: 'deposit' | 'partial' | 'full' | 'refund' | string
  status: 'approved' | 'pending' | 'rejected' | string
  receiptUrl?: string | null
  notes?: string | null
  createdAt: string
}

export interface BookingResponse {
  id: string
  complexId: string
  courtId: string
  courtName: string
  sportId: string
  sportName: string
  customerId?: string | null
  customerName: string
  customerPhone: string
  customerEmail?: string | null
  startTimeUtc: string
  endTimeUtc: string
  totalPrice: number
  depositAmount: number
  balance: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'expired' | 'blocked'
  isRecurring: boolean
  recurringGroupId?: string | null
  notes?: string | null
  createdAt: string
  payments: PaymentResponse[]
}

export interface CreateBookingRequest {
  courtId: string
  sportId: string
  customerName: string
  customerPhone: string
  customerEmail?: string | null
  startTimeUtc: string
  endTimeUtc: string
  customPrice?: number | null
  depositAmount: number
  paymentMethod?: string | null
  isRecurring: boolean
  notes?: string | null
}

export interface CreateBlockRequest {
  courtId: string
  startTimeUtc: string
  endTimeUtc: string
  reason: string
}

export interface RecordPaymentRequest {
  amount: number
  paymentMethod: 'cash' | 'transfer' | 'card' | 'mercadopago'
  paymentType: 'deposit' | 'partial' | 'full'
  receiptUrl?: string | null
  notes?: string | null
}

export interface CancelBookingRequest {
  reason: string
  refundDeposit: boolean
  refundMethod?: string | null
}

export interface RescheduleBookingRequest {
  courtId: string
  newStartTimeUtc: string
  newEndTimeUtc: string
}

export interface PriceQuoteRequest {
  courtId: string
  sportId: string
  startTimeUtc: string
  endTimeUtc: string
}

export interface PriceQuoteResponse {
  price: number
  appliedRuleName: string
  hasRuleApplied: boolean
}

export interface GridSportItem {
  sportId: string
  name: string
  durationMinutes: number
  basePrice: number
}

export interface GridBookingItem {
  id: string
  courtId: string
  sportId: string
  sportName: string
  customerName: string
  customerPhone: string
  startTimeUtc: string
  endTimeUtc: string
  totalPrice: number
  depositAmount: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'expired' | 'blocked'
  isRecurring: boolean
  notes?: string | null
}

export interface DailyGridCourtItem {
  courtId: string
  courtName: string
  surface: string
  isIndoor: boolean
  sports: GridSportItem[]
  bookings: GridBookingItem[]
}

export interface DailyGridResponse {
  date: string
  courts: DailyGridCourtItem[]
}

export interface CustomerLookupDto {
  id: string
  name: string
  phone: string
  email?: string | null
  notes?: string | null
}
