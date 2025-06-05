import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Lora, Roboto_Mono } from 'next/font/google'
import './globals.css'

// Configuração das fontes
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

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
      <body className={`${plusJakartaSans.variable} ${lora.variable} ${robotoMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
