'use client'

import { useEffect, useState } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface ArchivedService {
  id: string
  title: string
  duration: string | null
  display_order: number
  created_at: string
}

export default function ArchivedServicesPage() {
  const { toast } = useToast()
  const [services, setServices] = useState<ArchivedService[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    fetchArchivedServices()
  }, [])

  async function fetchArchivedServices() {
    try {
      const res = await fetch('/api/services?include_archived=true', {
        cache: 'no-store'
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      
      // Filter for archived only (API returns all if include_archived=true)
      const archived = (data.services || []).filter((s: any) => s.is_active === false)
      setServices(archived)
      setTotalCount(archived.length)
    } catch (error) {
      console.error('Error fetching archived services:', error)
      toast({
        title: 'Error',
        description: 'Failed to load archived services',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleRestore(id: string) {
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: true })
      })
      
      if (!res.ok) throw new Error('Failed to restore')
      
      toast({
        title: 'Success',
        description: 'Service restored successfully'
      })
      
      // Refresh the list
      fetchArchivedServices()
    } catch (error) {
      console.error('Failed to restore service:', error)
      toast({
        title: 'Error',
        description: 'Failed to restore service',
        variant: 'destructive'
      })
    }
  }

  // Define columns with restore action
  const archivedColumns = [
    {
      accessorKey: 'title',
      header: 'Title',
    },
    {
      accessorKey: 'duration',
      header: 'Duration',
      cell: ({ row }: any) => row.original.duration || 'N/A'
    },
    {
      accessorKey: 'display_order',
      header: 'Order',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleRestore(row.original.id)}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Restore
        </Button>
      )
    }
  ]

  return (
    <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 lg:py-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Archived Services</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            View and restore archived service offerings
          </p>
        </div>
        <Button asChild variant="outline" className="w-full sm:w-auto h-11 sm:h-10 min-h-[44px] sm:min-h-0">
          <Link href="/services">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Services
          </Link>
        </Button>
      </div>
      
      {loading ? (
        <div className="text-center py-8 text-sm sm:text-base">Loading archived services...</div>
      ) : (
        <>
          {services.length > 0 ? (
            <div className="bg-muted/50 p-4 rounded-lg mb-4">
              <p className="text-sm text-muted-foreground">
                <strong>{totalCount}</strong> archived service{totalCount !== 1 ? 's' : ''} found. 
                Click "Restore" to make a service active again.
              </p>
            </div>
          ) : null}
          
          {services.length > 0 ? (
            <DataTable 
              columns={archivedColumns} 
              data={services} 
              searchKey="title"
              entityName="Archived Service"
            />
          ) : (
            <div className="text-center py-8 sm:py-10 px-4">
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                No archived services found.
              </p>
              <Button asChild variant="outline" className="w-full sm:w-auto h-11 sm:h-10 min-h-[44px] sm:min-h-0">
                <Link href="/services">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Services
                </Link>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
