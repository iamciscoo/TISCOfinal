import type { Metadata } from 'next'
import { SignUp } from '@clerk/nextjs'
import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { clerkAppearance } from '@/components/auth/clerkAppearance'

export const metadata: Metadata = {
  title: 'Create account - TISCOマーケット',
  description: 'Join TISCO Market for fast, secure shopping.',
}

export default function Page() {
  return (
    <AuthPageShell title="Create your account" subtitle="Join TISCOマーケット to start shopping">
      <SignUp
        appearance={clerkAppearance}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        afterSignUpUrl="/account"
      />
    </AuthPageShell>
  )
}
