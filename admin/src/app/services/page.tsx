import { Suspense } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { columns } from './columns'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

async function getServices() {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001')

  const res = await fetch(`${baseUrl}/api/services?limit=100`, {
    cache: 'no-store'
  })
  
  if (!res.ok) {
    throw new Error('Failed to fetch services')
  }
  
  return res.json()
}

export default async function ServicesPage() {
  const data = await getServices()

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Services</h1>
          <p className="text-muted-foreground">
            Manage your service offerings
          </p>
        </div>
        <Button asChild>
          <Link href="/services/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Link>
        </Button>
      </div>
      
      <Suspense fallback={<div>Loading services...</div>}>
        <DataTable 
          columns={columns} 
          data={data.services || []} 
          searchKey="title"
        />
      </Suspense>
    </div>
  )
}
