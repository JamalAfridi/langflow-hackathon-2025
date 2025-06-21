import { AppProviders } from '@/components/provider'
import type { Metadata } from 'next'
import "../index.css";
import "../App.css";
 
export const metadata: Metadata = {
  title: 'My App',
  description: 'My App is a...',
}
 
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  )
}
