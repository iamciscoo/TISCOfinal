'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'

/**
 * SessionTracker Component
 * 
 * Automatically tracks user sessions with device, browser, and OS information
 * Updates session activity every 5 minutes
 */

// Helper to detect device type
function getDeviceType(): 'desktop' | 'tablet' | 'mobile' {
  if (typeof window === 'undefined') return 'desktop'
  
  const ua = navigator.userAgent
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet'
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile'
  }
  return 'desktop'
}

// Helper to detect OS
function getOS(): { name: string; version: string } {
  if (typeof window === 'undefined') return { name: 'Unknown', version: '' }
  
  const ua = navigator.userAgent
  const platform = navigator.platform || ''
  
  let osName = 'Unknown'
  let osVersion = ''
  
  if (/Windows/.test(ua)) {
    osName = 'Windows'
    if (/Windows NT 10.0/.test(ua)) osVersion = '10/11'
    else if (/Windows NT 6.3/.test(ua)) osVersion = '8.1'
    else if (/Windows NT 6.2/.test(ua)) osVersion = '8'
    else if (/Windows NT 6.1/.test(ua)) osVersion = '7'
  } else if (/Mac OS X/.test(ua)) {
    osName = 'macOS'
    const match = ua.match(/Mac OS X ([\d._]+)/)
    if (match) osVersion = match[1].replace(/_/g, '.')
  } else if (/Linux/.test(platform)) {
    osName = 'Linux'
  } else if (/Android/.test(ua)) {
    osName = 'Android'
    const match = ua.match(/Android ([\d.]+)/)
    if (match) osVersion = match[1]
  } else if (/iPhone|iPad|iPod/.test(ua)) {
    osName = 'iOS'
    const match = ua.match(/OS ([\d_]+)/)
    if (match) osVersion = match[1].replace(/_/g, '.')
  }
  
  return { name: osName, version: osVersion }
}

// Helper to detect browser
function getBrowser(): { name: string; version: string } {
  if (typeof window === 'undefined') return { name: 'Unknown', version: '' }
  
  const ua = navigator.userAgent
  let browserName = 'Unknown'
  let browserVersion = ''
  
  if (/Firefox\//.test(ua)) {
    browserName = 'Firefox'
    const match = ua.match(/Firefox\/([\d.]+)/)
    if (match) browserVersion = match[1]
  } else if (/Edg\//.test(ua)) {
    browserName = 'Edge'
    const match = ua.match(/Edg\/([\d.]+)/)
    if (match) browserVersion = match[1]
  } else if (/Chrome\//.test(ua) && !/Edg/.test(ua)) {
    browserName = 'Chrome'
    const match = ua.match(/Chrome\/([\d.]+)/)
    if (match) browserVersion = match[1]
  } else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) {
    browserName = 'Safari'
    const match = ua.match(/Version\/([\d.]+)/)
    if (match) browserVersion = match[1]
  } else if (/Opera|OPR\//.test(ua)) {
    browserName = 'Opera'
    const match = ua.match(/(Opera|OPR)\/([\d.]+)/)
    if (match) browserVersion = match[2]
  }
  
  return { name: browserName, version: browserVersion }
}

// Generate or retrieve session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  
  const STORAGE_KEY = 'session_id'
  const SESSION_DURATION = 30 * 60 * 1000 // 30 minutes
  
  const stored = sessionStorage.getItem(STORAGE_KEY)
  const timestamp = sessionStorage.getItem(`${STORAGE_KEY}_timestamp`)
  
  // Check if session is still valid
  if (stored && timestamp) {
    const elapsed = Date.now() - parseInt(timestamp)
    if (elapsed < SESSION_DURATION) {
      return stored
    }
  }
  
  // Generate new session ID
  const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  sessionStorage.setItem(STORAGE_KEY, newSessionId)
  sessionStorage.setItem(`${STORAGE_KEY}_timestamp`, Date.now().toString())
  
  return newSessionId
}

export function SessionTracker() {
  const { user } = useAuth()
  const hasTrackedRef = useRef(false)
  const activityIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Only track once per page load
    if (hasTrackedRef.current) return
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
    
    const trackSession = async () => {
      try {
        const sessionId = getSessionId()
        const deviceType = getDeviceType()
        const os = getOS()
        const browser = getBrowser()
        
        const sessionData = {
          user_id: user?.id || null,
          session_id: sessionId,
          device_type: deviceType,
          os_name: os.name,
          os_version: os.version,
          browser_name: browser.name,
          browser_version: browser.version,
          landing_page: window.location.pathname + window.location.search,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent
        }

        await fetch('/api/analytics/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionData)
        })

        hasTrackedRef.current = true

        // Update session activity every 5 minutes
        activityIntervalRef.current = setInterval(async () => {
          await fetch('/api/analytics/session', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId })
          })
        }, 5 * 60 * 1000) // 5 minutes
      } catch (error) {
        console.error('Failed to track session:', error)
      }
    }

    trackSession()

    return () => {
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current)
      }
    }
  }, [user])

  return null // This component doesn't render anything
}
