import { NextRequest, NextResponse } from 'next/server'
import { notifyUserRegistered } from '@/lib/notifications/service'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, name } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    await notifyUserRegistered({
      email,
      name
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Welcome notification error:', error)
    return NextResponse.json(
      { error: 'Failed to send welcome notification' },
      { status: 500 }
    )
  }
}
