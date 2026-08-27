import { LogIn, Menu, User, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'

export default function Header() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()

  const links = [
    { href: '#events-section', label: '活動公告' },
    { href: '#awards-search', label: '獲獎查詢' },
    { href: '#photos-section', label: '活動相簿' },
    { href: '#resources-section', label: '學習資源' },
    { to: '/competitions', label: '比賽報名', isRoute: true },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#" className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="澳門培正中學 Coding Club"
            className="h-10 w-auto rounded sm:h-12"
          />
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-primary">Coding Club</p>
            <p className="text-xs text-muted-foreground">資源中心</p>
          </div>
        </a>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          {links.map((link) =>
            link.isRoute ? (
              <Link
                key={link.to}
                to={link.to}
                className="transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-primary"
              >
                {link.label}
              </a>
            )
          )}
          {user ? (
            <Link
              to="/profile"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <User className="h-4 w-4" />
              個人中心
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[#254aa3]"
            >
              <LogIn className="h-4 w-4" />
              登入
            </Link>
          )}
        </nav>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted md:hidden"
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
