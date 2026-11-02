import React, { useState, useEffect } from 'react'
import { Landmark, Save, Copy, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useUpdateComplexProfile } from '../hooks/useComplex'
import type { ComplexProfile, UpdateComplexProfilePayload } from '../types'

interface BankingInfoTabProps {
  profile: ComplexProfile
}

export const BankingInfoTab: React.FC<BankingInfoTabProps> = ({ profile }) => {
  const updateMutation = useUpdateComplexProfile()

  const [cbuAlias, setCbuAlias] = useState<string>(profile.cbuAlias || '')
  const [copied, setCopied] = useState<boolean>(false)

  useEffect(() => {
    setCbuAlias(profile.cbuAlias || '')
  }, [profile])

  const handleCopyAlias = () => {
    if (!cbuAlias) return
    navigator.clipboard.writeText(cbuAlias)
    setCopied(true)
    toast.success('Alias copiado al portapapeles.')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload: UpdateComplexProfilePayload = {
      name: profile.name,
      taxId: profile.taxId,
      cbuAlias: cbuAlias.trim() || undefined,
      address: profile.address,
      phone: profile.phone,
      city: profile.city,
      logoUrl: profile.logoUrl,
    }

    try {
      await updateMutation.mutateAsync(payload)
      toast.success('Datos bancarios actualizados correctamente.')
    } catch {
      toast.error('Error al actualizar los datos bancarios.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tarjeta de Alias y CBU */}
      <div className="bg-[#1E2027] border border-[#31343E] rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="border-b border-[#31343E] pb-3">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#F2F3F5] flex items-center gap-2">
            <Landmark className="h-4 w-4 text-[#327357]" strokeWidth={2} />
            <span>Cobros de Señas y Cuentas Bancarias</span>
          </h4>
          <p className="text-xs text-[#9497A1] mt-1 font-medium">
            Configurá el Alias o CBU/CVU institucional para recibir pagos y transferencias bancarias de tus clientes.
          </p>
        </div>

        <div className="max-w-xl space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase font-bold text-[#9497A1] block">
              Alias de CBU / CVU para Transferencias
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={50}
                value={cbuAlias}
                onChange={(e) => setCbuAlias(e.target.value)}
                placeholder="ej: nicopadel.club.mp o 00000031000100..."
                className="flex-1 bg-[#16181D] border border-[#31343E] rounded-xl px-4 py-2.5 text-sm font-mono text-[#F2F3F5] focus:outline-hidden focus:border-[#258653]"
              />
              {cbuAlias && (
                <button
                  type="button"
                  onClick={handleCopyAlias}
                  className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#22242B] border border-[#31343E] hover:bg-[#2d3039] text-[#9497A1] hover:text-[#F2F3F5] text-xs font-mono font-bold uppercase inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Copiar alias"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <span className="text-[11px] font-mono text-[#9497A1] block">
              Este Alias se compartirá automáticamente a los clientes para el abono de la seña al registrar reservas.
            </span>
          </div>
        </div>

        {/* Panel de Buenas Prácticas Financieras */}
        <div className="bg-[#16181D] border border-[#31343E] rounded-xl p-4 space-y-2 text-xs text-[#9497A1]">
          <div className="flex items-center gap-2 font-bold text-[#F2F3F5]">
            <AlertCircle className="h-4 w-4 text-[#327357] shrink-0" strokeWidth={2} />
            <span className="font-mono uppercase tracking-wider">Acreditación Inmediata</span>
          </div>
          <p className="leading-relaxed">
            Recordá que los comprobantes de seña ingresados en la app se registran en los libros contables del complejo. Mantené tu CBU/Alias actualizado para evitar transferencias a cuentas erróneas.
          </p>
        </div>

        {/* Botón de Guardado */}
        <div className="pt-4 border-t border-[#31343E] flex justify-end">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#258653] hover:bg-[#1E6E44] text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 transition-colors cursor-pointer shadow-md disabled:opacity-50"
          >
            <Save className="h-4 w-4" strokeWidth={2} />
            <span>{updateMutation.isPending ? 'Guardando...' : 'Guardar Datos Bancarios'}</span>
          </button>
        </div>
      </div>
    </form>
  )
}
