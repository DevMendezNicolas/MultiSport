import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { AxiosError } from 'axios'
import { bookingsApi } from '../api/bookingsApi'
import type {
  CreateBookingRequest,
  CreateBlockRequest,
  RecordPaymentRequest,
  CancelBookingRequest,
  RescheduleBookingRequest,
  PriceQuoteRequest,
} from '../types'

export const BOOKINGS_QUERY_KEYS = {
  all: ['bookings'] as const,
  grid: (date: string) => [...BOOKINGS_QUERY_KEYS.all, 'grid', date] as const,
  detail: (id: string | null) => [...BOOKINGS_QUERY_KEYS.all, 'detail', id] as const,
  customers: (query: string) => [...BOOKINGS_QUERY_KEYS.all, 'customers', query] as const,
}

interface ProblemDetailsResponse {
  title?: string
  detail?: string
  errors?: Record<string, string[]>
}

const extractErrorMessage = (error: unknown, fallback: string): string => {
  const axiosError = error as AxiosError<ProblemDetailsResponse>
  if (axiosError?.response?.data?.detail) {
    return axiosError.response.data.detail
  }
  if (axiosError?.response?.data?.title) {
    return axiosError.response.data.title
  }
  return fallback
}

export const useDailyGrid = (date: string) => {
  return useQuery({
    queryKey: BOOKINGS_QUERY_KEYS.grid(date),
    queryFn: () => bookingsApi.getDailyGrid(date),
    staleTime: 1000 * 30, // 30 segundos
    refetchOnWindowFocus: true,
  })
}

export const useBookingDetail = (bookingId: string | null) => {
  return useQuery({
    queryKey: BOOKINGS_QUERY_KEYS.detail(bookingId),
    queryFn: () => bookingsApi.getBookingById(bookingId!),
    enabled: !!bookingId,
  })
}

export const useCreateBooking = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateBookingRequest) => bookingsApi.createBooking(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEYS.all })
      toast.success(`Turno reservado para ${data.customerName}`)
    },
    onError: (error) => {
      const msg = extractErrorMessage(error, 'No se pudo crear la reserva.')
      toast.error(msg)
    },
  })
}

export const useCreateBlock = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateBlockRequest) => bookingsApi.createBlock(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEYS.all })
      toast.success('Bloqueo operativo aplicado correctamente.')
    },
    onError: (error) => {
      const msg = extractErrorMessage(error, 'No se pudo aplicar el bloqueo.')
      toast.error(msg)
    },
  })
}

export const useRecordPayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RecordPaymentRequest }) =>
      bookingsApi.recordPayment(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEYS.detail(variables.id) })
      toast.success('Pago registrado con éxito.')
    },
    onError: (error) => {
      const msg = extractErrorMessage(error, 'Error al registrar el pago.')
      toast.error(msg)
    },
  })
}

export const useCancelBooking = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CancelBookingRequest }) =>
      bookingsApi.cancelBooking(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEYS.detail(variables.id) })
      toast.success('Reserva cancelada correctamente.')
    },
    onError: (error) => {
      const msg = extractErrorMessage(error, 'Error al cancelar la reserva.')
      toast.error(msg)
    },
  })
}

export const useRescheduleBooking = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RescheduleBookingRequest }) =>
      bookingsApi.rescheduleBooking(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEYS.detail(data.id) })
      toast.success('Reserva reprogramada exitosamente.')
    },
    onError: (error) => {
      const msg = extractErrorMessage(error, 'Conflicto al reprogramar reserva.')
      toast.error(msg)
    },
  })
}

export const useCustomerSearch = (query: string) => {
  return useQuery({
    queryKey: BOOKINGS_QUERY_KEYS.customers(query),
    queryFn: () => bookingsApi.searchCustomers(query),
    enabled: query.trim().length >= 2,
    staleTime: 1000 * 60,
  })
}

export const usePriceQuote = () => {
  return useMutation({
    mutationFn: (payload: PriceQuoteRequest) => bookingsApi.getPriceQuote(payload),
  })
}
