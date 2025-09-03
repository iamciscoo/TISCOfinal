import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withMiddleware, withErrorHandler, createSuccessResponse } from '@/lib/middleware'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

// GET /api/categories
export const GET = withMiddleware(
  withErrorHandler
)(async (req: NextRequest) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) throw error

  return Response.json(createSuccessResponse(data))
})
