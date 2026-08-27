import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { LogOut } from 'lucide-react'
import { supabase, signOutAdmin } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function AdminRegistrations() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [roleChecked, setRoleChecked] = useState(false)
  const [registrations, setRegistrations] = useState([])
  const [competitions, setCompetitions] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/admin/login')
      return
    }
    checkRole()
  }, [user, authLoading, navigate])

  const checkRole = async () => {
    const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single()
    if (data?.role !== 'admin') {
      navigate('/admin/login')
      return
    }
    setRoleChecked(true)
    loadData()
  }

  const loadData = async () => {
    setLoading(true)
    const [{ data: regs }, { data: comps }, { data: profs }] = await Promise.all([
      supabase.from('registrations').select('*').order('created_at', { ascending: false }),
      supabase.from('competitions').select('id, title'),
      supabase.from('profiles').select('id, name, email, school, student_id, grade'),
    ])
    setRegistrations(regs || [])
    setCompetitions(comps || [])
    setProfiles(profs || [])
    setLoading(false)
  }

  const handleLogout = async () => {
    await signOutAdmin()
    navigate('/admin/login')
  }

  const getCompetitionTitle = (id) => competitions.find((c) => c.id === id)?.title || id
  const getProfile = (userId) => profiles.find((p) => p.id === userId)

  if (!roleChecked || loading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">載入中...</div>
  }

  return (
    <div className="min-h-screen bg-muted">
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-lg font-bold text-card-foreground">報名記錄</h1>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
            登出
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">比賽</th>
                  <th className="px-4 py-3 font-medium">姓名</th>
                  <th className="px-4 py-3 font-medium">學校 / 學號 / 年級</th>
                  <th className="px-4 py-3 font-medium">額外資料</th>
                  <th className="px-4 py-3 font-medium">狀態</th>
                  <th className="px-4 py-3 font-medium">提交時間</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {registrations.map((item) => {
                  const profile = getProfile(item.user_id)
                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-medium text-card-foreground">{getCompetitionTitle(item.competition_id)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{profile?.name || '-'}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {profile?.school || '-'} / {profile?.student_id || '-'} / {profile?.grade || '-'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(item.form_data, null, 2)}</pre>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{item.status}</td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(item.created_at).toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {registrations.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">暫無報名記錄</p>}
        </div>
      </main>
    </div>
  )
}
