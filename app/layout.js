import '@fontsource/anton/400.css'
import '@fontsource/montserrat/400.css'
import '@fontsource/montserrat/600.css'
import '@fontsource/montserrat/700.css'
import '@fontsource/montserrat/800.css'
import './globals.css'

const DESCRICAO = 'Veja quando você serve na Viver Church e receba o aviso no celular.'

export const metadata = {
  metadataBase: new URL('https://escala-igreja-eta.vercel.app'),
  title: 'Escala Viver Church',
  description: DESCRICAO,
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Escala Viver', statusBarStyle: 'black' },
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '48x48', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Viver Church',
    title: 'Escala Viver Church',
    description: DESCRICAO,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Escala de serviço da Viver Church' }],
  },
  twitter: { card: 'summary_large_image', images: ['/og.png'] },
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
