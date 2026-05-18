export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: '#eef3ff' }}>
      {/* Sphere decorations — Luminote-style */}
      <div className="pointer-events-none absolute inset-0">
        {/* Top-right large sphere */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full" style={{ background: '#c5d8ee', opacity: 0.7 }} />
        {/* Top-right medium sphere */}
        <div className="absolute top-16 right-8 w-40 h-40 rounded-full" style={{ background: '#93b5d9', opacity: 0.5 }} />
        {/* Centre-right small sphere */}
        <div className="absolute top-1/3 right-1/4 w-16 h-16 rounded-full" style={{ background: '#4a6fa5', opacity: 0.35 }} />
        {/* Bottom-left large sphere */}
        <div className="absolute -bottom-20 -left-16 w-64 h-64 rounded-full" style={{ background: '#c5d8ee', opacity: 0.6 }} />
        {/* Bottom-left accent sphere */}
        <div className="absolute bottom-16 left-24 w-20 h-20 rounded-full" style={{ background: '#4a6fa5', opacity: 0.45 }} />
        {/* Mid-left tiny sphere */}
        <div className="absolute top-1/2 left-8 w-10 h-10 rounded-full" style={{ background: '#6b8ab8', opacity: 0.4 }} />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">{children}</div>
    </div>
  )
}
