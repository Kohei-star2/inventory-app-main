import type { Metadata, Viewport } from 'next'
import Image from 'next/image'
import './globals.css'

export const metadata: Metadata = {
  title: 'Connect Place 在庫管理',
  description: '消耗品・備品の在庫管理',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '在庫管理',
  },
  manifest: '/manifest.json',
  icons: {
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1e3a5f',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen" style={{ background: '#f5f4f2', color: '#2a2a2a', fontFamily: "'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" }}>
        <header style={{ background: '#1e3a5f', color: '#fff', paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }} className="px-5 pb-4 shadow-md">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/logo.jpg" alt="Connect Place" width={80} height={32} style={{ objectFit: 'contain', mixBlendMode: 'screen' }} />
              <span className="text-sm font-medium tracking-wide" style={{ color: 'rgba(255,255,255,0.75)', borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '12px' }}>在庫管理</span>
            </div>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-5 pb-24">
          {children}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 border-t" style={{ background: '#fff', borderColor: '#e8e6e3', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="max-w-lg mx-auto flex">
            {[
              { href: '/', icon: '▦', label: '一覧' },
              { href: '/inventory', icon: '✓', label: '棚卸し' },
              { href: '/import', icon: '📷', label: '取込' },
              { href: '/reports', icon: '≡', label: 'レポート' },
              { href: '/items', icon: '⊕', label: '品目管理' },
              { href: '/people', icon: '☺', label: '名簿' },
            ].map(({ href, icon, label }) => (
              <a key={href} href={href}
                className="flex-1 flex flex-col items-center py-3 gap-0.5 text-xs transition-colors"
                style={{ color: '#6b6b6b' }}>
                <span className="text-lg leading-tight">{icon}</span>
                <span>{label}</span>
              </a>
            ))}
          </div>
        </nav>
      </body>
    </html>
  )
}
