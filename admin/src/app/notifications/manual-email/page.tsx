'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Mail, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  User,
  Calendar,
  MessageSquare,
  Settings
} from 'lucide-react'
import { toast } from 'sonner'

interface ManualEmailForm {
  recipient_email: string
  recipient_name: string
  subject: string
  message: string
  template_type: 'order_reminder' | 'custom' | 'promotional'
  order_id: string
  bypass_timeframe: boolean
}

interface RecentEmail {
  id: string
  title: string
  message: string
  created_at: string
  metadata: {
    template_type: string
    sent_by: string
    bypass_timeframe: boolean
    order_id?: string
  }
  notification_recipients: Array<{
    status: string
    sent_at: string
    users: {
      email: string
      first_name: string
      last_name: string
    }
  }>
}

const EMAIL_TEMPLATES = {
  order_reminder: {
    subject: 'Complete Your Order - Special Offer Inside!',
    message: `We noticed you have an incomplete order. Don't miss out on these great products!\n\nWe've reserved your items for 24 more hours. Complete your purchase now to secure these deals.`
  },
  promotional: {
    subject: 'Exclusive Deal Just for You! 🎉',
    message: `We have an amazing offer that's perfect for you!\n\nEnjoy special discounts on our latest products. This limited-time offer won't last long.`
  },
  custom: {
    subject: '',
    message: ''
  }
}

export default function ManualEmailPage() {
  const [form, setForm] = useState<ManualEmailForm>({
    recipient_email: '',
    recipient_name: '',
    subject: '',
    message: '',
    template_type: 'custom',
    order_id: '',
    bypass_timeframe: false
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [recentEmails, setRecentEmails] = useState<RecentEmail[]>([])
  const [isLoadingRecent, setIsLoadingRecent] = useState(true)
  const [canBypass, setCanBypass] = useState(false)
  const [restrictionMessage, setRestrictionMessage] = useState('')

  // Load recent emails
  useEffect(() => {
    fetchRecentEmails()
  }, [])

  const fetchRecentEmails = async () => {
    try {
      const response = await fetch('/api/notifications/manual-email')
      if (response.ok) {
        const data = await response.json()
        setRecentEmails(data.notifications)
      }
    } catch (error) {
      console.error('Failed to fetch recent emails:', error)
    } finally {
      setIsLoadingRecent(false)
    }
  }

  const handleTemplateChange = (templateType: 'order_reminder' | 'custom' | 'promotional') => {
    const template = EMAIL_TEMPLATES[templateType]
    setForm(prev => ({
      ...prev,
      template_type: templateType,
      subject: template.subject,
      message: template.message
    }))
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setCanBypass(false)
    setRestrictionMessage('')

    try {
      const response = await fetch('/api/notifications/manual-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form)
      })

      const data = await response.json()

      if (response.status === 429) {
        // One week restriction hit
        setCanBypass(data.canBypass)
        setRestrictionMessage(data.error)
        toast.error('Email sending restricted', {
          description: data.error
        })
      } else if (response.ok) {
        toast.success('Email sent successfully!', {
          description: `Sent to ${form.recipient_email}`
        })
        // Reset form
        setForm({
          recipient_email: '',
          recipient_name: '',
          subject: '',
          message: '',
          template_type: 'custom',
          order_id: '',
          bypass_timeframe: false
        })
        // Refresh recent emails
        fetchRecentEmails()
      } else {
        toast.error('Failed to send email', {
          description: data.error
        })
      }
    } catch (error) {
      toast.error('Network error', {
        description: 'Please check your connection and try again'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Mail className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manual Email Notifications</h1>
          <p className="text-sm text-gray-600">Send personalized emails to customers</p>
        </div>
      </div>

      <Tabs defaultValue="compose" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="compose" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Compose Email
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Emails
          </TabsTrigger>
        </TabsList>

        {/* Compose Email Tab */}
        <TabsContent value="compose">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Compose Email
              </CardTitle>
              <CardDescription>
                Send manual email notifications to customers. One-week restriction applies unless bypassed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSendEmail} className="space-y-6">
                {/* Template Selection */}
                <div className="space-y-2">
                  <Label htmlFor="template">Email Template</Label>
                  <Select 
                    value={form.template_type} 
                    onValueChange={handleTemplateChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom Message</SelectItem>
                      <SelectItem value="order_reminder">Order Reminder</SelectItem>
                      <SelectItem value="promotional">Promotional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Recipient Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient_email">Recipient Email *</Label>
                    <Input
                      id="recipient_email"
                      type="email"
                      placeholder="customer@example.com"
                      value={form.recipient_email}
                      onChange={(e) => setForm(prev => ({...prev, recipient_email: e.target.value}))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipient_name">Recipient Name *</Label>
                    <Input
                      id="recipient_name"
                      placeholder="John Doe"
                      value={form.recipient_name}
                      onChange={(e) => setForm(prev => ({...prev, recipient_name: e.target.value}))}
                      required
                    />
                  </div>
                </div>

                {/* Order ID (for order reminders) */}
                {form.template_type === 'order_reminder' && (
                  <div className="space-y-2">
                    <Label htmlFor="order_id">Order ID (optional)</Label>
                    <Input
                      id="order_id"
                      placeholder="Enter order ID for enhanced template"
                      value={form.order_id}
                      onChange={(e) => setForm(prev => ({...prev, order_id: e.target.value}))}
                    />
                  </div>
                )}

                {/* Email Content */}
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="Email subject"
                    value={form.subject}
                    onChange={(e) => setForm(prev => ({...prev, subject: e.target.value}))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Email message content..."
                    value={form.message}
                    onChange={(e) => setForm(prev => ({...prev, message: e.target.value}))}
                    rows={6}
                    required
                  />
                </div>

                {/* One-week restriction warning */}
                {restrictionMessage && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {restrictionMessage}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Bypass Option */}
                {canBypass && (
                  <div className="flex items-center space-x-2 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <Checkbox
                      id="bypass_timeframe"
                      checked={form.bypass_timeframe}
                      onCheckedChange={(checked) => 
                        setForm(prev => ({...prev, bypass_timeframe: checked as boolean}))
                      }
                    />
                    <Label htmlFor="bypass_timeframe" className="text-sm">
                      Override one-week restriction (Admin override)
                    </Label>
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full md:w-auto"
                >
                  {isLoading ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Email
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Emails Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Manual Emails
              </CardTitle>
              <CardDescription>
                View recently sent manual email notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRecent ? (
                <div className="flex items-center justify-center py-8">
                  <Clock className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Loading recent emails...</span>
                </div>
              ) : recentEmails.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No manual emails sent yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentEmails.map((email) => (
                    <div key={email.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{email.title}</h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {email.message}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-4">
                          {email.metadata.template_type}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Sent by {email.metadata.sent_by}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(email.created_at).toLocaleDateString()}
                        </div>
                        {email.metadata.bypass_timeframe && (
                          <Badge variant="secondary" className="text-xs">
                            Bypassed restriction
                          </Badge>
                        )}
                      </div>
                      
                      {email.notification_recipients.map((recipient, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-gray-50 rounded p-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span>{recipient.users.email}</span>
                            <span className="text-gray-500">
                              ({recipient.users.first_name} {recipient.users.last_name})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {recipient.status === 'sent' ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            )}
                            <span className="text-xs text-gray-500">
                              {new Date(recipient.sent_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
