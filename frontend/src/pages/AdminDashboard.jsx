import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { LogOut, Shield } from 'lucide-react'
import { supabase, signOutAdmin } from '../lib/supabase'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error || !data.session) {
        navigate('/admin/login')
        return
      }
      setUser(data.session.user)
      setLoading(false)
    }

    checkSession()

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/admin/login')
      } else {
        setUser(session.user)
      }
    })

    return () => {
      listener?.subscription?.unsubscribe()
    }
  }, [navigate])

  const handleLogout = async () => {
    await signOutAdmin()
    navigate('/admin/login')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <p className="text-sm text-muted-foreground">載入中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted">
      <header className="border-b border-border bg-card px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-card-foreground">管理後台</h1>
              <p className="text-xs text-muted-foreground">資源中心</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user?.email}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">登出</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-card-foreground">歡迎回來</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            後台管理功能尚未開放，未來將在此處提供表單編輯、數據統計與內容管理。
          </p>
        </div>
      </main>
    </div>
  )
}
