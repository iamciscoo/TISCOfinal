import { createClient } from '@supabase/supabase-js'
import { withMiddleware, withErrorHandler, createSuccessResponse } from '@/lib/middleware'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/categories
export const GET = withMiddleware(
  withErrorHandler
)(async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) throw error

  return Response.json(createSuccessResponse(data))
})
