import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Gatherly - Intelligent Scheduling Agent',
  description: 'Automate planning social hangouts with AI-powered scheduling that finds mutual availability and seamlessly books time in everyone\'s calendars.',
  keywords: 'scheduling, calendar, AI, meetings, coordination, productivity',
  authors: [{ name: 'Gatherly Team' }],
  openGraph: {
    title: 'Gatherly - Schedule Smarter, Not Harder',
    description: 'AI-powered scheduling assistant that eliminates the pain of coordinating meetings',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  )
}