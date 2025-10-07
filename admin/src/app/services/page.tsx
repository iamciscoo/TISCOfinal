import { Suspense } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { columns } from './columns'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

// Import direct database access for server components
import { createClient } from '@supabase/supabase-js'

async function getServices() {
  try {
    // Use direct database access in server components instead of fetch
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE

    if (!supabaseUrl || !supabaseServiceRole) {
      console.error('Missing Supabase environment variables in services page')
      return { services: [], totalCount: 0, totalPages: 0, currentPage: 1 }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRole)
    
    const { data, error, count } = await supabase
      .from('services')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching services directly from database:', error)
      return { services: [], totalCount: 0, totalPages: 0, currentPage: 1 }
    }

    return {
      services: data || [],
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / 100),
      currentPage: 1
    }
  } catch (error) {
    console.error('Error in getServices:', error)
    // Return empty services for graceful degradation
    return { services: [], totalCount: 0, totalPages: 0, currentPage: 1 }
  }
}

export default async function ServicesPage() {
  const data = await getServices()

  return (
    <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 lg:py-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Services</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your service offerings
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto h-11 sm:h-10 min-h-[44px] sm:min-h-0">
          <Link href="/services/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Link>
        </Button>
      </div>
      
      <Suspense fallback={<div className="text-center py-8 text-sm sm:text-base">Loading services...</div>}>
        {data.services && data.services.length > 0 ? (
          <DataTable 
            columns={columns} 
            data={data.services} 
            searchKey="title"
            entityName="Service"
            deleteApiBase="/api/services"
          />
        ) : (
          <div className="text-center py-8 sm:py-10 px-4">
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              {data.services?.length === 0 ? "No services found." : "Failed to load services. Please try again later."}
            </p>
            <Button asChild className="w-full sm:w-auto h-11 sm:h-10 min-h-[44px] sm:min-h-0">
              <Link href="/services/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Service
              </Link>
            </Button>
          </div>
        )}
      </Suspense>
    </div>
  )
}
