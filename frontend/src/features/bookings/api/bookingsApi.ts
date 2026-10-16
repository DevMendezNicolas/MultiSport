import api from '@/lib/axios'
import type {
  DailyGridResponse,
  BookingResponse,
  CreateBookingRequest,
  CreateBlockRequest,
  RecordPaymentRequest,
  CancelBookingRequest,
  RescheduleBookingRequest,
  PriceQuoteRequest,
  PriceQuoteResponse,
  CustomerLookupDto,
} from '../types'

export const bookingsApi = {
  getDailyGrid: async (date: string): Promise<DailyGridResponse> => {
    const response = await api.get<DailyGridResponse>('/bookings/grid', {
      params: { date },
    })
    return response.data
  },

  getBookingById: async (id: string): Promise<BookingResponse> => {
    const response = await api.get<BookingResponse>(`/bookings/${id}`)
    return response.data
  },

  createBooking: async (payload: CreateBookingRequest): Promise<BookingResponse> => {
    const response = await api.post<BookingResponse>('/bookings', payload)
    return response.data
  },

  createBlock: async (payload: CreateBlockRequest): Promise<BookingResponse> => {
    const response = await api.post<BookingResponse>('/bookings/block', payload)
    return response.data
  },

  recordPayment: async (id: string, payload: RecordPaymentRequest): Promise<PaymentResponse> => {
    const response = await api.post<PaymentResponse>(`/bookings/${id}/payments`, payload)
    return response.data
  },

  cancelBooking: async (id: string, payload: CancelBookingRequest): Promise<void> => {
    await api.post(`/bookings/${id}/cancel`, payload)
  },

  rescheduleBooking: async (id: string, payload: RescheduleBookingRequest): Promise<BookingResponse> => {
    const response = await api.post<BookingResponse>(`/bookings/${id}/reschedule`, payload)
    return response.data
  },

  getPriceQuote: async (payload: PriceQuoteRequest): Promise<PriceQuoteResponse> => {
    const response = await api.post<PriceQuoteResponse>('/bookings/quote', payload)
    return response.data
  },

  searchCustomers: async (query: string): Promise<CustomerLookupDto[]> => {
    const response = await api.get<CustomerLookupDto[]>('/bookings/customers', {
      params: { query },
    })
    return response.data
  },
}
