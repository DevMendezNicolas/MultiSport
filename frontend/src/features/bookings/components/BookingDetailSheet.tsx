import React, { useState } from 'react'
import {
  Calendar,
  Clock,
  Phone,
  Mail,
  User,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Trash2,
  CreditCard,
  Banknote,
  Building,
  ExternalLink,
  Repeat,
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
} from '../hooks/useBookings'

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
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'card' | 'mercadopago'>('cash')

  // Estados de cancelación
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [refundDeposit, setRefundDeposit] = useState(false)
  const [refundMethod, setRefundMethod] = useState<'cash' | 'transfer'>('cash')

  const recordPaymentMutation = useRecordPayment()
  const cancelBookingMutation = useCancelBooking()

  // Sincronizar monto inicial al abrir formulario de pago
  React.useEffect(() => {
    if (booking) {
      setPaymentAmount(booking.balance > 0 ? booking.balance : 0)
      setShowPaymentForm(false)
      setShowCancelDialog(false)
      setCancelReason('')
      setRefundDeposit(false)
    }
  }, [booking])

  if (!isOpen) return null

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

  return (
    <>
      <Sheet isOpen={isOpen} onClose={onClose} side="right">
        <SheetHeader onClose={onClose}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-700">
              <Calendar className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-950 leading-tight">
                Detalle del Turno
              </h2>
              {booking && (
                <p className="text-sm font-medium text-neutral-700 mt-0.5">
                  {booking.courtName} · {booking.sportName}
                </p>
              )}
            </div>
          </div>
        </SheetHeader>

        <SheetBody className="space-y-6">
          {isLoading || !booking ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          ) : (
            <>
              {/* Badge de Estado y Horario */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-300 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {booking.status === 'confirmed' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                        Confirmado
                      </span>
                    )}
                    {booking.status === 'pending' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <AlertCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
                        Pendiente de Pago
                      </span>
                    )}
                    {booking.status === 'blocked' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-neutral-900 text-white">
                        <ShieldAlert className="h-3.5 w-3.5" strokeWidth={2} />
                        Bloqueo Operativo
                      </span>
                    )}
                    {booking.status === 'cancelled' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                        Cancelado
                      </span>
                    )}

                    {booking.isRecurring && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-200 text-neutral-800">
                        <Repeat className="h-3.5 w-3.5 text-brand-british" strokeWidth={2} />
                        Fijo Semanal
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm font-semibold text-neutral-800">
                  <Clock className="h-4 w-4 text-neutral-700 shrink-0" strokeWidth={2} />
                  <span>
                    {formatDateTime(booking.startTimeUtc).time} a{' '}
                    {formatDateTime(booking.endTimeUtc).time} hs
                  </span>
                  <span className="text-neutral-400">·</span>
                  <span className="capitalize">{formatDateTime(booking.startTimeUtc).date}</span>
                </div>
              </div>

              {/* Datos del Cliente */}
              {booking.status !== 'blocked' && (
                <div className="p-4 rounded-2xl border border-neutral-300 space-y-3">
                  <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                    Información del Cliente
                  </span>

                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <User className="h-4 w-4 text-neutral-600 shrink-0" />
                      <span className="text-base font-bold text-neutral-950">
                        {booking.customerName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Phone className="h-4 w-4 text-neutral-600 shrink-0" />
                        <span className="text-sm font-medium text-neutral-800">{booking.customerPhone}</span>
                      </div>
                      <a
                        href={`https://wa.me/${booking.customerPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-brand-british hover:underline flex items-center gap-1"
                      >
                        <span>WhatsApp</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>

                    {booking.customerEmail && (
                      <div className="flex items-center gap-2.5">
                        <Mail className="h-4 w-4 text-neutral-600 shrink-0" />
                        <span className="text-sm text-neutral-700">{booking.customerEmail}</span>
                      </div>
                    )}
                  </div>

                  {booking.notes && (
                    <div className="mt-2 pt-2 border-t border-neutral-200 text-sm text-neutral-700">
                      <span className="font-bold text-neutral-900">Nota: </span>
                      {booking.notes}
                    </div>
                  )}
                </div>
              )}

              {/* Si es Bloqueo Operativo */}
              {booking.status === 'blocked' && (
                <div className="p-4 rounded-2xl border border-neutral-300 space-y-2">
                  <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                    Motivo del Bloqueo
                  </span>
                  <p className="text-sm font-medium text-neutral-900">{booking.notes || 'Sin observaciones'}</p>
                </div>
              )}

              {/* Resumen Financiero */}
              {booking.status !== 'blocked' && (
                <div className="p-4 rounded-2xl border border-neutral-300 bg-[#FAF8F5] space-y-3">
                  <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                    Estado de Cuenta
                  </span>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-xl bg-white border border-neutral-300">
                      <span className="text-xs font-bold text-neutral-700 block">Total</span>
                      <span className="text-base font-black text-neutral-950 font-mono">
                        ${booking.totalPrice.toLocaleString('es-AR')}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-neutral-300">
                      <span className="text-xs font-bold text-neutral-700 block">Abonado</span>
                      <span className="text-base font-black text-brand-british font-mono">
                        ${booking.depositAmount.toLocaleString('es-AR')}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-neutral-300">
                      <span className="text-xs font-bold text-neutral-700 block">Saldo</span>
                      <span
                        className={`text-base font-black font-mono ${
                          booking.balance > 0 ? 'text-amber-800' : 'text-neutral-700'
                        }`}
                      >
                        ${booking.balance.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>

                  {/* Botón / Formulario para cobrar saldo */}
                  {booking.status !== 'cancelled' && booking.balance > 0 && (
                    <div className="pt-2">
                      {!showPaymentForm ? (
                        <button
                          type="button"
                          onClick={() => setShowPaymentForm(true)}
                          className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#258653] hover:bg-[#1E6E44] transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                          <DollarSign className="h-4 w-4" strokeWidth={2} />
                          <span>Cobrar Saldo Pendiente (${booking.balance.toLocaleString('es-AR')})</span>
                        </button>
                      ) : (
                        <form onSubmit={handleRecordPayment} className="p-3.5 rounded-xl bg-white border border-neutral-300 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-900">
                              Registrar Pago de Saldo
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowPaymentForm(false)}
                              className="text-xs text-neutral-500 hover:text-neutral-900 cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>

                          <div>
                            <label className="block text-xs text-neutral-600 mb-1">Monto a Cobrar</label>
                            <input
                              type="number"
                              min="1"
                              max={booking.balance}
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(Number(e.target.value))}
                              className="w-full text-base sm:text-sm rounded-lg border border-neutral-300 px-3 py-1.5 text-neutral-900 focus:border-[#258653] focus:ring-1 focus:ring-[#258653] outline-hidden"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { id: 'cash', label: 'Efectivo', icon: Banknote },
                              { id: 'transfer', label: 'Transfer.', icon: Building },
                              { id: 'card', label: 'Tarjeta', icon: CreditCard },
                              { id: 'mercadopago', label: 'MP', icon: DollarSign },
                            ].map((item) => {
                              const Icon = item.icon
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => setPaymentMethod(item.id as typeof paymentMethod)}
                                  className={`flex items-center gap-1.5 p-2 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                                    paymentMethod === item.id
                                      ? 'border-[#258653] bg-[#258653]/10 text-[#1E6E44]'
                                      : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                                  }`}
                                >
                                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                                  <span>{item.label}</span>
                                </button>
                              )
                            })}
                          </div>

                          <button
                            type="submit"
                            disabled={recordPaymentMutation.isPending}
                            className="w-full py-2 rounded-lg text-xs font-semibold text-white bg-[#258653] hover:bg-[#1E6E44] transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {recordPaymentMutation.isPending ? 'Registrando...' : 'Confirmar Cobro'}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Historial de Transacciones (Ledger Inmutable) */}
              {booking.payments && booking.payments.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
                    Historial de Pagos y Reembolsos
                  </span>

                  <div className="space-y-1.5">
                    {booking.payments.map((p) => (
                      <div
                        key={p.id}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                          p.paymentType === 'refund'
                            ? 'border-red-200 bg-red-50 text-red-800'
                            : 'border-neutral-200 bg-white text-neutral-800'
                        }`}
                      >
                        <div>
                          <div className="font-semibold capitalize">
                            {p.paymentType === 'refund' ? 'Reembolso' : `Pago ${p.paymentType}`} ({p.paymentMethod})
                          </div>
                          <div className="text-neutral-500 text-[11px]">
                            {new Date(p.createdAt).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {p.notes && ` · ${p.notes}`}
                          </div>
                        </div>
                        <div className="font-bold text-sm">
                          {p.amount < 0
                            ? `- $${Math.abs(p.amount).toLocaleString('es-AR')}`
                            : `+ $${p.amount.toLocaleString('es-AR')}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </SheetBody>

        <SheetFooter className="justify-between">
          {booking && booking.status !== 'cancelled' ? (
            <button
              type="button"
              onClick={() => setShowCancelDialog(true)}
              className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" strokeWidth={2} />
              <span>{booking.status === 'blocked' ? 'Levantar Bloqueo' : 'Cancelar Reserva'}</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2.5 rounded-xl border border-neutral-300 text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </SheetFooter>
      </Sheet>

      {/* Dialogo Centrado de Confirmación Destructiva (Regla 13 de AGENTS.md) */}
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
            <p>
              ¿Está seguro de que desea cancelar esta reserva en{' '}
              <strong className="text-neutral-900">{booking?.courtName}</strong>?
            </p>

            {booking && booking.depositAmount > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="refundDeposit"
                    checked={refundDeposit}
                    onChange={(e) => setRefundDeposit(e.target.checked)}
                    className="h-4 w-4 text-[#258653] rounded border-neutral-300 cursor-pointer"
                  />
                  <label htmlFor="refundDeposit" className="font-semibold cursor-pointer">
                    Reembolsar seña ($ {booking.depositAmount.toLocaleString('es-AR')})
                  </label>
                </div>
                {refundDeposit && (
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-[11px] text-amber-800">Método de reembolso:</span>
                    <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                      <input
                        type="radio"
                        name="refundMethod"
                        checked={refundMethod === 'cash'}
                        onChange={() => setRefundMethod('cash')}
                      />
                      Efectivo
                    </label>
                    <label className="flex items-center gap-1 text-[11px] cursor-pointer">
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
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Motivo de cancelación:
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ej: Solicitud del cliente, lluvia, etc."
                className="w-full text-sm rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-hidden"
              />
            </div>
          </div>
        }
      />
    </>
  )
}
