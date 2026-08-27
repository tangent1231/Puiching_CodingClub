import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { LogOut, Plus, Save, Trash2 } from 'lucide-react'
import { supabase, signOutAdmin } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'open', label: '開放報名' },
  { value: 'closed', label: '已結束' },
]

export default function AdminCompetitions() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [roleChecked, setRoleChecked] = useState(false)
  const [competitions, setCompetitions] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)

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
    loadCompetitions()
  }

  const loadCompetitions = async () => {
    setLoading(true)
    const { data } = await supabase.from('competitions').select('*').order('created_at', { ascending: false })
    setCompetitions(data || [])
    setLoading(false)
  }

  const handleSave = async () => {
    if (!editing) return
    const payload = {
      title: editing.title,
      description: editing.description,
      status: editing.status,
      registration_open_date: editing.registration_open_date,
      registration_close_date: editing.registration_close_date,
      event_date: editing.event_date,
      required_fields: editing.required_fields
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    }

    if (editing.id) {
      await supabase.from('competitions').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('competitions').insert(payload)
    }
    setEditing(null)
    await loadCompetitions()
  }

  const handleDelete = async (id) => {
    if (!confirm('確定刪除此比賽？')) return
    await supabase.from('competitions').delete().eq('id', id)
    await loadCompetitions()
  }

  const handleLogout = async () => {
    await signOutAdmin()
    navigate('/admin/login')
  }

  if (!roleChecked || loading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">載入中...</div>
  }

  return (
    <div className="min-h-screen bg-muted">
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-lg font-bold text-card-foreground">比賽管理</h1>
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
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">比賽列表</h2>
          <button
            type="button"
            onClick={() =>
              setEditing({
                id: '',
                title: '',
                description: '',
                status: 'draft',
                registration_open_date: '',
                registration_close_date: '',
                event_date: '',
                required_fields: 'name,email,school,student_id,grade',
              })
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-[#254aa3]"
          >
            <Plus className="h-4 w-4" />
            新增比賽
          </button>
        </div>

        {editing && (
          <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 font-semibold text-card-foreground">{editing.id ? '編輯比賽' : '新增比賽'}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-card-foreground">標題</label>
                <input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-card-foreground">狀態</label>
                <select
                  value={editing.status}
                  onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-card-foreground">報名開始日期</label>
                <input
                  type="date"
                  value={editing.registration_open_date}
                  onChange={(e) => setEditing({ ...editing, registration_open_date: e.target.value })}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-card-foreground">報名截止日期</label>
                <input
                  type="date"
                  value={editing.registration_close_date}
                  onChange={(e) => setEditing({ ...editing, registration_close_date: e.target.value })}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-card-foreground">比賽日期</label>
                <input
                  type="date"
                  value={editing.event_date}
                  onChange={(e) => setEditing({ ...editing, event_date: e.target.value })}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-card-foreground">必填資料（用逗號分隔）</label>
                <input
                  value={editing.required_fields}
                  onChange={(e) => setEditing({ ...editing, required_fields: e.target.value })}
                  placeholder="name,email,school,student_id,grade"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-card-foreground">描述</label>
                <textarea
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-[#254aa3]"
              >
                <Save className="h-4 w-4" />
                保存
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                取消
              </button>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">標題</th>
                  <th className="px-4 py-3 font-medium">狀態</th>
                  <th className="px-4 py-3 font-medium">報名截止</th>
                  <th className="px-4 py-3 font-medium">必填資料</th>
                  <th className="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {competitions.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium text-card-foreground">{item.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{STATUS_OPTIONS.find((s) => s.value === item.status)?.label || item.status}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.registration_close_date || '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{(item.required_fields || []).join(', ')}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setEditing({
                              ...item,
                              required_fields: (item.required_fields || []).join(', '),
                            })
                          }
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          編輯
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="inline-flex items-center gap-1 text-sm font-medium text-destructive hover:underline"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          刪除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {competitions.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">暫無比賽</p>}
        </div>
      </main>
    </div>
  )
}
