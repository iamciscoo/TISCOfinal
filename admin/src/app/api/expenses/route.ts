import { NextRequest, NextResponse } from 'next/server'
import { getExpenses, addExpense } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined
    const category = searchParams.get('category') || undefined
    const frequency = searchParams.get('frequency') || undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

    const expenses = await getExpenses({
      startDate,
      endDate,
      category,
      frequency,
      limit,
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const result = await addExpense(body)

    if (result.success) {
      return NextResponse.json(result.data, { status: 201 })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error creating expense:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create expense' },
      { status: 500 }
    )
  }
}
