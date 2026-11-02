import React, { useState } from 'react'
import { Building2, Landmark, Clock, Settings } from 'lucide-react'
import { useComplexProfile } from '../hooks/useComplex'
import { GeneralInfoTab } from '../components/GeneralInfoTab'
import { BankingInfoTab } from '../components/BankingInfoTab'
import { OperatingHoursTab } from '../components/OperatingHoursTab'

type SettingsTab = 'general' | 'banking' | 'hours'

export const ComplexSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const { data: profile, isLoading, error } = useComplexProfile()

  return (
    <div className="space-y-6 pb-12 text-[#F2F3F5]">
      {/* Cabecera Principal */}
      <section className="bg-[#16181D] border border-[#31343E] rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#31343E]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#9497A1] mb-1">
              <span>Administración</span>
              <span>/</span>
              <span className="text-[#F2F3F5]">Configuración</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#F2F3F5] uppercase font-headline flex items-center gap-2.5">
              <Settings className="h-7 w-7 text-[#327357]" strokeWidth={2} />
              <span>Configuración del Complejo</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#9497A1] mt-1 font-medium">
              Gestioná la identidad institucional, datos de contacto, cuentas bancarias de señas y horarios generales de atención.
            </p>
          </div>
        </div>

        {/* Barra de Pestañas Horizontales */}
        <div className="pt-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-2 cursor-pointer ${
              activeTab === 'general'
                ? 'bg-[#258653] text-white shadow-md shadow-[#258653]/20'
                : 'bg-[#22242B] text-[#9497A1] border border-[#31343E] hover:text-[#F2F3F5] hover:bg-[#2d3039]'
            }`}
          >
            <Building2 className="h-4 w-4" strokeWidth={2} />
            <span>Datos Generales</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('banking')}
            className={`min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-2 cursor-pointer ${
              activeTab === 'banking'
                ? 'bg-[#258653] text-white shadow-md shadow-[#258653]/20'
                : 'bg-[#22242B] text-[#9497A1] border border-[#31343E] hover:text-[#F2F3F5] hover:bg-[#2d3039]'
            }`}
          >
            <Landmark className="h-4 w-4" strokeWidth={2} />
            <span>Cobros y Señas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hours')}
            className={`min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-2 cursor-pointer ${
              activeTab === 'hours'
                ? 'bg-[#258653] text-white shadow-md shadow-[#258653]/20'
                : 'bg-[#22242B] text-[#9497A1] border border-[#31343E] hover:text-[#F2F3F5] hover:bg-[#2d3039]'
            }`}
          >
            <Clock className="h-4 w-4" strokeWidth={2} />
            <span>Horarios de Atención</span>
          </button>
        </div>
      </section>

      {/* Contenido Dinámico de la Pestaña Activa */}
      {isLoading ? (
        <div className="bg-[#16181D] border border-[#31343E] rounded-2xl p-6 sm:p-8 space-y-6 animate-pulse">
          <div className="h-20 bg-[#22242B] rounded-xl" />
          <div className="h-40 bg-[#22242B] rounded-xl" />
        </div>
      ) : error || !profile ? (
        <div className="bg-[#16181D] border border-[#31343E] rounded-2xl p-8 text-center text-red-400 font-mono text-sm">
          No se pudo cargar la información del complejo deportivo. Verifique su sesión o intente más tarde.
        </div>
      ) : (
        <div>
          {activeTab === 'general' && <GeneralInfoTab profile={profile} />}
          {activeTab === 'banking' && <BankingInfoTab profile={profile} />}
          {activeTab === 'hours' && <OperatingHoursTab profile={profile} />}
        </div>
      )}
    </div>
  )
}
