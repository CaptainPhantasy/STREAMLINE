export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-theme-secondary flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none"></div>
      {children}
    </div>
  )
}

