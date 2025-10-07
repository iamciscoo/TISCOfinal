'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function AuthDebugger() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      try {
        
        // Get session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        // Get user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        // Check cookies
        const cookies = document.cookie
        const authCookies = cookies.split(';')
          .map(c => c.trim())
          .filter(c => c.includes('auth-token'))
        
        setDebugInfo({
          hasSession: !!session,
          hasUser: !!user,
          userId: user?.id || 'none',
          userEmail: user?.email || 'none',
          sessionError: sessionError?.message || 'none',
          userError: userError?.message || 'none',
          cookieCount: authCookies.length,
          cookies: authCookies.length > 0 ? authCookies.map(c => {
            const [name] = c.split('=')
            return name
          }) : ['NONE FOUND'],
          allCookies: cookies.substring(0, 200) + '...'
        })
      } catch (error) {
        setDebugInfo({
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      } finally {
        setChecking(false)
      }
    }
    
    checkAuth()
  }, [])

  if (process.env.NODE_ENV === 'production') return null

  return (
    <div className="fixed bottom-4 left-4 z-[9999] bg-black/90 text-white p-4 rounded-lg text-xs max-w-md max-h-96 overflow-auto">
      <h3 className="font-bold text-sm mb-2">🔍 Auth Debug Info</h3>
      {checking ? (
        <p>Checking auth status...</p>
      ) : (
        <pre className="whitespace-pre-wrap">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      )}
    </div>
  )
}
