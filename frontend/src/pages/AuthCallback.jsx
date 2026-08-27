import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [message, setMessage] = useState('正在處理驗證...')

  useEffect(() => {
    const handleCallback = async () => {
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')
      const error = url.searchParams.get('error')
      const errorDescription = url.searchParams.get('error_description')

      if (error) {
        setMessage(`驗證失敗：${errorDescription || error}`)
        return
      }

      try {
        if (code) {
          await supabase.auth.exchangeCodeForSession(code)
        }
        const { data, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          setMessage(`驗證失敗：${sessionError.message}`)
          return
        }
        if (data.session?.user) {
          navigate('/profile', { replace: true })
          return
        }
        setMessage('未能取得登入狀態，請返回登入頁重試。')
      } catch (err) {
        setMessage(`驗證失敗：${err.message || '未知錯誤'}`)
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-card-foreground">驗證處理中</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
