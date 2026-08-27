import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Calendar, Trophy } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Competitions() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCompetitions()
  }, [])

  const loadCompetitions = async () => {
    const { data } = await supabase
      .from('competitions')
      .select('*')
      .eq('status', 'open')
      .order('registration_close_date', { ascending: true })
    setItems(data || [])
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-muted px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">比賽報名</h1>
            <p className="text-sm text-muted-foreground">選擇比賽並填寫所需資料</p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">載入中...</p>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
            <p className="text-muted-foreground">暫無開放報名的比賽</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Link
                key={item.id}
                to={`/competitions/${item.id}`}
                className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <h2 className="text-lg font-semibold text-card-foreground">{item.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>報名截止：{item.registration_close_date || '待定'}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
