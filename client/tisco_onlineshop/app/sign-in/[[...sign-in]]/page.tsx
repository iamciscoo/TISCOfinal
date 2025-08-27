import type { Metadata } from 'next'
import { SignIn } from '@clerk/nextjs'
import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { clerkAppearance } from '@/components/auth/clerkAppearance'

export const metadata: Metadata = {
  title: 'Sign in - TISCOマーケット',
  description: 'Access your TISCO Market account securely.',
}

export default function Page() {
  return (
    <AuthPageShell title="Welcome back" subtitle="Sign in to continue to TISCOマーケット">
      <SignIn
        appearance={clerkAppearance}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl="/account"
      />
    </AuthPageShell>
  )
}
