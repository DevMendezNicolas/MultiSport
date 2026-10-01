import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LandingNavbar } from './components/LandingNavbar'
import { HeroSection } from './components/HeroSection'
import { SportsTicker } from './components/SportsTicker'
import { OperationsSection } from './components/OperationsSection'
import { SimpleWorkflowSection } from './components/SimpleWorkflowSection'
import { TeamBannerSection } from './components/TeamBannerSection'
import { FaqSection } from './components/FaqSection'
import { FinalCtaSection } from './components/FinalCtaSection'
import { LandingFooter } from './components/LandingFooter'
import { DemoRequestModal } from './components/DemoRequestModal'

export const LandingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(
    () => searchParams.get('demo') === 'true'
  )

  const handleOpenDemo = () => {
    setIsDemoModalOpen(true)
  }

  const handleCloseDemo = () => {
    setIsDemoModalOpen(false)
    if (searchParams.get('demo')) {
      searchParams.delete('demo')
      setSearchParams(searchParams, { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark text-neutral-50 flex flex-col font-sans selection:bg-brand-yellow selection:text-neutral-950">
      {/* Barra de Navegación Superior */}
      <LandingNavbar />

      {/* Flujo de Secciones Principales */}
      <main className="flex-1 flex flex-col">
        {/* 1. Hero Section (Obsidian Dark + Acento Amarillo) */}
        <HeroSection onOpenDemo={handleOpenDemo} />

        {/* 2. Ticker de Disciplinas (Cinta en Crema Cálido) */}
        <SportsTicker />

        {/* 3. Operaciones & Módulos 01/02/03 (Obsidian Dark) */}
        <OperationsSection />

        {/* 4. Workflow "Así de Simple" (Crema Cálido) */}
        <SimpleWorkflowSection onOpenDemo={handleOpenDemo} />

        {/* 5. Statement de Marca "Tu complejo es un equipo" (Amarillo Deportivo) */}
        <TeamBannerSection />

        {/* 6. Preguntas Frecuentes (Obsidian Dark) */}
        <FaqSection />

        {/* 7. CTA Final & Detalle de Pádel (Crema Cálido) */}
        <FinalCtaSection onOpenDemo={handleOpenDemo} />
      </main>

      {/* Pie de Página */}
      <LandingFooter />

      {/* Diálogo Modal de Captura de Leads / Demo */}
      <DemoRequestModal
        isOpen={isDemoModalOpen}
        onClose={handleCloseDemo}
      />
    </div>
  )
}
