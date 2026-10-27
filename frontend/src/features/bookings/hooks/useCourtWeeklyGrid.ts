import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { bookingsApi } from '../api/bookingsApi'
import { BOOKINGS_QUERY_KEYS } from './useBookings'
import type { DailyGridCourtItem, WeeklyDayData } from '../types'
import { getTodayLocalDateStr } from '../types/timeline.types'

const DAY_NAMES_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MONTH_NAMES_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export const useCourtWeeklyGrid = (selectedCourtId: string | null, startDateStr: string) => {
  // Generar exactamente 7 fechas consecutivas a partir de la fecha base
  const dates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      // Parsear la fecha local de forma segura
      const [y, m, d] = startDateStr.split('-').map(Number)
      const dateObj = new Date(y, m - 1, d)
      dateObj.setDate(dateObj.getDate() + i)

      const year = dateObj.getFullYear()
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
      const day = dateObj.getDate().toString().padStart(2, '0')
      return `${year}-${month}-${day}`
    })
  }, [startDateStr])

  // Ejecución paralela de las 7 consultas con TanStack Query
  const queries = useQueries({
    queries: dates.map((date) => ({
      queryKey: BOOKINGS_QUERY_KEYS.grid(date),
      queryFn: () => bookingsApi.getDailyGrid(date),
      staleTime: 1000 * 30, // 30 segundos de caché fresca
      refetchOnWindowFocus: true,
    })),
  })

  const isLoading = queries.some((q) => q.isLoading)
  const isFetching = queries.some((q) => q.isFetching)

  const refetchAll = () => {
    queries.forEach((q) => q.refetch())
  }

  // Lista unificada de todas las canchas detectadas en la sede
  const allCourts = useMemo<DailyGridCourtItem[]>(() => {
    for (const q of queries) {
      if (q.data?.courts && q.data.courts.length > 0) {
        return q.data.courts
      }
    }
    return []
  }, [queries])

  // Cancha activa seleccionada
  const activeCourt = useMemo<DailyGridCourtItem | null>(() => {
    if (!allCourts.length) return null
    if (selectedCourtId) {
      const found = allCourts.find((c) => c.courtId === selectedCourtId)
      if (found) return found
    }
    return allCourts[0]
  }, [allCourts, selectedCourtId])

  // Consolidar los 7 días de datos para la cancha seleccionada
  const daysData = useMemo<WeeklyDayData[]>(() => {
    const todayStr = getTodayLocalDateStr()

    return dates.map((dateStr, idx) => {
      const queryResult = queries[idx]
      const [y, m, d] = dateStr.split('-').map(Number)
      const dateObj = new Date(y, m - 1, d)

      const dayName = DAY_NAMES_ES[dateObj.getDay()]
      const dayNumber = dateObj.getDate().toString()
      const monthShort = MONTH_NAMES_ES[dateObj.getMonth()]
      const isToday = dateStr === todayStr

      const gridData = queryResult?.data
      const courtData = gridData?.courts?.find(
        (c) => c.courtId === (activeCourt?.courtId || selectedCourtId)
      ) || null

      const bookings = (courtData?.bookings || []).filter((b) => b.status !== 'cancelled')

      const totalIncome = bookings.reduce((sum, b) => {
        // Excluir bloqueos de mantenimiento del cómputo de ingresos
        if (b.status === 'blocked') return sum
        return sum + (b.totalPrice || 0)
      }, 0)

      return {
        dateStr,
        dayName,
        dayNumber,
        monthShort,
        isToday,
        courtData,
        bookings,
        totalIncome,
        bookingsCount: bookings.length,
      }
    })
  }, [dates, queries, activeCourt, selectedCourtId])

  // Métricas acumuladas semanales
  const weeklyMetrics = useMemo(() => {
    let totalIncome = 0
    let totalBookings = 0

    daysData.forEach((day) => {
      totalIncome += day.totalIncome
      totalBookings += day.bookingsCount
    })

    // 16 horas operativas por día = 16 slots de 1 hora potencial por día * 7 días = 112 turnos potenciales máximos
    const maxPotentialBookings = 7 * 16
    const occupancyPercentage = maxPotentialBookings > 0
      ? Math.min(100, Math.round((totalBookings / maxPotentialBookings) * 100))
      : 0

    return {
      totalIncome,
      totalBookings,
      occupancyPercentage,
    }
  }, [daysData])

  return {
    dates,
    daysData,
    activeCourt,
    allCourts,
    weeklyMetrics,
    isLoading,
    isFetching,
    refetchAll,
  }
}
