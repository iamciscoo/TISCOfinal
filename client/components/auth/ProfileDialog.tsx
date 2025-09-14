"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import Image from "next/image"
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase-auth"

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ProfileData {
  first_name: string
  last_name: string
  email: string
  phone: string
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { user, updateUser, updatePassword } = useAuth()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [profile, setProfile] = useState<ProfileData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  })

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")

  // Track changes internally if needed for future UX (e.g., disable Save when unchanged)
  // For now, keep UI simple without complex dirty checking

  // Load current profile when dialog opens
  useEffect(() => {
    if (!open) return
    let mounted = true
    const load = async () => {
      setFetching(true)
      setError(null)
      setSuccess(null)
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
    setSuccess(null)
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

      // Update password if provided
      if (password || confirmPassword) {
        if (password !== confirmPassword) throw new Error("Passwords do not match")
        if (password.length < 8) throw new Error("Password must be at least 8 characters")
        const { error } = await updatePassword(password)
        if (error) throw new Error(error.message || "Failed to update password")
      }

      // Update Supabase auth user metadata for immediate UI reflection
      {
        const { error } = await updateUser({
          data: {
            first_name: profile.first_name,
            last_name: profile.last_name,
            phone: profile.phone,
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
          phone: profile.phone,
          email: profile.email,
          ...(uploadedAvatarUrl ? { avatar_url: uploadedAvatarUrl } : {}),
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to update profile")

      if (uploadedAvatarUrl) setAvatarUrl(uploadedAvatarUrl)
      setSuccess("Profile updated successfully")
      // Close after short delay
      setTimeout(() => onOpenChange(false), 800)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update profile")
    } finally {
      setLoading(false)
      setPassword("")
      setConfirmPassword("")
      setSelectedFile(null)
      setPreviewUrl("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
          <DialogDescription>Update your basic information. Changes sync to your account.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          {error && (
            <div role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>
          )}
          {success && (
            <div role="status" className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">{success}</div>
          )}

          {/* Avatar Section */}
          <div className="grid gap-2">
            <Label>Avatar</Label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                {previewUrl || avatarUrl ? (
                  <Image src={previewUrl || avatarUrl} alt="Avatar preview" width={64} height={64} className="w-16 h-16 object-cover" />
                ) : (
                  <div className="w-16 h-16" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null
                    setSelectedFile(f || null)
                    if (f) setPreviewUrl(URL.createObjectURL(f))
                  }}
                  disabled={fetching || loading}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Use a square image for best results. Max ~2MB recommended.</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="first_name">First name</Label>
            <Input id="first_name" value={profile.first_name} onChange={(e) => setProfile(p => ({ ...p, first_name: e.target.value }))} placeholder="John" disabled={fetching || loading} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="last_name">Last name</Label>
            <Input id="last_name" value={profile.last_name} onChange={(e) => setProfile(p => ({ ...p, last_name: e.target.value }))} placeholder="Doe" disabled={fetching || loading} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={profile.email} onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))} placeholder="you@example.com" disabled={fetching || loading} />
            <p className="text-xs text-muted-foreground">Changing email may require confirmation.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={profile.phone} onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="255700000000" disabled={fetching || loading} />
          </div>

          <div className="grid gap-2 pt-1">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" disabled={fetching || loading} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" disabled={fetching || loading} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading || fetching}>{loading ? "Saving..." : "Save"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
