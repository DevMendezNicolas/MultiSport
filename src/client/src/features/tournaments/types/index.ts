export interface TournamentResponse {
  id: string
  name: string
  format: 'round_robin' | 'playoffs' | 'combined'
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
  createdBy: string | null
}

export interface StandingRow {
  teamId: string
  teamName: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}
