import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { FaqItem } from '../types/landing.types'

const faqItems: FaqItem[] = [
  {
    id: 'faq-1',
    question: '¿Qué pasa si dos personas reservan la misma cancha?',
    answer:
      'MultiSport cuenta con validaciones de concurrencia para impedir reservas superpuestas y mantener tu agenda siempre confiable.',
  },
  {
    id: 'faq-2',
    question: '¿Puedo gestionar distintas disciplinas?',
    answer:
      'Sí. Podés dar de alta canchas exclusivas o de superficie compartida para fútbol (5, 7, 11), pádel, tenis y básquet, asignando franjas horarias y tarifas personalizadas.',
  },
  {
    id: 'faq-3',
    question: '¿Necesito instalar algo en mi complejo?',
    answer:
      'No. MultiSport opera 100% en la nube. Podés utilizarlo de inmediato desde el navegador de cualquier PC, tablet o teléfono móvil sin configuraciones de servidores locales.',
  },
  {
    id: 'faq-4',
    question: '¿Cómo funcionan los torneos?',
    answer:
      'El motor algorítmico sortea y genera automáticamente fixtures para ligas (todos contra todos) y cuadros de playoffs (eliminación directa), calculando tablas de posiciones y cruces en tiempo real.',
  },
]

export const FaqSection: React.FC = () => {
  // Inicialmente abrimos la primera pregunta como en la referencia visual
  const [openId, setOpenId] = useState<string | null>('faq-1')

  const toggleFaq = (id: string) => {
    setOpenId(openId === id ? null : id)
  }

  return (
    <section id="preguntas-frecuentes" className="w-full bg-brand-dark py-20 lg:py-28 border-b border-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Lado Izquierdo: Copywriting */}
          <div className="lg:col-span-5">
            <div className="text-xs font-mono font-bold tracking-widest text-brand-yellow uppercase">
              PREGUNTAS FRECUENTES
            </div>
            
            <h2 className="mt-4 font-black text-4xl sm:text-5xl lg:text-6xl tracking-tighter leading-[1.05] text-white">
              Te lo
              <br />
              hacemos
              <br />
              <span className="text-brand-yellow">simple.</span>
            </h2>
          </div>

          {/* Lado Derecho: Acordeón Interactivo */}
          <div className="lg:col-span-7 flex flex-col divide-y divide-neutral-800">
            {faqItems.map((faq) => {
              const isOpen = openId === faq.id
              return (
                <div key={faq.id} className="py-6 first:pt-0 last:pb-0">
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full flex items-center justify-between gap-4 text-left group transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="text-lg sm:text-xl font-bold text-white group-hover:text-brand-yellow transition-colors">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 text-brand-yellow flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                      strokeWidth={2}
                    />
                  </button>

                  {isOpen && (
                    <div className="mt-3.5 pr-8">
                      <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
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
