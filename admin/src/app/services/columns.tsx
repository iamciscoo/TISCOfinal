'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

export type Service = {
  id: string
  title: string
  description: string
  features: string[]
  duration: string
  image: string
  gallery: string[]
  created_at: string
  updated_at: string
}

const ActionsCell = ({ service }: { service: Service }) => {
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this service?')) return

    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete service')

      toast({
        title: 'Success',
        description: 'Service deleted successfully'
      })
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete service',
        variant: 'destructive'
      })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/services/${service.id}`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const columns: ColumnDef<Service>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => {
      const service = row.original
      return (
        <div className="flex items-center space-x-2">
          {service.image && (
            <img
              src={service.image}
              alt={service.title}
              className="w-10 h-10 rounded object-cover"
            />
          )}
          <div>
            <div className="font-medium">{service.title}</div>
            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
              {service.description}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'duration',
    header: 'Duration',
    cell: ({ row }) => {
      return <Badge variant="secondary">{row.getValue('duration')}</Badge>
    },
  },
  {
    accessorKey: 'features',
    header: 'Features',
    cell: ({ row }) => {
      const features = row.getValue('features') as string[]
      return (
        <div className="max-w-[200px]">
          {features?.length > 0 ? (
            <span className="text-sm text-muted-foreground">
              {features.length} feature{features.length !== 1 ? 's' : ''}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">No features</span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    cell: ({ row }) => {
      const date = new Date(row.getValue('created_at'))
      return <div className="text-sm">{date.toLocaleDateString()}</div>
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <ActionsCell service={row.original} />,
  },
]

