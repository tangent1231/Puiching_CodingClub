import { Trophy } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-[#1a3a8c] to-[#122a66] py-12 text-white sm:py-16 lg:py-20">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium backdrop-blur">
          <Trophy className="h-4 w-4 text-[#c8a145]" />
          <span>培正 Coding Club</span>
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight sm:mt-6 sm:text-4xl lg:text-5xl">
          培正 Coding Club 資源中心
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-white/80 sm:mt-4 sm:text-base lg:text-lg">
          收錄競賽公告、獲獎記錄、活動相簿與學習資源，為 Coding Club 及各社團提供一站式查詢。
        </p>
      </div>
    </section>
  )
}
