import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster, toast } from 'sonner'
import { 
  Calendar, 
  Trophy, 
  MapPin, 
  ShieldCheck, 
  Activity, 
  ArrowRight,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

function DashboardContent() {
  const handleTestToast = () => {
    toast.success('MultiSport frontend initialized successfully', {
      description: 'Connected with React 18+, TanStack Query, and Tailwind CSS.',
    })
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-neutral-100 text-neutral-950 flex items-center justify-center font-bold tracking-tight">
            MS
          </div>
          <div>
            <h1 className="font-semibold tracking-tight text-base">MultiSport</h1>
            <p className="text-xs text-neutral-400">Sports Complex Management Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-neutral-800 bg-neutral-900 text-xs text-neutral-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>API Online (v1)</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleTestToast}
            className="border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white"
          >
            <Activity className="h-4 w-4 mr-2" strokeWidth={2} />
            Test Toast
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 flex flex-col gap-10">
        {/* Hero Section */}
        <section className="flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1 rounded-full w-fit">
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
            <span>Commercial-Ready Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Frontend Workspace Scaffold
          </h2>
          <p className="text-neutral-400 max-w-2xl text-base leading-relaxed">
            Modular client structured under Feature-Driven Architecture, strictly synchronized with .NET 8 Minimal APIs, Dapper, and PostgreSQL.
          </p>
        </section>

        {/* Feature Modules Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Courts Feature */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 flex flex-col justify-between hover:border-neutral-700 transition-colors">
            <div className="flex flex-col gap-3">
              <div className="h-10 w-10 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-200">
                <MapPin className="h-5 w-5" strokeWidth={2} />
              </div>
              <h3 className="font-semibold text-lg text-white">Courts Infrastructure</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Dynamic court parametrization, multi-sport discipline configuration, and hourly rate schemes.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-400">
              <span className="font-mono">src/features/courts</span>
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </div>
          </div>

          {/* Bookings Feature */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 flex flex-col justify-between hover:border-neutral-700 transition-colors">
            <div className="flex flex-col gap-3">
              <div className="h-10 w-10 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-200">
                <Calendar className="h-5 w-5" strokeWidth={2} />
              </div>
              <h3 className="font-semibold text-lg text-white">Booking Operations</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Weekly reservation timeline grid, deposit forfeiture policies, and PostgreSQL GiST collision prevention.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-400">
              <span className="font-mono">src/features/bookings</span>
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </div>
          </div>

          {/* Tournaments Feature */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 flex flex-col justify-between hover:border-neutral-700 transition-colors">
            <div className="flex flex-col gap-3">
              <div className="h-10 w-10 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-200">
                <Trophy className="h-5 w-5" strokeWidth={2} />
              </div>
              <h3 className="font-semibold text-lg text-white">Tournament Engine</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Algorithmic Round-Robin draws, interactive playoff brackets, and real-time standings calculations.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-400">
              <span className="font-mono">src/features/tournaments</span>
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </div>
          </div>
        </section>

        {/* Quality Standards Summary */}
        <section className="rounded-xl border border-neutral-800 bg-neutral-900/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-neutral-400" strokeWidth={2} />
            <div>
              <p className="text-sm font-medium text-white">All timestamps normalized to UTC</p>
              <p className="text-xs text-neutral-400">Presentation layer handles local timezone conversion automatically</p>
            </div>
          </div>
          <div className="text-xs font-mono text-neutral-500">
            Tailwind CSS + shadcn/ui + TanStack Query
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800 py-6 px-6 text-center text-xs text-neutral-500">
        MultiSport Platform &bull; Feature-Driven Architecture &bull; All rights reserved
      </footer>

      {/* Sonner Toast Notification Center */}
      <Toaster position="top-right" theme="dark" richColors />
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardContent />
    </QueryClientProvider>
  )
}

export default App
