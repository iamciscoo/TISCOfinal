import type { Metadata } from 'next'
import { SignIn } from '@clerk/nextjs'
import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { clerkAppearance } from '@/components/auth/clerkAppearance'

export const metadata: Metadata = {
  title: 'Sign in - TISCOマーケット',
  description: 'Access your TISCO Market account securely.',
}

export default function Page() {
  const centeredAppearance = {
    ...clerkAppearance,
    elements: {
      ...clerkAppearance.elements,
      header: 'mb-2 text-center',
      headerTitle: 'text-2xl font-bold text-gray-900 text-center',
      headerSubtitle: 'text-gray-600 text-center',
      footer: 'mt-4 text-center text-sm',
    },
  } as typeof clerkAppearance

  return (
    <AuthPageShell title="Welcome back" subtitle="Sign in to continue to TISCOマーケット" showTopBar={false} showHeader={false} centerContent>
      <SignIn
        appearance={centeredAppearance}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl="/account"
      />
    </AuthPageShell>
  )
}
