/* eslint-disable react-refresh/only-export-components */
import { Metadata } from 'next'
import SettingsPage from '@/pages/Settings'

export const metadata: Metadata = {
  title: 'Settings - Wobble Talk',
  description: 'Manage your Wobble Talk account settings',
}

export default function Settings() {
  return <SettingsPage />
}