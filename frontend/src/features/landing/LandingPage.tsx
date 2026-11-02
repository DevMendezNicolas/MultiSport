import React, { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LandingNavbar } from './components/LandingNavbar'
import { HeroSection } from './components/HeroSection'
import { SportsTicker } from './components/SportsTicker'
import { OperationsSection } from './components/OperationsSection'
import { SimpleWorkflowSection } from './components/SimpleWorkflowSection'
import { TeamBannerSection } from './components/TeamBannerSection'
import { FaqSection } from './components/FaqSection'
import { FinalCtaSection } from './components/FinalCtaSection'
import { DemoContactSection } from './components/DemoContactSection'
import { LandingFooter } from './components/LandingFooter'

export const LandingPage: React.FC = () => {
  const [searchParams] = useSearchParams()

  const handleScrollToDemo = () => {
    const el = document.getElementById('solicitar-demo')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
      const firstInput = el.querySelector('input')
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 400)
      }
    }
  }

  useEffect(() => {
    if (searchParams.get('demo') === 'true') {
      handleScrollToDemo()
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-[#17181C] text-[#F2F3F5] flex flex-col font-body selection:bg-[#D46211] selection:text-white">
      {/* Barra de Navegación Superior */}
      <LandingNavbar />

      {/* Flujo de Secciones Principales */}
      <main className="flex-1 flex flex-col">
        {/* 1. Hero Section (Obsidian Dark + Acento Amarillo) */}
        <HeroSection onOpenDemo={handleScrollToDemo} />

        {/* 2. Ticker de Disciplinas (Cinta en Crema Cálido) */}
        <SportsTicker />

        {/* 3. Operaciones & Módulos 01/02/03 (Obsidian Dark) */}
        <OperationsSection />

        {/* 4. Workflow "Así de Simple" (Crema Cálido) */}
        <SimpleWorkflowSection onOpenDemo={handleScrollToDemo} />

        {/* 5. Statement de Marca "Tu complejo es un equipo" (Amarillo Deportivo) */}
        <TeamBannerSection />

        {/* 6. Preguntas Frecuentes (Obsidian Dark) */}
        <FaqSection />

        {/* 7. CTA Final & Detalle de Pádel (Crema Cálido) */}
        <FinalCtaSection onOpenDemo={handleScrollToDemo} />

        {/* 8. Sección Embebida de Captura de Leads / Solicitud de Demo */}
        <DemoContactSection />
      </main>

      {/* Pie de Página */}
      <LandingFooter />
    </div>
  )
}

