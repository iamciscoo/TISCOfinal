import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

/**
 * GET /api/admin/payment-details
 * Fetches the active payment details from the database
 */
export async function GET() {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 500 }
      )
    }

    // Get the most recent active payment details
    const { data: paymentDetails, error } = await supabase
      .from('payment_details')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is not an error
      console.error('Error fetching payment details:', error)
      return NextResponse.json(
        { error: 'Failed to fetch payment details' },
        { status: 500 }
      )
    }

    return NextResponse.json({ paymentDetails: paymentDetails || null })
  } catch (error) {
    console.error('Error in GET /api/admin/payment-details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/payment-details
 * Saves payment details to the database
 */
export async function POST(request: Request) {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 500 }
      )
    }
    
    const body = await request.json()

    // Check if a record exists
    const { data: existing } = await supabase
      .from('payment_details')
      .select('id')
      .limit(1)
      .single()

    const paymentData = {
      bank_name: body.bank_name || null,
      account_number: body.account_number || null,
      account_name: body.account_name || null,
      mpesa_number: body.mpesa_number || null,
      tigo_pesa_number: body.tigo_pesa_number || null,
      airtel_money_number: body.airtel_money_number || null,
      lipa_number: body.lipa_number || null,
      payment_instructions: body.payment_instructions || null,
      is_active: true,
      updated_at: new Date().toISOString()
    }

    let data, error

    if (existing) {
      // Update existing record
      const result = await supabase
        .from('payment_details')
        .update(paymentData)
        .eq('id', existing.id)
        .select()
        .single()
      data = result.data
      error = result.error
    } else {
      // Insert new record (first time)
      const result = await supabase
        .from('payment_details')
        .insert(paymentData)
        .select()
        .single()
      data = result.data
      error = result.error
    }

    if (error) {
      console.error('Error saving payment details:', error)
      return NextResponse.json(
        { error: 'Failed to save payment details' },
        { status: 500 }
      )
    }

    return NextResponse.json({ paymentDetails: data })
  } catch (error) {
    console.error('Error in POST /api/admin/payment-details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
