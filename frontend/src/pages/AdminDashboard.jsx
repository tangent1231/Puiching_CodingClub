import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Eye, EyeOff, LogOut, Shield } from 'lucide-react'
import { supabase, signOutAdmin } from '../lib/supabase'
import { api } from '../api/client'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [awards, setAwards] = useState([])
  const [awardsLoading, setAwardsLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

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

  useEffect(() => {
    if (!loading) {
      loadAwards()
    }
  }, [loading])

  const loadAwards = async () => {
    try {
      setAwardsLoading(true)
      const data = await api.getAllAwardsForReview()
      setAwards(data)
    } catch (err) {
      console.error(err)
    } finally {
      setAwardsLoading(false)
    }
  }

  const toggleVisibility = async (recordId, visible) => {
    try {
      setUpdating(recordId)
      await api.updateAwardVisibility(recordId, visible)
      setAwards((prev) =>
        prev.map((item) => (item.record_id === recordId ? { ...item, visible } : item))
      )
    } catch (err) {
      console.error(err)
      alert('更新失敗：' + err.message)
    } finally {
      setUpdating(null)
    }
  }

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

  const pending = awards.filter((a) => !a.visible)
  const visible = awards.filter((a) => a.visible)

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
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">待審核記錄</p>
            <p className="mt-1 text-3xl font-bold text-card-foreground">{pending.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">已顯示記錄</p>
            <p className="mt-1 text-3xl font-bold text-card-foreground">{visible.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">總記錄數</p>
            <p className="mt-1 text-3xl font-bold text-card-foreground">{awards.length}</p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-4 sm:px-6">
            <h2 className="text-lg font-semibold text-card-foreground">獲獎記錄審核</h2>
            <p className="text-sm text-muted-foreground">新提交的記錄預設不會顯示，請在此處審核後放行。</p>
          </div>

          {awardsLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">載入中...</div>
          ) : awards.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">暫無記錄</div>
          ) : (
            <div className="divide-y divide-border">
              {awards.map((item) => (
                <div
                  key={item.record_id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-card-foreground">{item.name}</p>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          item.visible
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {item.visible ? '已顯示' : '待審核'}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {item.class_name || '班級未填'} · {item.competition} · {item.award}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.date || '日期未填'}</p>
                  </div>
                  <button
                    type="button"
                    disabled={updating === item.record_id}
                    onClick={() => toggleVisibility(item.record_id, !item.visible)}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      item.visible
                        ? 'border border-border bg-background text-foreground hover:bg-muted'
                        : 'bg-primary text-primary-foreground hover:bg-[#254aa3]'
                    }`}
                  >
                    {item.visible ? (
                      <>
                        <EyeOff className="h-4 w-4" />
                        隱藏
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        顯示
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
