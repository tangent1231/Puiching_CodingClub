import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Save, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function StudentProfile() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [form, setForm] = useState({
    name: '',
    nickname: '',
    student_id: '',
    school: '',
    grade: '',
    email: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/login')
      return
    }
    loadProfile()
  }, [user, authLoading, navigate])

  const loadProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) {
      setForm({
        name: data.name || '',
        nickname: data.nickname || '',
        student_id: data.student_id || '',
        school: data.school || '',
        grade: data.grade || '',
        email: data.email || user.email || '',
      })
    }
    setLoading(false)
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    const { error } = await supabase.from('profiles').update(form).eq('id', user.id)
    if (error) {
      setMessage('保存失敗：' + error.message)
    } else {
      setMessage('資料已更新')
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">載入中...</div>
  }

  return (
    <div className="min-h-screen bg-muted px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-card-foreground">個人資料</h1>
            <p className="text-sm text-muted-foreground">完善資料後可更快完成比賽報名</p>
          </div>
        </div>

        {message && (
          <p className={`mb-4 rounded-lg px-3 py-2 text-sm ${message.startsWith('保存失敗') ? 'bg-destructive/10 text-destructive' : 'bg-green-100 text-green-700'}`}>
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">姓名</label>
              <input name="name" value={form.name} onChange={handleChange} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">Nickname</label>
              <input name="nickname" value={form.nickname} onChange={handleChange} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">學校</label>
              <input name="school" value={form.school} onChange={handleChange} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">學號</label>
              <input name="student_id" value={form.student_id} onChange={handleChange} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">年級</label>
              <input name="grade" value={form.grade} onChange={handleChange} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">電郵</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-[#254aa3] disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? '保存中...' : '保存資料'}
          </button>
        </form>
      </div>
    </div>
  )
}
