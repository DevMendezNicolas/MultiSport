import React from 'react'
import { DailyOperationalCalendar } from '../components/DailyOperationalCalendar'

export const BookingsManagementPage: React.FC = () => {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <DailyOperationalCalendar />
    </div>
  )
}
