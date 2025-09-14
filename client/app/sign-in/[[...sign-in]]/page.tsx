import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Sign in - TISCOマーケット',
  description: 'Access your TISCO Market account securely.',
}

export default function Page() {
  // Redirect to the new auth sign-in page
  redirect('/auth/sign-in')
}
