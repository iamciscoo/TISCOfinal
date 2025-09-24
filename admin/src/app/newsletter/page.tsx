'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Loader2, Mail } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Subscriber {
  id: string
  email: string
  source?: string | null
  is_subscribed?: boolean | null
  unsubscribed_at?: string | null
  created_at: string
}

export default function NewsletterPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<Subscriber[]>([])
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (q.trim()) params.set('q', q.trim())
      if (status) params.set('status', status)
      const res = await fetch(`/api/newsletter?${params.toString()}`)
      const response = await res.json()
      if (!res.ok) throw new Error(response?.error || 'Failed to load subscribers')
      const data = response.data || response
      setItems(data.subscribers || [])
      setTotalPages(data.totalPages || 1)
      setTotalCount(data.totalCount || 0)
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, status])

  const handleSearch = () => {
    setPage(1)
    fetchData()
  }

  const columns: ColumnDef<Subscriber>[] = [
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'source',
      header: 'Source',
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.source || '-'}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.is_subscribed === false ? "destructive" : "default"}>
          {row.original.is_subscribed === false ? "Unsubscribed" : "Subscribed"}
        </Badge>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => <span className="text-sm">{new Date(row.original.created_at).toLocaleString()}</span>,
    },
  ]

  const stats = useMemo(() => {
    const current = items
    const subs = current.filter(item => item.is_subscribed !== false).length
    const unsubs = current.filter(item => item.is_subscribed === false).length
    return { total: totalCount, subs, unsubs }
  }, [items, totalCount])

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2"><Mail className="w-7 h-7" /> Newsletter</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All subscribers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Subscribed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.subs}</div>
            <p className="text-xs text-muted-foreground">Currently subscribed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Unsubscribed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unsubs}</div>
            <p className="text-xs text-muted-foreground">Opted out</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscribers</CardTitle>
          <CardDescription>View newsletter subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search (email, source)"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-72"
              />
              <Button variant="outline" onClick={handleSearch}>Search</Button>
            </div>
            <div className="flex gap-2 items-center">
              <select
                className="border rounded px-2 py-2 text-sm"
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1) }}
              >
                <option value="">All Subscribers</option>
                <option value="subscribed">Subscribed</option>
                <option value="unsubscribed">Unsubscribed</option>
              </select>
              <div className="text-sm text-muted-foreground">Page {page} / {totalPages}</div>
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
              </div>
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <DataTable columns={columns} data={items} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
