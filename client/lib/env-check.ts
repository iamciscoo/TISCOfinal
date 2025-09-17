// Environment variables validation
export function validateEnvironment() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar])
  
  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables: ${missing.join(', ')}`
    console.error('[ENV] ' + errorMessage)
    if (process.env.NODE_ENV === 'development') {
      throw new Error(errorMessage)
    } else {
      // In production, log error but provide fallback to prevent crashes
      console.error('[ENV] Using fallback environment configuration')
      return {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      }
    }
  }

  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  }
}

// Safe environment check that doesn't throw
export function checkEnvironment() {
  try {
    return validateEnvironment()
  } catch (error) {
    console.error('Environment validation failed:', error)
    return null
  }
}
