import React, { useState, useEffect } from 'react'
import {
  Calendar,
  Clock,
  Phone,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Trash2,
  CreditCard,
  Banknote,
  Building,
  Repeat,
  DoorOpen,
  Send,
} from 'lucide-react'
import {
  Sheet,
  SheetHeader,
  SheetBody,
  SheetFooter,
} from '@/components/ui/sheet'
import { AlertDialog } from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useBookingDetail,
  useRecordPayment,
  useCancelBooking,
  useRescheduleBooking,
} from '../hooks/useBookings'
import { localToUtcIso, utcToLocalParts } from '../types/timeline.types'

interface BookingDetailSheetProps {
  bookingId: string | null
  isOpen: boolean
  onClose: () => void
}

export const BookingDetailSheet: React.FC<BookingDetailSheetProps> = ({
  bookingId,
  isOpen,
  onClose,
}) => {
  const { data: booking, isLoading } = useBookingDetail(bookingId)

  // Estados de cobro de saldo
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [cashReceived, setCashReceived] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'card' | 'mercadopago'>('cash')

  // Check-in de jugadores en pista
  const [isCheckedIn, setIsCheckedIn] = useState(false)

  // Estados de cancelación
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [refundDeposit, setRefundDeposit] = useState(false)
  const [refundMethod, setRefundMethod] = useState<'cash' | 'transfer'>('cash')

  // Estados de reprogramación de horario
  const [showRescheduleForm, setShowRescheduleForm] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('18:00')
  const [rescheduleDurationMinutes, setRescheduleDurationMinutes] = useState(60)

  const recordPaymentMutation = useRecordPayment()
  const cancelBookingMutation = useCancelBooking()
  const rescheduleBookingMutation = useRescheduleBooking()

  // Sincronizar estado inicial al recibir reserva
  useEffect(() => {
    if (booking) {
      setPaymentAmount(booking.balance > 0 ? booking.balance : 0)
      setCashReceived(booking.balance > 0 ? booking.balance : 0)
      setShowPaymentForm(false)
      setShowCancelDialog(false)
      setShowRescheduleForm(false)
      setCancelReason('')
      setRefundDeposit(false)

      const start = new Date(booking.startTimeUtc)
      const end = new Date(booking.endTimeUtc)
      const dur = Math.round((end.getTime() - start.getTime()) / 60000)
      setRescheduleDurationMinutes(dur > 0 ? dur : 60)
      const startParts = utcToLocalParts(booking.startTimeUtc)
      setRescheduleDate(startParts.dateStr)
      setRescheduleTime(startParts.timeStr)
    }
  }, [booking])

  if (!isOpen) return null

  // Cálculo de vuelto para cobro en mostrador
  const changeAmount = Math.max(0, cashReceived - paymentAmount)

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!booking || paymentAmount <= 0) return

    await recordPaymentMutation.mutateAsync({
      id: booking.id,
      payload: {
        amount: paymentAmount,
        paymentMethod,
        paymentType: paymentAmount >= booking.balance ? 'full' : 'partial',
      },
    })

    setShowPaymentForm(false)
  }

  const handleConfirmReschedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!booking || !rescheduleDate || !rescheduleTime) return

    const newStartIso = localToUtcIso(rescheduleDate, rescheduleTime)
    const newEndIso = new Date(
      new Date(newStartIso).getTime() + rescheduleDurationMinutes * 60 * 1000
    ).toISOString()

    await rescheduleBookingMutation.mutateAsync({
      id: booking.id,
      payload: {
        courtId: booking.courtId,
        newStartTimeUtc: newStartIso,
        newEndTimeUtc: newEndIso,
      },
    })

    setShowRescheduleForm(false)
  }

  const handleConfirmCancel = async () => {
    if (!booking) return

    await cancelBookingMutation.mutateAsync({
      id: booking.id,
      payload: {
        reason: cancelReason.trim() || 'Cancelado por el administrador',
        refundDeposit,
        refundMethod: refundDeposit ? refundMethod : null,
      },
    })

    setShowCancelDialog(false)
    onClose()
  }

  const formatDateTime = (isoString: string) => {
    const d = new Date(isoString)
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    const date = d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
    return { time, date }
  }

  // Generar URL preformateada de WhatsApp
  const cleanPhone = booking?.customerPhone?.replace(/[^0-9]/g, '') || ''
  const waMessage = booking
    ? encodeURIComponent(
        `Hola ${booking.customerName}, te recordamos tu turno de ${booking.sportName} en ${booking.courtName} (${formatDateTime(booking.startTimeUtc).time} a ${formatDateTime(booking.endTimeUtc).time} hs). Saldo pendiente: $${booking.balance.toLocaleString('es-AR')}.`
      )
    : ''

  // Iniciales del cliente para el avatar
  const initials = booking?.customerName
    ? booking.customerName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'TK'

  return (
    <>
      <Sheet isOpen={isOpen} onClose={onClose} side="right">
        <SheetHeader onClose={onClose}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#22242B] border border-[#31343E] flex items-center justify-center text-[#D46211]">
              <Calendar className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-lg font-headline font-bold text-[#F2F3F5] leading-tight">
                Detalle y Operaciones del Turno
              </h2>
              {booking && (
                <p className="text-xs font-medium text-[#9497A1] mt-0.5">
                  {booking.courtName} · {booking.sportName}
                </p>
              )}
            </div>
          </div>
        </SheetHeader>

        <SheetBody className="space-y-5 bg-[#17181C]">
          {isLoading || !booking ? (
            <div className="space-y-4 pt-2">
              <Skeleton className="h-14 w-full rounded-xl bg-[#22242B]" />
              <Skeleton className="h-28 w-full rounded-xl bg-[#22242B]" />
              <Skeleton className="h-40 w-full rounded-xl bg-[#22242B]" />
            </div>
          ) : (
            <>
              {/* Tarjeta de Horario y Estado */}
              <div className="p-4 rounded-xl bg-[#22242B] border border-[#31343E] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {booking.status === 'confirmed' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#327357]/20 text-[#327357] border border-[#327357]/40">
                        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                        Confirmado
                      </span>
                    )}
                    {booking.status === 'pending' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#D46211]/20 text-[#D46211] border border-[#D46211]/40">
                        <AlertCircle className="h-3.5 w-3.5" strokeWidth={2} />
                        Pendiente de Pago
                      </span>
                    )}
                    {booking.status === 'blocked' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#17181C] text-[#9497A1] border border-[#31343E]">
                        <ShieldAlert className="h-3.5 w-3.5" strokeWidth={2} />
                        Bloqueo Operativo
                      </span>
                    )}
                    {booking.status === 'cancelled' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-950/60 text-red-400 border border-red-500/30">
                        Cancelado
                      </span>
                    )}
                    {booking.isRecurring && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-[#31343E] text-[#F2F3F5]">
                        <Repeat className="h-3 w-3 text-[#D46211]" strokeWidth={2} />
                        Turno Fijo
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm font-semibold text-[#F2F3F5]">
                  <Clock className="h-4 w-4 text-[#D46211] shrink-0" strokeWidth={1.75} />
                  <span>
                    {formatDateTime(booking.startTimeUtc).time} a {formatDateTime(booking.endTimeUtc).time} hs
                  </span>
                  <span className="text-[#9497A1]">·</span>
                  <span className="capitalize text-[#9497A1]">{formatDateTime(booking.startTimeUtc).date}</span>
                </div>

                {/* Formulario de Reprogramación Rápida */}
                {booking.status !== 'cancelled' && (
                  <div className="pt-2 border-t border-[#31343E]">
                    {!showRescheduleForm ? (
                      <button
                        type="button"
                        onClick={() => setShowRescheduleForm(true)}
                        className="px-3 py-1.5 rounded-lg border border-[#31343E] bg-[#17181C] hover:bg-[#292A2E] text-xs font-bold text-[#F2F3F5] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Calendar className="h-3.5 w-3.5 text-[#D46211]" strokeWidth={1.75} />
                        <span>Reprogramar Horario Manualmente</span>
                      </button>
                    ) : (
                      <form
                        onSubmit={handleConfirmReschedule}
                        className="p-3 bg-[#17181C] border border-[#31343E] rounded-xl space-y-3"
                      >
                        <span className="text-xs font-mono font-bold text-[#D46211] uppercase block">
                          Nueva Fecha y Horario
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] font-bold text-[#9497A1] block mb-1">Fecha</label>
                            <input
                              type="date"
                              required
                              value={rescheduleDate}
                              onChange={(e) => setRescheduleDate(e.target.value)}
                              className="w-full text-base sm:text-xs font-semibold p-2 bg-[#22242B] border border-[#31343E] text-[#F2F3F5] rounded-lg outline-none focus:border-[#D46211]"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-[#9497A1] block mb-1">Hora Inicio</label>
                            <input
                              type="time"
                              required
                              value={rescheduleTime}
                              onChange={(e) => setRescheduleTime(e.target.value)}
                              className="w-full text-base sm:text-xs font-semibold p-2 bg-[#22242B] border border-[#31343E] text-[#F2F3F5] rounded-lg outline-none focus:border-[#D46211]"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowRescheduleForm(false)}
                            className="px-3 py-1.5 text-xs text-[#9497A1] hover:text-white transition-colors cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            disabled={rescheduleBookingMutation.isPending}
                            className="px-3.5 py-1.5 rounded-lg bg-[#D46211] hover:bg-[#E37A24] text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                          >
                            {rescheduleBookingMutation.isPending ? 'Reprogramando...' : 'Confirmar'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>

              {/* Ficha del Titular / Jugador con WhatsApp Directo */}
              {booking.status !== 'blocked' && (
                <div className="p-4 rounded-xl bg-[#22242B] border border-[#31343E] space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-[#D46211] text-white flex items-center justify-center font-headline font-black text-sm shadow-sm">
                        {initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-headline text-base font-bold text-[#F2F3F5]">
                          {booking.customerName}
                        </span>
                        <span className="text-xs text-[#327357] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
                          Jugador Regular
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones de Contacto Rápido */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <a
                      href={`tel:${cleanPhone}`}
                      className="flex items-center justify-center gap-2 bg-[#17181C] hover:bg-[#292A2E] text-[#F2F3F5] py-2.5 rounded-lg text-xs font-bold uppercase transition-colors border border-[#31343E]"
                    >
                      <Phone className="h-3.5 w-3.5 text-[#D46211]" strokeWidth={1.75} />
                      <span className="truncate">{booking.customerPhone}</span>
                    </a>

                    <a
                      href={`https://wa.me/549${cleanPhone}?text=${waMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-[#327357] hover:bg-[#285E46] text-white py-2.5 rounded-lg text-xs font-bold uppercase transition-colors shadow-sm"
                    >
                      <Send className="h-3.5 w-3.5" strokeWidth={2} />
                      <span>Avisar Saldo</span>
                    </a>
                  </div>

                  {booking.notes && (
                    <div className="mt-2 pt-2 border-t border-[#31343E] text-xs text-[#9497A1]">
                      <span className="font-bold text-[#F2F3F5]">Nota: </span>
                      {booking.notes}
                    </div>
                  )}
                </div>
              )}

              {/* Módulo Financiero & Cobro en Mostrador con Vuelto */}
              {booking.status !== 'blocked' && (
                <div className="p-4 rounded-xl bg-[#22242B] border border-[#31343E] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-headline font-bold text-[#9497A1] uppercase tracking-wider">
                      Desglose de Caja & Pagos
                    </span>
                    <span className="text-[10px] font-mono text-[#327357] font-bold">
                      ARS ($)
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center bg-[#17181C] p-2.5 rounded-lg border border-[#31343E]/60">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#9497A1]">Total</span>
                      <span className="text-sm font-headline font-bold text-[#F2F3F5]">
                        ${booking.totalPrice.toLocaleString('es-AR')}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#9497A1]">Seña</span>
                      <span className="text-sm font-headline font-bold text-[#327357]">
                        ${booking.depositAmount.toLocaleString('es-AR')}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#9497A1]">Saldo</span>
                      <span
                        className={`text-sm font-headline font-extrabold ${
                          booking.balance > 0 ? 'text-[#D46211]' : 'text-[#9497A1]'
                        }`}
                      >
                        ${booking.balance.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>

                  {/* Formulario de Cobro en Mostrador */}
                  {booking.status !== 'cancelled' && booking.balance > 0 && (
                    <div className="pt-2">
                      {!showPaymentForm ? (
                        <button
                          type="button"
                          onClick={() => setShowPaymentForm(true)}
                          className="w-full py-2.5 px-4 rounded-lg text-xs font-bold text-white bg-[#D46211] hover:bg-[#E37A24] transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                        >
                          <DollarSign className="h-4 w-4" strokeWidth={2} />
                          <span>Registrar Cobro de Saldo (${booking.balance.toLocaleString('es-AR')})</span>
                        </button>
                      ) : (
                        <form
                          onSubmit={handleRecordPayment}
                          className="p-3.5 rounded-xl bg-[#17181C] border border-[#31343E] space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#F2F3F5]">
                              Cobro en Mostrador
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowPaymentForm(false)}
                              className="text-xs text-[#9497A1] hover:text-white cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>

                          {/* Selector de Método de Pago */}
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'cash', label: 'Efectivo', icon: Banknote },
                              { id: 'transfer', label: 'Transferencia', icon: Building },
                              { id: 'mercadopago', label: 'Mercado Pago', icon: CreditCard },
                            ].map((item) => {
                              const Icon = item.icon
                              const isSelected = paymentMethod === item.id
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => setPaymentMethod(item.id as typeof paymentMethod)}
                                  className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                                    isSelected
                                      ? 'border-[#D46211] bg-[#D46211] text-white shadow-sm'
                                      : 'border-[#31343E] bg-[#22242B] text-[#9497A1] hover:text-white'
                                  }`}
                                >
                                  <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                                  <span className="text-[11px] truncate">{item.label}</span>
                                </button>
                              )
                            })}
                          </div>

                          {/* Asistente de Cálculo de Vuelto para Efectivo */}
                          {paymentMethod === 'cash' && (
                            <div className="bg-[#22242B] p-2.5 rounded-lg border border-[#31343E] flex items-center justify-between gap-3">
                              <div className="flex flex-col flex-1">
                                <label className="text-[10px] text-[#9497A1]">Efectivo entregado:</label>
                                <div className="relative mt-0.5">
                                  <span className="absolute left-2.5 top-1.5 font-bold text-[#9497A1] text-xs">$</span>
                                  <input
                                    type="number"
                                    min={paymentAmount}
                                    value={cashReceived || ''}
                                    onChange={(e) => setCashReceived(Number(e.target.value))}
                                    className="w-full bg-[#17181C] text-[#F2F3F5] pl-6 pr-2 py-1 text-sm font-bold rounded border border-[#31343E] focus:border-[#D46211] outline-none"
                                  />
                                </div>
                              </div>
                              <div className="flex flex-col items-end shrink-0 pl-2">
                                <span className="text-[10px] text-[#9497A1]">Vuelto a devolver:</span>
                                <span className="font-headline text-base font-extrabold text-[#327357] mt-0.5">
                                  ${changeAmount.toLocaleString('es-AR')}
                                </span>
                              </div>
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={recordPaymentMutation.isPending}
                            className="w-full py-2.5 rounded-lg text-xs font-bold text-white bg-[#D46211] hover:bg-[#E37A24] transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                          >
                            {recordPaymentMutation.isPending
                              ? 'Registrando...'
                              : `Confirmar Pago (${paymentAmount.toLocaleString('es-AR')})`}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Operaciones de Cancha (Check-in de Jugadores) */}
              {booking.status !== 'blocked' && (
                <div className="p-4 rounded-xl bg-[#22242B] border border-[#31343E] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DoorOpen className="h-5 w-5 text-[#327357]" strokeWidth={1.75} />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#F2F3F5]">Check-in de Jugadores</span>
                      <span className="text-[11px] text-[#9497A1]">Habilitar luces de pista y pelotas</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCheckedIn}
                      onChange={(e) => setIsCheckedIn(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#17181C] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#327357] border border-[#31343E]" />
                  </label>
                </div>
              )}
            </>
          )}
        </SheetBody>

        <SheetFooter className="justify-between bg-[#17181C] border-t border-[#31343E]">
          {booking && booking.status !== 'cancelled' ? (
            <button
              type="button"
              onClick={() => setShowCancelDialog(true)}
              className="min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold text-red-400 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.75} />
              <span>{booking.status === 'blocked' ? 'Levantar Bloqueo' : 'Cancelar Reserva'}</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2.5 rounded-lg border border-[#31343E] text-xs font-medium text-[#F2F3F5] bg-[#22242B] hover:bg-[#292A2E] transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </SheetFooter>
      </Sheet>

      {/* Diálogo Centrado de Confirmación Destructiva (Regla 13 de AGENTS.md) */}
      <AlertDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleConfirmCancel}
        isLoading={cancelBookingMutation.isPending}
        title={booking?.status === 'blocked' ? 'Levantar Bloqueo' : 'Cancelar Reserva'}
        confirmText="Confirmar Cancelación"
        isDestructive={true}
        description={
          <div className="space-y-3">
            <p className="text-sm text-[#F2F3F5]">
              ¿Está seguro de que desea cancelar esta reserva en{' '}
              <strong className="text-white">{booking?.courtName}</strong>?
            </p>

            {booking && booking.depositAmount > 0 && (
              <div className="p-3 rounded-xl bg-[#22242B] border border-[#31343E] text-xs text-[#F2F3F5] space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="refundDeposit"
                    checked={refundDeposit}
                    onChange={(e) => setRefundDeposit(e.target.checked)}
                    className="h-4 w-4 text-[#D46211] rounded border-[#31343E] cursor-pointer"
                  />
                  <label htmlFor="refundDeposit" className="font-semibold cursor-pointer">
                    Reembolsar seña (${booking.depositAmount.toLocaleString('es-AR')})
                  </label>
                </div>
                {refundDeposit && (
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-[11px] text-[#9497A1]">Método de reembolso:</span>
                    <label className="flex items-center gap-1 text-[11px] cursor-pointer text-[#F2F3F5]">
                      <input
                        type="radio"
                        name="refundMethod"
                        checked={refundMethod === 'cash'}
                        onChange={() => setRefundMethod('cash')}
                      />
                      Efectivo
                    </label>
                    <label className="flex items-center gap-1 text-[11px] cursor-pointer text-[#F2F3F5]">
                      <input
                        type="radio"
                        name="refundMethod"
                        checked={refundMethod === 'transfer'}
                        onChange={() => setRefundMethod('transfer')}
                      />
                      Transferencia
                    </label>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#9497A1] mb-1">
                Motivo de cancelación:
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ej: Solicitud del cliente, lluvia, etc."
                className="w-full text-base sm:text-sm rounded-lg border border-[#31343E] bg-[#17181C] px-3 py-2 text-[#F2F3F5] focus:border-red-600 outline-none"
              />
            </div>
          </div>
        }
      />
    </>
  )
}
