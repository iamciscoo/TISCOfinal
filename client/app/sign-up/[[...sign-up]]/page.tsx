import type { Metadata } from 'next'
import { SignUp } from '@clerk/nextjs'
import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { clerkAppearance } from '@/components/auth/clerkAppearance'

export const metadata: Metadata = {
  title: 'Create account - TISCOマーケット',
  description: 'Join TISCO Market for fast, secure shopping.',
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
    <AuthPageShell title="Create your account" subtitle="Join TISCOマーケット to start shopping" showTopBar={false} showHeader={false} centerContent>
      <SignUp
        appearance={centeredAppearance}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        afterSignUpUrl="/account"
      />
    </AuthPageShell>
  )
}
