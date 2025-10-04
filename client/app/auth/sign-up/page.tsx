'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Eye, EyeOff, Check, X } from 'lucide-react'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { signUp } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Password validation helpers (same as ProfileDialog)
  const isPasswordValid = password.length >= 8
  const hasLowerCase = /[a-z]/.test(password)
  const hasUpperCase = /[A-Z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const passwordsMatch = password === confirmPassword && password.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Enhanced password validation
    if (password.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      })
      return
    }

    if (!hasLowerCase) {
      toast({
        title: 'Password requirement',
        description: 'Password must contain at least one lowercase letter.',
        variant: 'destructive',
      })
      return
    }

    if (!hasUpperCase) {
      toast({
        title: 'Password requirement',
        description: 'Password must contain at least one uppercase letter.',
        variant: 'destructive',
      })
      return
    }

    if (!hasNumbers) {
      toast({
        title: 'Password requirement',
        description: 'Password must contain at least one number.',
        variant: 'destructive',
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Password mismatch',
        description: 'Passwords do not match. Please try again.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
      })
      
      if (error) {
        toast({
          title: 'Sign up failed',
          description: error.message,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Account created!',
          description: 'Welcome to TISCO Market! You are now signed in.',
        })
        // Redirect to homepage, user is already signed in
        router.push('/')
      }
    } catch (err) {
      console.error('Sign up error:', err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to sign up",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create account</CardTitle>
          <CardDescription className="text-center">
            Enter your information to create a new account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-2 space-y-1 text-sm">
                  <div className={`flex items-center gap-2 ${isPasswordValid ? 'text-green-600' : 'text-gray-500'}`}>
                    {isPasswordValid ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`flex items-center gap-2 ${hasLowerCase ? 'text-green-600' : 'text-gray-500'}`}>
                    {hasLowerCase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    <span>One lowercase letter</span>
                  </div>
                  <div className={`flex items-center gap-2 ${hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}>
                    {hasUpperCase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    <span>One uppercase letter</span>
                  </div>
                  <div className={`flex items-center gap-2 ${hasNumbers ? 'text-green-600' : 'text-gray-500'}`}>
                    {hasNumbers ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    <span>One number</span>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && (
                <div className={`flex items-center gap-2 text-sm mt-1 ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                  {passwordsMatch ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                </div>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create account
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link href="/auth/sign-in" className="text-blue-600 hover:text-blue-500 font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
