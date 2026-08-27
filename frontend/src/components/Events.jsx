import { useEffect, useState } from 'react'
import { Calendar, CalendarClock, Megaphone } from 'lucide-react'
import { api } from '../api/client'

const statusConfig = {
  報名進行中: { color: 'text-[#c41e2a]', icon: CalendarClock },
  即將舉行: { color: 'text-[#c8a145]', icon: Calendar },
}

export default function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getEvents()
      .then(setEvents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="events-section" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Megaphone className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">活動公告</h2>
          <p className="text-sm text-muted-foreground">最新比賽與報名資訊</p>
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground">載入中...</p>}
      {error && <p className="text-sm text-destructive">載入失敗：{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => {
          const config = statusConfig[event.status] || { color: 'text-muted-foreground', icon: Calendar }
          const Icon = config.icon
          return (
            <article
              key={event.record_id}
              className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${config.color}`}>
                    {event.status}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-card-foreground">{event.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{event.description || event.date}</p>
                </div>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
