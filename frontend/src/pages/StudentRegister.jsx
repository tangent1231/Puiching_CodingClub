import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { UserPlus } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function StudentRegister() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    nickname: '',
    student_id: '',
    school: '',
    grade: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    const user = data.user
    if (user) {
      await supabase.from('profiles').insert({
        id: user.id,
        email: form.email,
        name: form.name,
        nickname: form.nickname,
        student_id: form.student_id,
        school: form.school,
        grade: form.grade,
      })
      await supabase.from('user_roles').insert({ user_id: user.id, role: 'student' })
    }

    navigate('/profile')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-muted px-4 py-10">
      <div className="mx-auto w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-card-foreground">學生註冊</h1>
          <p className="mt-1 text-sm text-muted-foreground">填寫基本資料即可報名比賽</p>
        </div>

        {error && <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">電郵 *</label>
              <input name="email" type="email" required value={form.email} onChange={handleChange} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">密碼 *</label>
              <input name="password" type="password" required minLength={6} value={form.password} onChange={handleChange} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">姓名 *</label>
              <input name="name" required value={form.name} onChange={handleChange} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">Nickname</label>
              <input name="nickname" value={form.nickname} onChange={handleChange} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">學校 *</label>
              <input name="school" required value={form.school} onChange={handleChange} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">學號 *</label>
              <input name="student_id" required value={form.student_id} onChange={handleChange} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">年級 *</label>
              <input name="grade" required value={form.grade} onChange={handleChange} placeholder="例如：F5" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-[#254aa3] disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            {loading ? '註冊中...' : '註冊'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          已有帳號？{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            立即登入
          </Link>
        </p>
      </div>
    </div>
  )
}
