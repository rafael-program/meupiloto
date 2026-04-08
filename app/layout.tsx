// app/layout.tsx
export const metadata = {
  title: 'MeuPiloto!',
  description: 'Sua corrida com segurança',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt">
      <head>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}