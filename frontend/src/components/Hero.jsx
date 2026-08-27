import { Trophy } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-[#1a3a8c] to-[#122a66] py-16 text-white sm:py-20">
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
          <span>榮譽與成就</span>
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          榮譽牆
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-white/80 sm:text-lg">
          記錄培正編程學子的競賽足跡，見證每一次突破與榮耀。
        </p>
      </div>
    </section>
  )
}
