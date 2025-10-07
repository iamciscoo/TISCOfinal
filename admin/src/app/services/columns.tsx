'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
        <Button variant="ghost" className="h-9 w-9 sm:h-8 sm:w-8 p-0">
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
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        checked={row.getIsSelected()}
      />
    ),
    enableHiding: false,
  },
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => {
      const service = row.original
      return (
        <div className="flex items-center gap-2 min-w-[150px] sm:min-w-[200px]">
          {service.image && (
            <img
              src={service.image}
              alt={service.title}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover flex-shrink-0"
            />
          )}
          <div className="min-w-0">
            <div className="font-medium text-xs sm:text-sm truncate">{service.title}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-[200px] hidden sm:block">
              {service.description}
            </div>
          </div>
        </div>
      )
    },
    enableHiding: false,
  },
  {
    accessorKey: 'duration',
    header: 'Duration',
    cell: ({ row }) => {
      return <Badge variant="secondary" className="text-xs whitespace-nowrap">{row.getValue('duration')}</Badge>
    },
    enableHiding: true,
    meta: { hideOnMobile: true },
  },
  {
    accessorKey: 'features',
    header: 'Features',
    cell: ({ row }) => {
      const features = row.getValue('features') as string[]
      return (
        <div className="max-w-[200px]">
          {features?.length > 0 ? (
            <span className="text-xs sm:text-sm text-muted-foreground">
              {features.length} feature{features.length !== 1 ? 's' : ''}
            </span>
          ) : (
            <span className="text-xs sm:text-sm text-muted-foreground">No features</span>
          )}
        </div>
      )
    },
    enableHiding: true,
    meta: { hideOnMobile: true },
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    cell: ({ row }) => {
      const date = new Date(row.getValue('created_at'))
      return <div className="text-xs sm:text-sm whitespace-nowrap">{date.toLocaleDateString()}</div>
    },
    enableHiding: true,
    meta: { hideOnMobile: true },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => <ActionsCell service={row.original} />,
  },
]

