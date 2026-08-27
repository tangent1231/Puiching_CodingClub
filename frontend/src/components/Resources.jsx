import { BookOpen, ExternalLink } from 'lucide-react'

const resources = [
  {
    title: 'OI Wiki',
    description: '資訊學競賽知識百科，涵蓋演算法、資料結構與競賽技巧。',
    url: 'https://oi-wiki.org/',
  },
  {
    title: '洛谷',
    description: '中文程式設計線上評測與題庫平台，適合練習與比賽。',
    url: 'https://www.luogu.com.cn/',
  },
  {
    title: 'Codeforces',
    description: '國際程式競賽平台，提供定期比賽與大量練習題目。',
    url: 'https://codeforces.com/',
  },
  {
    title: 'QOJ',
    description: '競賽題目線上評測系統，收錄多場經典比賽題目。',
    url: 'https://qoj.ac/contests',
  },
]

export default function Resources() {
  return (
    <section id="resources-section" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">學習資源</h2>
          <p className="text-sm text-muted-foreground">推薦網站與線上學習平台</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {resources.map((item) => (
          <a
            key={item.url}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex h-full flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <h3 className="text-base font-semibold text-card-foreground group-hover:text-primary">
                {item.title}
              </h3>
              <ExternalLink className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{item.description}</p>
          </a>
        ))}
      </div>
    </section>
  )
}
