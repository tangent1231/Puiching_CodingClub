import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ArrowLeft, Calendar, Send } from 'lucide-react'
import { Link } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function CompetitionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [competition, setCompetition] = useState(null)
  const [profile, setProfile] = useState(null)
  const [registration, setRegistration] = useState(null)
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/login')
      return
    }
    loadData()
  }, [user, authLoading, id, navigate])

  const loadData = async () => {
    const [{ data: comp }, { data: prof }, { data: regs }] = await Promise.all([
      supabase.from('competitions').select('*').eq('id', id).single(),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('registrations').select('*').eq('competition_id', id).eq('user_id', user.id),
    ])
    setCompetition(comp)
    setProfile(prof)
    if (regs && regs.length > 0) {
      setRegistration(regs[0])
      setFormData(regs[0].form_data || {})
    } else if (prof) {
      const initial = {}
      const required = comp?.required_fields || []
      required.forEach((field) => {
        if (field === 'name') initial[field] = prof.name || ''
        else if (field === 'email') initial[field] = prof.email || user.email || ''
        else if (field === 'school') initial[field] = prof.school || ''
        else if (field === 'student_id') initial[field] = prof.student_id || ''
        else if (field === 'grade') initial[field] = prof.grade || ''
        else if (field === 'nickname') initial[field] = prof.nickname || ''
        else initial[field] = ''
      })
      setFormData(initial)
    }
    setLoading(false)
  }

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    const payload = {
      user_id: user.id,
      competition_id: id,
      form_data: formData,
      status: 'pending',
    }

    const { error } = registration
      ? await supabase.from('registrations').update({ form_data: formData }).eq('id', registration.id)
      : await supabase.from('registrations').insert(payload)

    if (error) {
      setMessage('提交失敗：' + error.message)
    } else {
      setMessage('報名已提交')
      await loadData()
    }
    setSubmitting(false)
  }

  if (loading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">載入中...</div>
  }

  if (!competition) {
    return <div className="p-8 text-center text-sm text-muted-foreground">比賽不存在</div>
  }

  const requiredFields = competition.required_fields || []

  return (
    <div className="min-h-screen bg-muted px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Link to="/competitions" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          返回比賽列表
        </Link>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-card-foreground">{competition.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{competition.description}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
              <Calendar className="h-3.5 w-3.5" />
              報名截止：{competition.registration_close_date || '待定'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
              比賽日期：{competition.event_date || '待定'}
            </span>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-card-foreground">填寫報名資料</h2>
          <p className="text-sm text-muted-foreground">帶 * 為必填項目</p>

          {message && (
            <p className={`mt-4 rounded-lg px-3 py-2 text-sm ${message.startsWith('提交失敗') ? 'bg-destructive/10 text-destructive' : 'bg-green-100 text-green-700'}`}>
              {message}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {requiredFields.map((field) => (
              <div key={field}>
                <label className="mb-1 block text-sm font-medium text-card-foreground">
                  {fieldLabel(field)} *
                </label>
                <input
                  name={field}
                  required
                  value={formData[field] || ''}
                  onChange={handleChange}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            ))}
            {requiredFields.length === 0 && (
              <p className="text-sm text-muted-foreground">此比賽暫無額外必填資料</p>
            )}
            <button
              type="submit"
              disabled={submitting || requiredFields.length === 0}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-[#254aa3] disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {registration ? '更新報名' : '提交報名'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function fieldLabel(key) {
  const map = {
    name: '姓名',
    nickname: 'Nickname',
    email: '電郵',
    school: '學校',
    student_id: '學號',
    grade: '年級',
    phone: '聯絡電話',
    parent_phone: '家長聯絡電話',
    emergency_contact: '緊急聯絡人',
  }
  return map[key] || key
}
