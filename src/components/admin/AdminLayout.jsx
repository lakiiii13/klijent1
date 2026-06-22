import { useState } from 'react'

const NAV = [
  { id: 'bookings', label: 'Rezervacije', icon: '📋' },
  { id: 'schedule', label: 'Radno vreme', icon: '🕐' },
]

export default function AdminLayout({
  tab,
  onTabChange,
  onRefresh,
  onLogout,
  children,
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-cream-dark lg:h-screen lg:overflow-hidden">
      {/* Sidebar — fixed desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-brown/10 bg-white lg:flex">
        <div className="border-b border-brown/10 px-6 py-7">
          <span className="block font-serif text-2xl tracking-[0.12em] text-brown-dark">LA VIE</span>
          <span className="mt-1 block text-[10px] tracking-[0.22em] text-ink-muted">ADMIN PANEL</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-3 rounded-sm px-4 py-3 text-left text-sm transition-colors ${
                tab === item.id
                  ? 'bg-brown text-white'
                  : 'text-ink-muted hover:bg-cream hover:text-ink'
              }`}
            >
              <span className="text-base" aria-hidden>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="shrink-0 space-y-1 border-t border-brown/10 p-4">
          <button
            type="button"
            onClick={onRefresh}
            className="w-full px-4 py-2.5 text-left text-xs tracking-[0.1em] text-ink-muted hover:text-brown"
          >
            ↻ Osveži
          </button>
          <a
            href="/"
            className="block px-4 py-2.5 text-xs tracking-[0.1em] text-ink-muted hover:text-brown"
          >
            → Nazad na sajt
          </a>
          <button
            type="button"
            onClick={onLogout}
            className="w-full px-4 py-2.5 text-left text-xs tracking-[0.1em] text-red-600/80 hover:text-red-700"
          >
            Odjava
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden">
        <header className="sticky top-0 z-40 border-b border-brown/10 bg-white px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-serif text-xl tracking-[0.1em] text-brown-dark">LA VIE</span>
              <span className="ml-2 text-[9px] tracking-[0.2em] text-ink-muted">ADMIN</span>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-10 w-10 items-center justify-center border border-brown/15 text-ink"
              aria-label="Meni"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>

          {menuOpen && (
            <nav className="mt-4 space-y-1 border-t border-brown/10 pt-4">
              {NAV.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onTabChange(item.id)
                    setMenuOpen(false)
                  }}
                  className={`flex w-full items-center gap-3 px-3 py-3 text-sm ${
                    tab === item.id ? 'bg-brown text-white' : 'text-ink-muted'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              ))}
              <button type="button" onClick={onRefresh} className="w-full px-3 py-2 text-left text-xs text-ink-muted">
                ↻ Osveži
              </button>
              <a href="/" className="block px-3 py-2 text-xs text-ink-muted">→ Sajt</a>
              <button type="button" onClick={onLogout} className="w-full px-3 py-2 text-left text-xs text-red-600">
                Odjava
              </button>
            </nav>
          )}
        </header>
      </div>

      {/* Main — scrollable */}
      <div className="flex min-h-screen min-w-0 flex-col lg:ml-60 lg:h-screen lg:overflow-y-auto">
        <div className="hidden shrink-0 border-b border-brown/10 bg-white px-8 py-6 lg:block">
          <h1 className="font-serif text-2xl text-ink">
            {tab === 'bookings' ? 'Rezervacije' : 'Radno vreme'}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {tab === 'bookings'
              ? 'Pregled i upravljanje terminima'
              : 'Podešavanje rasporeda i pauza'}
          </p>
        </div>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
