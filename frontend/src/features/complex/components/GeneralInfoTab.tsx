import React, { useState, useEffect } from 'react'
import { Building2, Save, Phone, MapPin, Hash, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useUpdateComplexProfile } from '../hooks/useComplex'
import type { ComplexProfile, UpdateComplexProfilePayload } from '../types'

interface GeneralInfoTabProps {
  profile: ComplexProfile
}

export const GeneralInfoTab: React.FC<GeneralInfoTabProps> = ({ profile }) => {
  const updateMutation = useUpdateComplexProfile()

  const [formData, setFormData] = useState<UpdateComplexProfilePayload>({
    name: profile.name || '',
    taxId: profile.taxId || '',
    cbuAlias: profile.cbuAlias || '',
    address: profile.address || '',
    phone: profile.phone || '',
    city: profile.city || '',
    logoUrl: profile.logoUrl || '',
  })

  const [imageError, setImageError] = useState<boolean>(false)

  useEffect(() => {
    setFormData({
      name: profile.name || '',
      taxId: profile.taxId || '',
      cbuAlias: profile.cbuAlias || '',
      address: profile.address || '',
      phone: profile.phone || '',
      city: profile.city || '',
      logoUrl: profile.logoUrl || '',
    })
    setImageError(false)
  }, [profile])

  const initials = (formData.name || 'MS')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('El nombre del complejo es obligatorio.')
      return
    }

    try {
      await updateMutation.mutateAsync({
        ...formData,
        name: formData.name.trim(),
        taxId: formData.taxId?.trim() || undefined,
        cbuAlias: formData.cbuAlias?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        city: formData.city?.trim() || undefined,
        logoUrl: formData.logoUrl?.trim() || undefined,
      })
      toast.success('Datos generales actualizados exitosamente.')
    } catch {
      toast.error('Error al guardar los datos del complejo.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Banner de Identidad y Previsualización de Logo */}
      <div className="bg-[#1E2027] border border-[#31343E] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="relative shrink-0">
          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-2 border-[#31343E] bg-[#16181D] overflow-hidden flex items-center justify-center shadow-lg">
            {formData.logoUrl && !imageError ? (
              <img
                src={formData.logoUrl}
                alt="Logo del complejo"
                className="h-full w-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-2">
                <span className="text-xl sm:text-2xl font-black font-headline text-emerald-400 tracking-wider">
                  {initials || 'MS'}
                </span>
                <span className="text-[10px] font-mono text-[#9497A1] uppercase mt-0.5">Club</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1">
          <h3 className="text-lg font-black text-[#F2F3F5] font-headline uppercase tracking-tight">
            {formData.name || 'Nombre del Complejo'}
          </h3>
          <p className="text-xs text-[#9497A1] font-medium leading-relaxed">
            Esta información se visualiza en los comprobantes de turnos, recibos de seña y en la cabecera del panel administrativo.
          </p>
          <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-2">
            {formData.city && (
              <span className="text-[11px] font-mono text-[#9497A1] bg-[#16181D] px-2.5 py-1 rounded-md border border-[#31343E]">
                {formData.city}
              </span>
            )}
            {formData.phone && (
              <span className="text-[11px] font-mono text-emerald-400 bg-[#258653]/15 px-2.5 py-1 rounded-md border border-[#258653]/30">
                {formData.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Campos de Formulario */}
      <div className="bg-[#1E2027] border border-[#31343E] rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="border-b border-[#31343E] pb-3">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#F2F3F5] flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#327357]" strokeWidth={2} />
            <span>Datos Institucionales y Contacto</span>
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nombre */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-mono uppercase font-bold text-[#9497A1] block">
              Nombre Oficial del Complejo *
            </label>
            <input
              type="text"
              required
              maxLength={150}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Nico Padel Club"
              className="w-full bg-[#16181D] border border-[#31343E] rounded-xl px-4 py-2.5 text-sm text-[#F2F3F5] focus:outline-hidden focus:border-[#258653]"
            />
          </div>

          {/* CUIT */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase font-bold text-[#9497A1] flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-[#327357]" strokeWidth={2} />
              <span>CUIT / Identificación Tributaria</span>
            </label>
            <input
              type="text"
              maxLength={20}
              value={formData.taxId || ''}
              onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
              placeholder="30-12345678-9"
              className="w-full bg-[#16181D] border border-[#31343E] rounded-xl px-4 py-2.5 text-sm font-mono text-[#F2F3F5] focus:outline-hidden focus:border-[#258653]"
            />
          </div>

          {/* Teléfono WhatsApp */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase font-bold text-[#9497A1] flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-[#327357]" strokeWidth={2} />
              <span>Teléfono WhatsApp de Contacto</span>
            </label>
            <input
              type="text"
              maxLength={50}
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+54 9 11 1234-5678"
              className="w-full bg-[#16181D] border border-[#31343E] rounded-xl px-4 py-2.5 text-sm font-mono text-[#F2F3F5] focus:outline-hidden focus:border-[#258653]"
            />
          </div>

          {/* Dirección */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase font-bold text-[#9497A1] flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#327357]" strokeWidth={2} />
              <span>Dirección Física</span>
            </label>
            <input
              type="text"
              maxLength={255}
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Av. Deportistas 1234"
              className="w-full bg-[#16181D] border border-[#31343E] rounded-xl px-4 py-2.5 text-sm text-[#F2F3F5] focus:outline-hidden focus:border-[#258653]"
            />
          </div>

          {/* Ciudad */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase font-bold text-[#9497A1] block">
              Ciudad / Localidad
            </label>
            <input
              type="text"
              maxLength={100}
              value={formData.city || ''}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Córdoba, Argentina"
              className="w-full bg-[#16181D] border border-[#31343E] rounded-xl px-4 py-2.5 text-sm text-[#F2F3F5] focus:outline-hidden focus:border-[#258653]"
            />
          </div>

          {/* URL de Logo */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-mono uppercase font-bold text-[#9497A1] flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-[#327357]" strokeWidth={2} />
              <span>URL del Logo Institucional (Opcional)</span>
            </label>
            <input
              type="url"
              value={formData.logoUrl || ''}
              onChange={(e) => {
                setFormData({ ...formData, logoUrl: e.target.value })
                setImageError(false)
              }}
              placeholder="https://ejemplo.com/logo.png"
              className="w-full bg-[#16181D] border border-[#31343E] rounded-xl px-4 py-2.5 text-sm font-mono text-[#F2F3F5] focus:outline-hidden focus:border-[#258653]"
            />
            <span className="text-[11px] font-mono text-[#9497A1] block">
              Podés ingresar un enlace directo a tu logo en formato PNG o SVG con fondo transparente.
            </span>
          </div>
        </div>

        {/* Botón de Guardado */}
        <div className="pt-4 border-t border-[#31343E] flex justify-end">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#258653] hover:bg-[#1E6E44] text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 transition-colors cursor-pointer shadow-md disabled:opacity-50"
          >
            <Save className="h-4 w-4" strokeWidth={2} />
            <span>{updateMutation.isPending ? 'Guardando...' : 'Guardar Datos Generales'}</span>
          </button>
        </div>
      </div>
    </form>
  )
}
