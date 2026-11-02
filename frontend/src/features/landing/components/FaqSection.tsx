import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { FaqItem } from '../types/landing.types'

const faqItems: FaqItem[] = [
  {
    id: 'faq-1',
    question: '¿Qué pasa si dos personas reservan la misma cancha?',
    answer:
      'MultiSport cuenta con validaciones de concurrencia y exclusión a nivel de base de datos para impedir reservas superpuestas y mantener tu agenda siempre confiable.',
  },
  {
    id: 'faq-2',
    question: '¿Puedo gestionar distintas disciplinas en simultáneo?',
    answer:
      'Sí. Podés dar de alta canchas exclusivas o de superficie compartida para fútbol (5, 7, 11), pádel, tenis y básquet, asignando franjas horarias y tarifas personalizadas.',
  },
  {
    id: 'faq-3',
    question: '¿Necesito instalar software en mi complejo?',
    answer:
      'No. MultiSport opera 100% en la nube. Podés utilizarlo de inmediato desde el navegador de cualquier PC, tablet o teléfono móvil sin configuraciones de servidores locales.',
  },
  {
    id: 'faq-4',
    question: '¿Cómo funciona el motor de torneos?',
    answer:
      'El motor algorítmico genera automáticamente fixtures para ligas (todos contra todos) y cuadros de playoffs (eliminación directa), calculando tablas de posiciones y cruces en tiempo real.',
  },
]

export const FaqSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>('faq-1')

  const toggleFaq = (id: string) => {
    setOpenId(openId === id ? null : id)
  }

  return (
    <section id="preguntas-frecuentes" className="w-full bg-[#17181C] py-16 lg:py-24 border-b border-[#31343E] font-body">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Lado Izquierdo: Copywriting */}
          <div className="lg:col-span-5">
            <div className="text-xs font-mono font-bold tracking-widest text-[#D46211] uppercase">
              PREGUNTAS FRECUENTES
            </div>
            
            <h2 className="mt-3 font-headline text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.05] text-[#F2F3F5]">
              Te lo
              <br />
              hacemos
              <br />
              <span className="text-[#D46211]">simple.</span>
            </h2>
          </div>

          {/* Lado Derecho: Acordeón Interactivo */}
          <div className="lg:col-span-7 flex flex-col divide-y divide-[#31343E]">
            {faqItems.map((faq) => {
              const isOpen = openId === faq.id
              return (
                <div key={faq.id} className="py-6 first:pt-0 last:pb-0">
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full flex items-center justify-between gap-4 text-left group transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D46211] rounded-lg py-1 cursor-pointer"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${faq.id}`}
                  >
                    <span className="text-base sm:text-lg font-bold text-[#F2F3F5] group-hover:text-[#D46211] transition-colors">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 text-[#D46211] flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                      strokeWidth={2}
                    />
                  </button>

                  {isOpen && (
                    <div
                      id={`faq-answer-${faq.id}`}
                      className="mt-3 pr-8 animate-in fade-in slide-in-from-top-1 duration-200"
                    >
                      <p className="text-sm sm:text-base text-[#9497A1] leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

        </div>
      </div>
    </section>
  )
}
