import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const checks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      environment: process.env.NODE_ENV || 'unknown',
      deployment: process.env.VERCEL_URL ? 'vercel' : 'local',
      checks: {
        supabase: false,
        envVars: false,
        database: false
      }
    }

    // Check environment variables
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE
    const adminSecret = process.env.ADMIN_SESSION_SECRET

    checks.checks.envVars = !!(supabaseUrl && supabaseServiceRole && adminSecret)

    // Check Supabase connection
    if (supabaseUrl && supabaseServiceRole) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceRole)
        
        // Simple query to test database connection
        const { error: dbError } = await supabase
          .from('services')
          .select('id')
          .limit(1)

        checks.checks.supabase = true
        checks.checks.database = !dbError
        
        if (dbError) {
          console.error('Database health check failed:', dbError)
        }
      } catch (error) {
        console.error('Supabase health check failed:', error)
        checks.checks.supabase = false
      }
    }

    // Overall health status
    const allHealthy = Object.values(checks.checks).every(check => check === true)
    checks.status = allHealthy ? 'healthy' : 'degraded'

    const status = allHealthy ? 200 : 503

    return NextResponse.json(checks, { status })
  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: {
        supabase: false,
        envVars: false,
        database: false
      }
    }, { status: 500 })
  }
}
