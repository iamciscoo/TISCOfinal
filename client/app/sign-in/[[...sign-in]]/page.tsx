import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Sign in - TISCOマーケット',
  description: 'Access your TISCO Market account securely.',
}

export default async function Page({ 
  searchParams 
}: { 
  searchParams: Promise<{ redirect_url?: string }> 
}) {
  // Preserve redirect URL when redirecting to the proper auth sign-in page
  const params = await searchParams
  const redirectUrl = params?.redirect_url
  const newPath = redirectUrl ? `/auth/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}` : '/auth/sign-in'
  redirect(newPath)
}
