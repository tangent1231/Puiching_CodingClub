import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { LogIn } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function StudentLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError(signInError.message)
    } else {
      navigate('/profile')
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-card-foreground">學生登入</h1>
          <p className="mt-1 text-sm text-muted-foreground">登入後可報名比賽並管理個人資料</p>
        </div>

        {error && <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-card-foreground">電郵</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-card-foreground">密碼</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-[#254aa3] disabled:opacity-50"
          >
            <LogIn className="h-4 w-4" />
            {loading ? '登入中...' : '登入'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          還沒有帳號？{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            立即註冊
          </Link>
        </p>
      </div>
    </div>
  )
}
