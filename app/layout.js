import '@fontsource/anton/400.css'
import '@fontsource/montserrat/400.css'
import '@fontsource/montserrat/600.css'
import '@fontsource/montserrat/700.css'
import '@fontsource/montserrat/800.css'
import './globals.css'

export const metadata = {
  title: 'Escala Viver Church',
  description: 'Sua escala de serviço na Viver Church, com aviso no celular.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Escala Viver', statusBarStyle: 'black' },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0a',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
