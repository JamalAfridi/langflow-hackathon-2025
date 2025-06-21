import IndexPage from '@/pages/Index'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings - Wobble Talk',
  description: 'Manage your Wobble Talk account settings',
}

export default function Settings() {
  return <IndexPage />
}