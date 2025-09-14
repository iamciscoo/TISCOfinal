'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: 'signin' | 'signup' | 'reset'
}

export function AuthModal({ isOpen, onClose, defaultMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(defaultMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { signIn, signUp, resetPassword, signInWithGoogle } = useAuth()
  const { toast } = useToast()

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setFirstName('')
    setLastName('')
    setShowPassword(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const { error } = await signInWithGoogle()
      
      if (error) throw error
      
      toast({
        title: "Success",
        description: "Signing in with Google..."
      })
      onClose()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to sign in with Google"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password)
        if (error) throw error
        
        toast({
          title: "Success",
          description: "Signed in successfully!"
        })
        onClose()
      } else if (mode === 'signup') {
        if (password !== confirmPassword) {
          throw new Error("Passwords don't match")
        }
        
        const { error } = await signUp(email, password, {
          first_name: firstName,
          last_name: lastName
        })
        if (error) throw error
        
        toast({
          title: "Success", 
          description: "Account created! Please check your email to verify your account."
        })
        onClose()
      } else if (mode === 'reset') {
        const { error } = await resetPassword(email)
        if (error) throw error
        
        toast({
          title: "Success",
          description: "Password reset email sent! Check your inbox."
        })
        setMode('signin')
        if (error) {
          toast({
            title: 'Reset failed',
            description: error.message,
            variant: 'destructive'
          })
        } else {
          toast({
            title: 'Reset email sent',
            description: 'Check your email for password reset instructions.'
          })
          handleClose()
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getTitle = () => {
    switch (mode) {
      case 'signin': return 'Sign In'
      case 'signup': return 'Create Account'
      case 'reset': return 'Reset Password'
    }
  }

  const getSubmitText = () => {
    if (loading) return <Loader2 className="h-4 w-4 animate-spin" />
    switch (mode) {
      case 'signin': return 'Sign In'
      case 'signup': return 'Create Account'
      case 'reset': return 'Send Reset Email'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {mode !== 'reset' && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {getSubmitText()}
          </Button>

          {(mode === 'signin' || mode === 'signup') && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full"
              >
                <FcGoogle className="h-4 w-4 mr-2" />
                Continue with Google
              </Button>
            </>
          )}

          <div className="text-center space-y-2">
            {mode === 'signin' && (
              <>
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setMode('reset')}
                  className="text-sm"
                >
                  Forgot your password?
                </Button>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Don&apos;t have an account?{' '}
                  </span>
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setMode('signup')}
                    className="text-sm p-0"
                  >
                    Sign up
                  </Button>
                </div>
              </>
            )}

            {mode === 'signup' && (
              <div>
                <span className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                </span>
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setMode('signin')}
                  className="text-sm p-0"
                >
                  Sign in
                </Button>
              </div>
            )}

            {mode === 'reset' && (
              <Button
                type="button"
                variant="link"
                onClick={() => setMode('signin')}
                className="text-sm"
              >
                Back to sign in
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
