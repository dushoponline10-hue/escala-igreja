import './globals.css'

export const metadata = {
  title: 'Escala Igreja Viver',
  description: 'Sua escala de serviço na Igreja Viver, com aviso no celular.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Escala', statusBarStyle: 'default' },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1f3a5f',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
