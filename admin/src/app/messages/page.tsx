'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Mail, Eye, Send } from 'lucide-react'

interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: 'new' | 'read' | 'responded' | 'closed'
  response?: string | null
  created_at: string
  responded_at?: string | null
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')

  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<ContactMessage | null>(null)
  const [responseText, setResponseText] = useState('')
  const [updating, setUpdating] = useState(false)

  const { toast } = useToast()

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (q.trim()) params.set('q', q.trim())
      if (status) params.set('status', status)

      const res = await fetch(`/api/messages?${params.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to load messages')

      setMessages(data.messages || [])
      setTotalPages(data.totalPages || 1)
      setTotalCount(data.totalCount || 0)
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [page, status])

  const handleSearch = () => {
    setPage(1)
    fetchMessages()
  }

  const openDetails = (msg: ContactMessage) => {
    setSelected(msg)
    setResponseText(msg.response || '')
    setOpen(true)
  }

  const updateMessage = async (updates: Partial<Pick<ContactMessage, 'status' | 'response'>>) => {
    if (!selected) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/messages/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to update message')

      toast({ title: 'Success', description: 'Message updated' })
      setOpen(false)
      setSelected(null)
      setResponseText('')
      fetchMessages()
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setUpdating(false)
    }
  }

  const stats = useMemo(() => {
    const current = messages
    return {
      total: totalCount,
      newCnt: current.filter(m => m.status === 'new').length,
      readCnt: current.filter(m => m.status === 'read').length,
      respondedCnt: current.filter(m => m.status === 'responded').length,
      closedCnt: current.filter(m => m.status === 'closed').length,
    }
  }, [messages, totalCount])

  const columns: ColumnDef<ContactMessage>[] = [
    {
      id: 'sender',
      accessorFn: (row) => row.name || '',
      header: 'Sender',
      cell: ({ row }) => (
        <div className="min-w-[120px]">
          <p className="font-medium text-xs sm:text-sm truncate">{row.original.name}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate hidden sm:block">{row.original.email}</p>
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: 'subject',
      header: 'Subject',
      cell: ({ row }) => (
        <div className="max-w-[150px] sm:max-w-sm truncate text-xs sm:text-sm">{row.original.subject}</div>
      ),
      enableHiding: true,
      meta: { hideOnMobile: true },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status
        const variant = s === 'new' ? 'secondary' : s === 'read' ? 'outline' : s === 'responded' ? 'default' : 'secondary'
        return <Badge variant={variant as any} className="text-xs whitespace-nowrap">{s[0].toUpperCase() + s.slice(1)}</Badge>
      },
      enableHiding: false,
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-xs sm:text-sm whitespace-nowrap">{new Date(row.original.created_at).toLocaleDateString()}</span>
      ),
      enableHiding: true,
      meta: { hideOnMobile: true },
    },
    {
      id: 'actions',
      header: 'Actions',
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => openDetails(row.original)} className="h-9 sm:h-8 min-h-[44px] sm:min-h-0">
            <Eye className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">View</span>
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2"><Mail className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" /> Messages</h1>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 sm:pb-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats.total}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">All messages</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 sm:pb-6">
            <CardTitle className="text-xs sm:text-sm font-medium">New</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats.newCnt}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Just arrived</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 sm:pb-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Responded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats.respondedCnt}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Replied</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 sm:pb-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Closed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats.closedCnt}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Contact Messages</CardTitle>
          <CardDescription className="text-xs sm:text-sm">View and respond to customer inquiries</CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Search..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="flex-1 h-10"
              />
              <Button variant="outline" onClick={handleSearch} className="w-full sm:w-auto h-10 min-h-[44px] sm:min-h-0">Search</Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
              <select
                className="border rounded px-3 py-2 text-sm h-10"
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1) }}
              >
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="responded">Responded</option>
                <option value="closed">Closed</option>
              </select>
              <div className="flex items-center justify-between sm:justify-end gap-2">
                <div className="text-xs sm:text-sm text-muted-foreground">Page {page} / {totalPages}</div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="h-10 min-h-[44px] sm:min-h-0">Prev</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="h-10 min-h-[44px] sm:min-h-0">Next</Button>
                </div>
              </div>
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <DataTable 
              columns={columns} 
              data={messages} 
              entityName="Message"
              deleteApiBase="/api/messages"
            />
          )}
        </CardContent>
      </Card>

      {/* Details / Respond Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        {selected && (
          <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto" aria-describedby={undefined}>
            <SheetHeader>
              <SheetTitle className="text-base sm:text-lg">Message from {selected.name}</SheetTitle>
            </SheetHeader>

            <div className="space-y-4 px-4 mt-4">
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{selected.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Subject</p>
                <p className="font-medium">{selected.subject}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Message</p>
                <p className="whitespace-pre-line">{selected.message}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <div className="flex items-center gap-2">
                  <Badge>{selected.status}</Badge>
                  {selected.status === 'new' && (
                    <Button size="sm" variant="outline" onClick={() => updateMessage({ status: 'read' })}>Mark as Read</Button>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Response</p>
                <Textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Type your response here..."
                  rows={6}
                />
              </div>
            </div>

            <SheetFooter>
              <div className="flex gap-2 w-full">
                <Button className="flex-1" disabled={updating} onClick={() => updateMessage({ response: responseText, status: 'responded' })}>
                  {updating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Send Response
                </Button>
                <Button className="flex-1" variant="outline" disabled={updating} onClick={() => updateMessage({ status: 'closed' })}>Close</Button>
              </div>
            </SheetFooter>
          </SheetContent>
        )}
      </Sheet>
    </div>
  )
}
