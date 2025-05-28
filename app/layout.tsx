import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Agente virtual',
  description: 'Agente virtual',
  generator: 'Bruno Vigo',
  icons: {
    icon: '/images/robo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
