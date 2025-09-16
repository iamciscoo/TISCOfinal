'use client'

import { useState, useEffect } from 'react'

interface EmailEvent {
  name: string
  description: string
  trigger: string
  testData: Record<string, any>
}

interface EmailEvents {
  [key: string]: EmailEvent
}

interface CustomStyles {
  headerColor?: string
  accentColor?: string
  textColor?: string
  backgroundColor?: string
  fontFamily?: string
  borderRadius?: string
}

export default function EmailStudioPage() {
  const [emailEvents, setEmailEvents] = useState<EmailEvents>({})
  const [currentEventType, setCurrentEventType] = useState<string | null>(null)
  const [currentViewMode, setCurrentViewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [customStyles, setCustomStyles] = useState<CustomStyles>({
    headerColor: '#1e293b',
    accentColor: '#2563eb',
    textColor: '#374151',
    backgroundColor: '#f8fafc',
    fontFamily: 'Segoe UI',
    borderRadius: '12px'
  })
  const [currentTemplate, setCurrentTemplate] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadEmailEvents()
  }, [])

  const loadEmailEvents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/email-events')
      const data = await response.json()
      
      if (data.success) {
        setEmailEvents(data.events)
      } else {
        setError('Failed to load email events: ' + data.error)
      }
    } catch (error) {
      setError('Network error loading email events: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const selectEmailEvent = async (eventType: string) => {
    setCurrentEventType(eventType)
    setLoading(true)
    setError(null)
    
    try {
      await loadEmailPreview(eventType)
    } catch (error) {
      setError('Failed to load email preview: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const loadEmailPreview = async (eventType: string) => {
    const response = await fetch('/api/admin/email-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: eventType,
        custom_styles: customStyles
      })
    })
    
    const data = await response.json()
    
    if (data.success) {
      setCurrentTemplate(data.html)
    } else {
      throw new Error(data.error)
    }
  }

  const applyCustomStyles = async () => {
    if (!currentEventType) return
    
    setLoading(true)
    try {
      await loadEmailPreview(currentEventType)
    } catch (error) {
      setError('Failed to apply custom styles: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const exportHTML = async () => {
    if (!currentEventType || !currentTemplate) {
      alert('Please select an email template first')
      return
    }
    
    const blob = new Blob([currentTemplate], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentEventType}_email_template.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800 to-slate-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-xl">
              📧
            </div>
            <div>
              <h1 className="text-2xl font-bold">TISCO Email Template Studio</h1>
              <p className="text-slate-300 text-sm">Design and customize your email templates</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Email Events</h3>
            
            {loading && Object.keys(emailEvents).length === 0 && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-slate-600">Loading events...</span>
              </div>
            )}

            <div className="space-y-2 mb-6">
              {Object.entries(emailEvents).map(([eventType, eventData]) => (
                <button
                  key={eventType}
                  onClick={() => selectEmailEvent(eventType)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    currentEventType === eventType
                      ? 'bg-blue-100 border-2 border-blue-500 text-blue-800'
                      : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                  }`}
                >
                  <div className="font-medium text-sm">{eventData.name}</div>
                  <div className="text-xs text-slate-500 mt-1">{eventData.trigger}</div>
                </button>
              ))}
            </div>

            {/* Style Controls */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Customize Styling</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                    Header Color
                  </label>
                  <input
                    type="color"
                    value={customStyles.headerColor}
                    onChange={(e) => setCustomStyles({...customStyles, headerColor: e.target.value})}
                    className="w-full h-8 rounded border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                    Accent Color
                  </label>
                  <input
                    type="color"
                    value={customStyles.accentColor}
                    onChange={(e) => setCustomStyles({...customStyles, accentColor: e.target.value})}
                    className="w-full h-8 rounded border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                    Text Color
                  </label>
                  <input
                    type="color"
                    value={customStyles.textColor}
                    onChange={(e) => setCustomStyles({...customStyles, textColor: e.target.value})}
                    className="w-full h-8 rounded border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                    Background Color
                  </label>
                  <input
                    type="color"
                    value={customStyles.backgroundColor}
                    onChange={(e) => setCustomStyles({...customStyles, backgroundColor: e.target.value})}
                    className="w-full h-8 rounded border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                    Font Family
                  </label>
                  <select
                    value={customStyles.fontFamily}
                    onChange={(e) => setCustomStyles({...customStyles, fontFamily: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded text-sm"
                  >
                    <option value="Segoe UI">Segoe UI</option>
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Roboto">Roboto</option>
                  </select>
                </div>

                <button
                  onClick={applyCustomStyles}
                  disabled={!currentEventType}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Apply Styles
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Toolbar */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  loading ? 'bg-yellow-500' : error ? 'bg-red-500' : currentTemplate ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
                <span className="font-medium text-slate-700">
                  {currentEventType ? emailEvents[currentEventType]?.name : 'Select an email template'}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentViewMode('desktop')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    currentViewMode === 'desktop'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Desktop
                </button>
                <button
                  onClick={() => setCurrentViewMode('mobile')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    currentViewMode === 'mobile'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Mobile
                </button>
                <button
                  onClick={exportHTML}
                  disabled={!currentTemplate}
                  className="px-3 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Export HTML
                </button>
              </div>
            </div>
          </div>

          {/* Preview Container */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-[600px] relative">
              {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-slate-600">Loading template...</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-red-500 text-lg mb-2">⚠️</div>
                    <p className="text-red-600 font-medium">Error loading template</p>
                    <p className="text-red-500 text-sm mt-1">{error}</p>
                  </div>
                </div>
              )}

              {!currentTemplate && !loading && !error && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    <div className="text-4xl mb-4">📧</div>
                    <p>Select an email template to preview</p>
                  </div>
                </div>
              )}

              {currentTemplate && (
                <div className={`h-full ${currentViewMode === 'mobile' ? 'flex items-center justify-center bg-slate-100' : ''}`}>
                  <div className={currentViewMode === 'mobile' ? 'w-[375px] h-[600px] border-8 border-slate-800 rounded-[20px] overflow-hidden shadow-xl' : 'w-full h-full'}>
                    <iframe
                      srcDoc={currentTemplate}
                      className="w-full h-full border-none"
                      title="Email Preview"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
