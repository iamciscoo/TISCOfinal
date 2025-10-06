'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Eye, EyeOff, Check, X } from 'lucide-react'
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signIn, signUp, resetPassword, signInWithGoogle } = useAuth()
  const { toast } = useToast()

  // Allow modal to close always, but show confirmation for errors if needed
  const handleModalClose = () => {
    // Clear any errors and always allow closing
    setError('')
    setLoading(false)
    resetForm()
    onClose()
  }

  // Password validation helpers (same as sign-up page)
  const isPasswordValid = password.length >= 8
  const hasLowerCase = /[a-z]/.test(password)
  const hasUpperCase = /[A-Z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const passwordsMatch = password === confirmPassword && password.length > 0

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setFirstName('')
    setLastName('')
    setShowPassword(false)
    setError('')
  }

  const clearError = () => {
    if (error) {
      setError('')
    }
  }

  // Legacy function - now just calls handleModalClose
  const handleClose = () => {
    handleModalClose()
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
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
      
      // Show user-friendly toast for Google sign-in errors
      toast({
        title: "Google sign-in issue",
        description: "There was a problem signing in with Google. Please try again or use email/password.",
        variant: "default",
        duration: 6000,
      })
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    // CRITICAL: Force this log to appear - timestamp to verify code is loading
    console.log('🔐🔐🔐 SIGN-IN ATTEMPT STARTED - Build timestamp:', new Date().toISOString())
    console.log('MODE:', mode, 'EMAIL:', email, 'HAS PASSWORD:', !!password)

    try {
      if (mode === 'signin') {
        console.log('📧 Attempting sign-in with email:', email)
        const { data, error } = await signIn(email, password)
        
        console.log('📬 Sign-in response:', { 
          hasData: !!data, 
          hasUser: !!data?.user, 
          hasSession: !!data?.session,
          hasError: !!error,
          errorMessage: error?.message 
        })
        
        // Check for authentication errors first
        if (error) {
          console.error('❌❌❌ SIGN-IN ERROR DETECTED:', error)
          setLoading(false) // Stop loading immediately
          
          // Show user-friendly toast notification for the error
          toast({
            title: "Oops! Check your credentials",
            description: "The email or password you entered is incorrect. Please double-check and try again.",
            variant: "default", // Use white background instead of red
            duration: 6000, // Show longer for mobile users
          })
          
          // Also set inline error for modal display
          setError(error.message || 'Invalid email or password. Please check your credentials and try again.')
          console.log('🔒 Error shown via toast and inline - modal should stay open')
          return
        }
        
        // Verify we have valid session data before considering it successful
        if (!data.user || !data.session) {
          console.error('❌ Invalid session data - missing user or session')
          setLoading(false) // Stop loading immediately
          throw new Error('Invalid email or password. Please check your credentials and try again.')
        }
        
        // Only close and show success if sign in was actually successful
        console.log('✅ Sign-in successful! Closing modal...')
        toast({
          title: "Success",
          description: "Signed in successfully!"
        })
        onClose()
      } else if (mode === 'signup') {
        // Enhanced password validation
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters long')
        }
        if (!hasLowerCase) {
          throw new Error('Password must contain at least one lowercase letter')
        }
        if (!hasUpperCase) {
          throw new Error('Password must contain at least one uppercase letter')
        }
        if (!hasNumbers) {
          throw new Error('Password must contain at least one number')
        }
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
          description: "Welcome to TISCO Market! You are now signed in."
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
        handleClose()
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      console.error('🚨 Authentication error caught in catch block:', errorMessage)
      console.log('📋 Current state - loading:', loading, 'error will be set to:', errorMessage)
      setError(errorMessage)
      setLoading(false) // Ensure loading is false
      // DO NOT call onClose() here - keep modal open to show error
      console.log('🔒 Modal should remain open to display error')
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
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        console.log('🚪 Dialog onOpenChange triggered:', { open, isOpen, loading, error: !!error })
        // Use our handleModalClose which checks for errors
        if (!open) {
          handleModalClose()
        }
      }}>
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
                  onChange={(e) => {
                    setFirstName(e.target.value)
                    clearError()
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value)
                    clearError()
                  }}
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
              onChange={(e) => {
                setEmail(e.target.value)
                clearError()
              }}
              required
            />
            {/* Show error below email field for reset mode */}
            {mode === 'reset' && error && (
              <div className="mt-2 text-sm text-red-600 flex items-center gap-2">
                <X className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {mode !== 'reset' && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    clearError()
                  }}
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
              {/* Show authentication error below password field for signin mode */}
              {mode === 'signin' && error && (
                <div className="mt-2 text-sm text-red-600 flex items-center gap-2">
                  <X className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {mode === 'signup' && password && (
            <div className="space-y-1 text-sm px-1">
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

          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    clearError()
                  }}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {confirmPassword && (
                <div className={`flex items-center gap-2 text-sm ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                  {passwordsMatch ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                </div>
              )}
              {/* Show signup errors below confirm password field */}
              {mode === 'signup' && error && (
                <div className="mt-2 text-sm text-red-600 flex items-center gap-2">
                  <X className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
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
              
              {/* Show Google authentication errors */}
              {error && error.includes('Google') && (
                <div className="mt-2 text-sm text-red-600 flex items-center gap-2">
                  <X className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
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
