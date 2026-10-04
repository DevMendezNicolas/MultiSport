import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LandingNavbar } from './components/LandingNavbar'
import { HeroSection } from './components/HeroSection'
import { SportsTicker } from './components/SportsTicker'
import { SimpleWorkflowSection } from './components/SimpleWorkflowSection'
import { OperationsSection } from './components/OperationsSection'
import { SportsEcosystemSection } from './components/SportsEcosystemSection'
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
    <div className="min-h-screen bg-brand-dark text-neutral-50 flex flex-col font-sans selection:bg-brand-red selection:text-white">
      {/* Barra de Navegación Superior */}
      <LandingNavbar />

      {/* Flujo de Secciones Principales */}
      <main className="flex-1 flex flex-col">
        {/* 1. Hero Section (Obsidian Dark + Acento Rojo Deportivo) */}
        <HeroSection onOpenDemo={handleOpenDemo} />

        {/* 2. Ticker de Disciplinas (Cinta de Transición en Crema Cálido) */}
        <SportsTicker />

        {/* 3. Sección 1 — Cómo Funciona (Crema Cálido / 4 Pasos Visuales) */}
        <SimpleWorkflowSection onOpenDemo={handleOpenDemo} />

        {/* 4. Sección 2 — Funcionalidades (Obsidian Dark / Bento Grid Operativo) */}
        <OperationsSection />

        {/* 5. Sección 3 — Deportes y Operación (Ecosistema Multidisciplina) */}
        <SportsEcosystemSection />

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
