'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'

interface UserProfileData {
  id: string
  clerk_id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  avatar_url?: string
  email_verified: boolean
  phone_verified: boolean
  addresses?: Address[]
  orders?: Order[]
}

interface Address {
  id: string
  type: string
  first_name: string
  last_name: string
  company?: string
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  postal_code: string
  country: string
  phone?: string
  is_default: boolean
}

interface Order {
  id: string
  status: string
  total_amount: number
  created_at: string
}

export default function UserProfile() {
  const { user: clerkUser } = useUser()
  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<UserProfileData>>({})

  useEffect(() => {
    if (clerkUser) {
      fetchProfile()
    }
  }, [clerkUser])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/auth/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
        setFormData(data.user)
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load profile',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Profile fetch error:', error)
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
        setEditing(false)
        toast({
          title: 'Success',
          description: 'Profile updated successfully'
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update profile',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Profile update error:', error)
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive'
      })
    }
  }

  const syncProfile = async () => {
    try {
      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_profile' })
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Profile synced with authentication provider'
        })
        fetchProfile()
      } else {
        toast({
          title: 'Error',
          description: 'Failed to sync profile',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Profile sync error:', error)
      toast({
        title: 'Error',
        description: 'Failed to sync profile',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile Setup Required</CardTitle>
          <CardDescription>
            Your profile needs to be synced with our system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={syncProfile}>Sync Profile</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          User Profile
          <div className="space-x-2">
            {editing ? (
              <>
                <Button onClick={handleSave} size="sm">Save</Button>
                <Button onClick={() => setEditing(false)} variant="outline" size="sm">
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditing(true)} variant="outline" size="sm">
                Edit
              </Button>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Manage your account information and preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="first_name">First Name</Label>
            {editing ? (
              <Input
                id="first_name"
                value={formData.first_name || ''}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            ) : (
              <p className="text-sm font-medium">{profile.first_name}</p>
            )}
          </div>
          <div>
            <Label htmlFor="last_name">Last Name</Label>
            {editing ? (
              <Input
                id="last_name"
                value={formData.last_name || ''}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            ) : (
              <p className="text-sm font-medium">{profile.last_name}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{profile.email}</p>
            {profile.email_verified ? (
              <Badge variant="secondary">Verified</Badge>
            ) : (
              <Badge variant="destructive">Unverified</Badge>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          {editing ? (
            <Input
              id="phone"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{profile.phone || 'Not provided'}</p>
              {profile.phone_verified && profile.phone && (
                <Badge variant="secondary">Verified</Badge>
              )}
            </div>
          )}
        </div>

        {/* Account Statistics */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold">{profile.orders?.length || 0}</p>
            <p className="text-sm text-gray-600">Total Orders</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{profile.addresses?.length || 0}</p>
            <p className="text-sm text-gray-600">Addresses</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">
              {profile.orders?.filter(o => o.status === 'completed').length || 0}
            </p>
            <p className="text-sm text-gray-600">Completed Orders</p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button onClick={syncProfile} variant="outline" size="sm">
            Sync with Authentication Provider
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
