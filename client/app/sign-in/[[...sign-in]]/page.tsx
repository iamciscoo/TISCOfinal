import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Sign in - TISCOマーケット',
  description: 'Access your TISCO Market account securely.',
}

export default function Page({ searchParams }: { searchParams: { redirect_url?: string } }) {
  // Preserve redirect URL when redirecting to the proper auth sign-in page
  const redirectUrl = searchParams?.redirect_url
  const newPath = redirectUrl ? `/auth/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}` : '/auth/sign-in'
  redirect(newPath)
}
