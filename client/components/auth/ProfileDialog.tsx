"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase-auth"
import { Eye, EyeOff, Check, X } from "lucide-react"

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isPasswordReset?: boolean
}

interface ProfileData {
  first_name: string
  last_name: string
  email: string
  phone: string
}

export function ProfileDialog({ open, onOpenChange, isPasswordReset = false }: ProfileDialogProps) {
  const { user, updateUser, updatePassword } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [profile, setProfile] = useState<ProfileData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  })

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")

  // Password validation helpers
  const isPasswordValid = password.length >= 8
  const hasLowerCase = /[a-z]/.test(password)
  const hasUpperCase = /[A-Z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const passwordsMatch = password === confirmPassword && password.length > 0

  // Track changes internally if needed for future UX (e.g., disable Save when unchanged)
  // For now, keep UI simple without complex dirty checking

  // Load current profile when dialog opens
  useEffect(() => {
    if (!open) return
    let mounted = true
    const load = async () => {
      setFetching(true)
      setError(null)
      try {
        const res = await fetch("/api/auth/profile", { cache: "no-store" })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || "Failed to load profile")
        const email = data?.auth_user?.email || user?.email || ""
        const first = data?.profile?.first_name || data?.auth_user?.first_name || ""
        const last = data?.profile?.last_name || data?.auth_user?.last_name || ""
        const phone = data?.profile?.phone || data?.auth_user?.phone || ""
        const avatar = data?.profile?.avatar_url || data?.auth_user?.avatar_url || user?.user_metadata?.avatar_url || ""
        if (!mounted) return
        setProfile({ first_name: first, last_name: last, email, phone })
        setAvatarUrl(avatar)
      } catch (e) {
        if (!mounted) return
        setError(e instanceof Error ? e.message : "Failed to load profile")
      } finally {
        if (mounted) setFetching(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [open, user?.email, user?.user_metadata?.avatar_url])

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    
    // Early validation for password reset flows
    if (isPasswordReset) {
      if (!password.trim()) {
        setError("Password is required for password reset")
        setLoading(false)
        return
      }
      if (!confirmPassword.trim()) {
        setError("Please confirm your password")
        setLoading(false)
        return
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match")
        setLoading(false)
        return
      }
    } else {
      // Early validation for optional password changes in profile updates
      if (password || confirmPassword) {
        if (password && !confirmPassword) {
          setError("Please confirm your new password")
          setLoading(false)
          return
        }
        if (!password && confirmPassword) {
          setError("Please enter a new password to confirm")
          setLoading(false)
          return
        }
        if (password !== confirmPassword) {
          setError("Passwords do not match")
          setLoading(false)
          return
        }
      }
    }

    // Optional phone number validation (only validate if phone is provided)
    if (profile.phone && profile.phone.trim()) {
      // Remove any spaces or special characters for validation
      const cleanPhone = profile.phone.replace(/[\s\-\(\)]/g, '')
      
      // Only validate if user actually entered a phone number
      if (cleanPhone.length > 0) {
        // Check if phone is too long (database constraint appears to limit length)
        if (cleanPhone.length > 15) {
          setError("Phone number is too long. Please use a valid international format (max 15 digits).")
          setLoading(false)
          return
        }
        
        // Check if phone contains only digits and optional + prefix
        if (!/^\+?[0-9]+$/.test(cleanPhone)) {
          setError("Phone number should only contain numbers and optional + prefix.")
          setLoading(false)
          return
        }
        
        // For Tanzanian numbers, ensure proper format
        if (cleanPhone.startsWith('255') && cleanPhone.length > 12) {
          setError("Tanzanian phone number appears too long. Please use format: 255XXXXXXXXX")
          setLoading(false)
          return
        }
      }
    }
    
    try {
      // If an avatar file is selected, upload to Supabase Storage (bucket: avatars)
      let uploadedAvatarUrl: string | null = null
      if (selectedFile) {
        const supabase = createSupabaseBrowserClient()
        const ext = (selectedFile.name.split('.').pop() || 'jpg').toLowerCase()
        const path = `${user?.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, selectedFile, {
            cacheControl: '3600',
            upsert: true,
            contentType: selectedFile.type || 'image/jpeg'
          })
        if (uploadError) {
          throw new Error(uploadError.message || 'Failed to upload avatar. Make sure the "avatars" bucket exists and is public.')
        }
        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path)
        uploadedAvatarUrl = publicUrlData.publicUrl
      }

      // Update email if changed (may require confirmation)
      if (user?.email && profile.email && profile.email !== user.email) {
        const { error } = await updateUser({ email: profile.email })
        if (error) throw new Error(error.message || "Failed to update email")
      }

      // Update password if provided (required for password reset, optional otherwise)
      if (password || confirmPassword) {
        // Enhanced validation for both password reset and optional password changes
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match")
        }
        
        // Only validate password strength if user has entered a password
        if (password) {
          if (password.length < 8) {
            throw new Error("Password must be at least 8 characters long")
          }
          
          // Validate password strength with the actual password value
          const hasLower = /[a-z]/.test(password)
          const hasUpper = /[A-Z]/.test(password)
          const hasNumber = /\d/.test(password)
          
          if (!hasLower || !hasUpper || !hasNumber) {
            throw new Error("Password must contain at least one lowercase letter, one uppercase letter, and one number")
          }
          
          try {
            const { error } = await updatePassword(password)
            if (error) {
              // Handle specific Supabase password update errors
              if (error.message.includes('session')) {
                throw new Error("Session expired. Please request a new password reset link.")
              } else if (error.message.includes('weak')) {
                throw new Error("Password is too weak. Please choose a stronger password.")
              } else {
                throw new Error(error.message || "Failed to update password")
              }
            }
          } catch (passwordError) {
            console.error('Password update failed:', passwordError)
            throw passwordError
          }
        } else if (confirmPassword && !password) {
          throw new Error("Please enter a new password to confirm")
        }
      } else if (isPasswordReset) {
        // Password is required for password reset flows
        throw new Error("Please set a new password to complete the reset process")
      }

      // Update Supabase auth user metadata for immediate UI reflection
      {
        const { error } = await updateUser({
          data: {
            first_name: profile.first_name,
            last_name: profile.last_name,
            phone: profile.phone?.trim() || null, // Handle optional phone properly
            ...(uploadedAvatarUrl ? { avatar_url: uploadedAvatarUrl } : {}),
          }
        })
        if (error) throw new Error(error.message || "Failed to update account metadata")
      }

      // Update profile fields in our database (first_name, last_name, phone, and email to keep table in sync)
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone?.trim() || null, // Send null for empty phone instead of empty string
          email: profile.email,
          ...(uploadedAvatarUrl ? { avatar_url: uploadedAvatarUrl } : {}),
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to update profile")

      if (uploadedAvatarUrl) setAvatarUrl(uploadedAvatarUrl)
      
      // Clear any existing errors on successful update
      setError(null)
      
      // Show appropriate success toast notification
      if (isPasswordReset) {
        toast({
          title: "Password Reset Complete! 🎉",
          description: "Your password has been successfully updated. You can now sign in with your new password.",
          variant: "default",
        })
        // Close dialog immediately for password reset
        onOpenChange(false)
      } else {
        // Check if password was changed for regular profile updates
        const passwordChanged = password && password.length > 0
        
        if (passwordChanged) {
          toast({
            title: "Profile & Password Updated! 🔐",
            description: "Your profile information and password have been updated successfully.",
            variant: "default",
          })
        } else {
          toast({
            title: "Profile Updated! ✅",
            description: "Your profile information has been saved successfully.",
            variant: "default",
          })
        }
        
        // Close after short delay for regular profile updates
        setTimeout(() => onOpenChange(false), 500)
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to update profile"
      console.error('Profile update error:', e)
      
      // Handle specific database constraint errors with user-friendly messages
      let userFriendlyMessage = errorMessage
      if (errorMessage.includes('chk_users_phone_length')) {
        userFriendlyMessage = "Phone number is invalid or too long. Please use a valid format (e.g., 255700000000)."
      } else if (errorMessage.includes('constraint')) {
        userFriendlyMessage = "Invalid data format. Please check your information and try again."
      } else if (errorMessage.includes('duplicate')) {
        userFriendlyMessage = "This information is already in use. Please use different values."
      }
      
      setError(userFriendlyMessage)
      
      // Only show error toast for actual errors, not validation warnings
      if (userFriendlyMessage && !userFriendlyMessage.includes('successfully')) {
        if (isPasswordReset) {
          toast({
            title: "Password Reset Failed ❌",
            description: userFriendlyMessage,
            variant: "destructive",
          })
        } else {
          toast({
            title: "Update Failed ❌",
            description: userFriendlyMessage,
            variant: "destructive",
          })
        }
      }
    } finally {
      setLoading(false)
      setPassword("")
      setConfirmPassword("")
      setShowPassword(false)
      setShowConfirmPassword(false)
      setSelectedFile(null)
      setPreviewUrl("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg w-full max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
          <DialogTitle className="text-lg font-semibold">
            {isPasswordReset ? 'Complete Password Reset' : 'Profile'}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            {isPasswordReset 
              ? 'Please set a new password to secure your account.'
              : 'Update your basic information. Changes sync to your account.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-2" style={{ minHeight: 0 }}>
            <div className="space-y-4 py-2">
              {error && (
                <div role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>
              )}

              {/* Avatar Section */}
              <div className="space-y-2">
                <Label>Avatar</Label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-gray-200">
                    {previewUrl || avatarUrl ? (
                      <Image src={previewUrl || avatarUrl} alt="Avatar preview" width={56} height={56} className="w-12 h-12 sm:w-14 sm:h-14 object-cover" />
                    ) : (
                      <div className="w-12 h-12 sm:w-14 sm:h-14" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null
                        setSelectedFile(f || null)
                        if (f) setPreviewUrl(URL.createObjectURL(f))
                      }}
                      disabled={fetching || loading}
                      className="text-sm"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Square image recommended, max 2MB.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="first_name">First name</Label>
                <Input id="first_name" value={profile.first_name} onChange={(e) => setProfile(p => ({ ...p, first_name: e.target.value }))} placeholder="John" disabled={fetching || loading} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="last_name">Last name</Label>
                <Input id="last_name" value={profile.last_name} onChange={(e) => setProfile(p => ({ ...p, last_name: e.target.value }))} placeholder="Doe" disabled={fetching || loading} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={profile.email} onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))} placeholder="you@example.com" disabled={fetching || loading} />
                <p className="text-xs text-muted-foreground">Changing email may require confirmation.</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" value={profile.phone} onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="255700000000 (optional)" disabled={fetching || loading} />
                <p className="text-xs text-muted-foreground">Optional. Can be added later for order delivery. International format preferred (e.g., 255700000000).</p>
              </div>

              {/* Enhanced password fields for password reset flows */}
              {isPasswordReset && (
                <div className="space-y-3 pt-1 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-xl border border-blue-200">
                  <div className="text-center">
                    <h3 className="font-semibold text-blue-900 text-sm">🔐 Set Your New Password</h3>
                    <p className="text-xs text-blue-700 mt-1">Create a strong password to secure your account</p>
                  </div>

                  {/* New Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="font-medium text-blue-900">
                      New Password
                    </Label>
                    <div className="relative">
                      <Input 
                        id="password" 
                        type={showPassword ? "text" : "password"}
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="Enter your new password" 
                        disabled={fetching || loading}
                        className="border-blue-300 focus:ring-blue-500 pr-10"
                        required={isPasswordReset}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>

                    {/* Password Strength Indicators */}
                    {password.length > 0 && (
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div className={`flex items-center gap-1 ${isPasswordValid ? 'text-green-600' : 'text-gray-500'}`}>
                          {isPasswordValid ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          <span>8+ chars</span>
                        </div>
                        <div className={`flex items-center gap-1 ${hasLowerCase ? 'text-green-600' : 'text-gray-500'}`}>
                          {hasLowerCase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          <span>Lowercase</span>
                        </div>
                        <div className={`flex items-center gap-1 ${hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}>
                          {hasUpperCase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          <span>Uppercase</span>
                        </div>
                        <div className={`flex items-center gap-1 ${hasNumbers ? 'text-green-600' : 'text-gray-500'}`}>
                          {hasNumbers ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          <span>Number</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="confirm" className="font-medium text-blue-900">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input 
                        id="confirm" 
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        placeholder="Confirm your new password" 
                        disabled={fetching || loading}
                        className="border-blue-300 focus:ring-blue-500 pr-10"
                        required={isPasswordReset}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>

                    {/* Password Match Indicator */}
                    {confirmPassword.length > 0 && (
                      <div className={`flex items-center gap-1 text-xs ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
                        {passwordsMatch ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Enhanced optional password change for regular profile updates */}
              {!isPasswordReset && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      New password (optional)
                    </Label>
                    <div className="relative">
                      <Input 
                        id="password" 
                        type={showPassword ? "text" : "password"}
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="Enter new password" 
                        disabled={fetching || loading}
                        className="pr-10"
                      />
                      {password && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Leave blank to keep current password. OAuth users don&apos;t need passwords.
                    </p>
                  </div>

                  {password && (
                    <div className="space-y-2">
                      <Label htmlFor="confirm">
                        Confirm new password
                      </Label>
                      <div className="relative">
                        <Input 
                          id="confirm" 
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)} 
                          placeholder="Confirm new password" 
                          disabled={fetching || loading}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>

                      {/* Password validation for optional changes */}
                      {password.length > 0 && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className={`flex items-center gap-1 ${isPasswordValid ? 'text-green-600' : 'text-gray-500'}`}>
                              {isPasswordValid ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                              <span>8+ characters</span>
                            </div>
                            <div className={`flex items-center gap-1 ${hasLowerCase ? 'text-green-600' : 'text-gray-500'}`}>
                              {hasLowerCase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                              <span>Lowercase</span>
                            </div>
                            <div className={`flex items-center gap-1 ${hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}>
                              {hasUpperCase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                              <span>Uppercase</span>
                            </div>
                            <div className={`flex items-center gap-1 ${hasNumbers ? 'text-green-600' : 'text-gray-500'}`}>
                              {hasNumbers ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                              <span>Number</span>
                            </div>
                          </div>
                          
                          {confirmPassword.length > 0 && (
                            <div className={`flex items-center gap-1 text-xs ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
                              {passwordsMatch ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                              <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Spacer for better scrolling experience */}
              <div className="h-6" aria-hidden="true" />
            </div>
        </div>

        <div className="flex-shrink-0 flex justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-white">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading || fetching}>{loading ? "Saving..." : "Save"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
