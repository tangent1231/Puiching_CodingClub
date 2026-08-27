import { useEffect, useState } from 'react'
import { Download, Inbox, Search, User } from 'lucide-react'
import { api } from '../api/client'

export default function AwardSearch() {
  const [query, setQuery] = useState('')
  const [awards, setAwards] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchAwards = async (name = '') => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getAwards(name)
      setAwards(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAwards()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => fetchAwards(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <>
      <section id="awards-search" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Search className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">獲獎記錄查詢</h2>
            <p className="text-sm text-muted-foreground">輸入學生姓名即可篩選查閱證書</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="請輸入學生姓名，例如：陳子軒"
                className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              type="button"
              onClick={() => fetchAwards(query)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[#254aa3]"
            >
              <Search className="h-4 w-4" />
              <span>查詢</span>
            </button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            符合條件：<span className="font-semibold text-foreground">{awards.length}</span> 筆記錄
          </p>
        </div>
      </section>

      <section id="awards-list" className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">姓名</th>
                  <th className="px-4 py-3 font-medium">班級</th>
                  <th className="px-4 py-3 font-medium">競賽名稱</th>
                  <th className="px-4 py-3 font-medium">獎項</th>
                  <th className="px-4 py-3 font-medium">日期</th>
                  <th className="px-4 py-3 font-medium">證書</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-card-foreground">
                {awards.map((item) => (
                  <tr key={item.record_id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.class_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.competition}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {item.award}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.date}</td>
                    <td className="px-4 py-3">
                      {item.has_certificate ? (
                        <a
                          href={api.getCertificateUrl(item.record_id)}
                          download
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                        >
                          <Download className="h-4 w-4" />
                          <span>下載</span>
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {loading && (
            <div className="py-8 text-center text-sm text-muted-foreground">載入中...</div>
          )}
          {!loading && error && (
            <div className="py-8 text-center text-sm text-destructive">載入失敗：{error}</div>
          )}
          {!loading && !error && awards.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Inbox className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">找不到相關記錄</p>
              <p className="text-xs text-muted-foreground">請嘗試輸入其他姓名</p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
