import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Download, Filter, LogOut } from 'lucide-react'
import { supabase, signOutAdmin } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const STATUS_BADGES = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-600',
}

const STATUS_LABELS = {
  pending: '待確認',
  confirmed: '已確認',
  cancelled: '已取消',
}

const ALL_FIELDS = ['name', 'nickname', 'email', 'school', 'student_id', 'grade']

export default function AdminRegistrations() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [roleChecked, setRoleChecked] = useState(false)
  const [registrations, setRegistrations] = useState([])
  const [competitions, setCompetitions] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCompetition, setFilterCompetition] = useState('')

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

  const filteredRegistrations = useMemo(() => {
    if (!filterCompetition) return registrations
    return registrations.filter((r) => r.competition_id === filterCompetition)
  }, [registrations, filterCompetition])

  const exportCsv = () => {
    const rows = filteredRegistrations.map((item) => {
      const profile = getProfile(item.user_id)
      const formData = item.form_data || {}
      return {
        比賽: getCompetitionTitle(item.competition_id),
        姓名: profile?.name || formData.name || '',
        Nickname: profile?.nickname || formData.nickname || '',
        電郵: profile?.email || formData.email || '',
        學校: profile?.school || formData.school || '',
        學號: profile?.student_id || formData.student_id || '',
        年級: profile?.grade || formData.grade || '',
        ...Object.fromEntries(
          Object.entries(formData).filter(([key]) => !ALL_FIELDS.includes(key))
            .map(([key, value]) => [`額外_${key}`, value])
        ),
        狀態: STATUS_LABELS[item.status] || item.status,
        提交時間: item.created_at,
      }
    })

    if (rows.length === 0) {
      alert('沒有可匯出的報名記錄')
      return
    }

    const headers = Object.keys(rows[0])
    const escape = (value) => {
      const str = value == null ? '' : String(value)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }
    const csv = [
      headers.join(','),
      ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `報名記錄_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

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
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>共 {filteredRegistrations.length} 筆記錄</span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={filterCompetition}
              onChange={(e) => setFilterCompetition(e.target.value)}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">所有比賽</option>
              {competitions.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-[#254aa3]"
            >
              <Download className="h-4 w-4" />
              匯出 CSV
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">比賽</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">姓名</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">電郵</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">學校 / 學號 / 年級</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Nickname</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">額外資料</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">狀態</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">提交時間</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRegistrations.map((item) => {
                  const profile = getProfile(item.user_id)
                  const formData = item.form_data || {}
                  const extraFields = Object.entries(formData).filter(([key]) => !ALL_FIELDS.includes(key))
                  return (
                    <tr key={item.id}>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-card-foreground">{getCompetitionTitle(item.competition_id)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{profile?.name || formData.name || '-'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{profile?.email || formData.email || '-'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {profile?.school || formData.school || '-'} / {profile?.student_id || formData.student_id || '-'} / {profile?.grade || formData.grade || '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{profile?.nickname || formData.nickname || '-'}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {extraFields.length > 0 ? (
                          <ul className="space-y-0.5 text-xs">
                            {extraFields.map(([key, value]) => (
                              <li key={key}>
                                <span className="font-medium">{key}:</span> {String(value)}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`rounded-md px-2 py-1 text-xs font-medium ${STATUS_BADGES[item.status] || 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABELS[item.status] || item.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{new Date(item.created_at).toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filteredRegistrations.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">暫無報名記錄</p>}
        </div>
      </main>
    </div>
  )
}
