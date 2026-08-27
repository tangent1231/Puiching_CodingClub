import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Header() {
  const [open, setOpen] = useState(false)

  const links = [
    { href: '#events-section', label: '活動公告' },
    { href: '#awards-search', label: '獲獎查詢' },
    { href: '#photos-section', label: '活動相簿' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#" className="flex items-center gap-3">
          <img
            src="/logo.jpg"
            alt="澳門培正中學 Coding Club"
            className="w-auto rounded"
            style={{ height: 50 }}
          />
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-primary">Coding Club</p>
            <p className="text-xs text-muted-foreground">競賽部榮譽牆</p>
          </div>
        </a>

        <nav className="hidden gap-6 text-sm font-medium text-muted-foreground md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-primary"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="切換選單"
        >
          {open ? <X className="h-6 w-6 text-foreground" /> : <Menu className="h-6 w-6 text-foreground" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-3 text-sm font-medium text-muted-foreground">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-primary"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
