import { Metadata } from 'next'
import AuthPage from '@/pages/Auth'


export const metadata: Metadata = {
  title: 'Authentication - Wobble Talk',
  description: 'Sign in or create an account for Wobble Talk',
}

export default function Auth() {
  return <AuthPage />
}