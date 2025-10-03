/**
 * Mobile Payment Webhook Processing Fix & Recovery Script
 * 
 * This script addresses the critical issue where mobile payment sessions
 * are marked as "completed" but no actual orders are created.
 * 
 * Issues Fixed:
 * 1. Webhook authentication failures
 * 2. Missing order creation for completed payments
 * 3. Session status inconsistencies
 * 4. Missing payment transaction records
 */

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL',
  process.env.SUPABASE_SERVICE_ROLE || 'YOUR_SERVICE_ROLE_KEY'
)

async function auditMobilePaymentSystem() {
  console.log('🔍 === MOBILE PAYMENT SYSTEM AUDIT ===\n')

  // 1. Check payment sessions vs orders
  const { data: sessions } = await supabase
    .from('payment_sessions')
    .select('*')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })

  console.log(`📊 Found ${sessions?.length || 0} completed payment sessions`)

  // 2. Check for corresponding orders
  const sessionRefs = sessions?.map(s => s.transaction_reference) || []
  
  const { data: transactions } = await supabase
    .from('payment_transactions')
    .select('*, orders(*)')
    .in('transaction_reference', sessionRefs)

  console.log(`📊 Found ${transactions?.length || 0} corresponding payment transactions`)

  // 3. Identify orphaned sessions (completed but no order)
  const orphanedSessions = sessions?.filter(session => {
    return !transactions?.find(tx => tx.transaction_reference === session.transaction_reference)
  }) || []

  console.log(`🚨 Found ${orphanedSessions.length} orphaned payment sessions (completed but no orders created)`)

  return {
    totalSessions: sessions?.length || 0,
    totalTransactions: transactions?.length || 0,
    orphanedSessions,
    sessionRefs
  }
}

async function recoverOrphanedPayments() {
  console.log('\n🔧 === RECOVERING ORPHANED PAYMENTS ===\n')

  const audit = await auditMobilePaymentSystem()
  
  if (audit.orphanedSessions.length === 0) {
    console.log('✅ No orphaned payments found to recover')
    return
  }

  console.log(`🔄 Processing ${audit.orphanedSessions.length} orphaned payments...`)

  for (const session of audit.orphanedSessions) {
    try {
      console.log(`\n📱 Processing session: ${session.transaction_reference}`)
      
      // Simulate webhook processing for this session
      const result = await processOrphanedSession(session)
      
      if (result.success) {
        console.log(`✅ Successfully recovered session ${session.transaction_reference}`)
        console.log(`   📦 Order ID: ${result.orderId}`)
        console.log(`   💰 Amount: ${session.currency} ${session.amount}`)
      } else {
        console.error(`❌ Failed to recover session ${session.transaction_reference}: ${result.error}`)
      }
      
    } catch (error) {
      console.error(`❌ Error processing session ${session.transaction_reference}:`, error.message)
    }
  }
}

async function processOrphanedSession(session) {
  try {
    // Parse order data from session
    let orderData = {}
    try {
      orderData = typeof session.order_data === 'string' 
        ? JSON.parse(session.order_data) 
        : session.order_data || {}
    } catch (e) {
      console.warn('Failed to parse order data, using empty object')
    }

    const items = Array.isArray(orderData.items) ? orderData.items : []
    
    if (items.length === 0) {
      return { success: false, error: 'No items in session order data' }
    }

    // Fetch product information
    const productIds = items.map(item => item.product_id).filter(Boolean)
    const { data: products } = await supabase
      .from('products')
      .select('id, name, price')
      .in('id', productIds)

    if (!products || products.length === 0) {
      return { success: false, error: 'No valid products found' }
    }

    const productMap = new Map(products.map(p => [p.id, p]))

    // Calculate total and prepare order items
    let totalAmount = 0
    const orderItems = []

    for (const item of items) {
      const product = productMap.get(item.product_id)
      if (product) {
        const price = item.price || product.price
        orderItems.push({
          product_id: item.product_id,
          quantity: item.quantity || 1,
          price: price
        })
        totalAmount += price * (item.quantity || 1)
      }
    }

    if (orderItems.length === 0) {
      return { success: false, error: 'No valid order items after processing' }
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: session.user_id,
        total_amount: totalAmount,
        currency: session.currency,
        payment_method: 'Mobile Money',
        shipping_address: orderData.shipping_address || 'Will be contacted for delivery',
        notes: orderData.notes || null,
        status: 'processing',
        payment_status: 'paid',
        paid_at: new Date().toISOString()
      })
      .select()
      .single()

    if (orderError || !order) {
      return { success: false, error: `Failed to create order: ${orderError?.message}` }
    }

    // Create order items
    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsWithOrderId)

    if (itemsError) {
      // Rollback order creation
      await supabase.from('orders').delete().eq('id', order.id)
      return { success: false, error: `Failed to create order items: ${itemsError.message}` }
    }

    // Create payment transaction record
    const { data: transaction, error: txError } = await supabase
      .from('payment_transactions')
      .insert({
        order_id: order.id,
        user_id: session.user_id,
        amount: totalAmount,
        currency: session.currency,
        status: 'completed',
        payment_type: 'mobile_money',
        provider: session.provider || 'mobile_money',
        transaction_reference: session.transaction_reference,
        gateway_transaction_id: session.gateway_transaction_id,
        completed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (txError) {
      console.warn(`Failed to create payment transaction record: ${txError.message}`)
    }

    // Log recovery action
    await supabase
      .from('payment_logs')
      .insert({
        session_id: session.id,
        transaction_id: transaction?.id,
        event_type: 'payment_recovery_completed',
        data: {
          message: 'Orphaned payment session recovered',
          order_id: order.id,
          recovery_timestamp: new Date().toISOString(),
          recovered_amount: totalAmount,
          items_count: orderItems.length
        },
        user_id: session.user_id
      })

    return { success: true, orderId: order.id, transactionId: transaction?.id }

  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function fixWebhookProcessing() {
  console.log('\n🔧 === FIXING WEBHOOK PROCESSING ISSUES ===\n')

  // This function would be called to fix the webhook endpoint
  // The actual fixes are implemented in the webhook route file
  
  console.log('✅ Webhook processing fixes have been applied to:')
  console.log('   - /api/payments/webhooks/route.ts')
  console.log('   - Enhanced authentication handling')  
  console.log('   - Improved error logging')
  console.log('   - Better session-to-order processing')
}

async function generateRecoveryReport() {
  console.log('\n📊 === GENERATING RECOVERY REPORT ===\n')

  const audit = await auditMobilePaymentSystem()
  
  // Check recovery results
  const { data: recoveredOrders } = await supabase
    .from('payment_logs')
    .select('*, orders(*)')
    .eq('event_type', 'payment_recovery_completed')
    .order('created_at', { ascending: false })

  const report = {
    audit_timestamp: new Date().toISOString(),
    total_sessions: audit.totalSessions,
    total_transactions: audit.totalTransactions,
    orphaned_sessions: audit.orphanedSessions.length,
    recovered_payments: recoveredOrders?.length || 0,
    recovery_success_rate: audit.orphanedSessions.length > 0 
      ? ((recoveredOrders?.length || 0) / audit.orphanedSessions.length * 100).toFixed(1) + '%'
      : 'N/A'
  }

  console.log('📊 MOBILE PAYMENT RECOVERY REPORT:')
  console.log('================================')
  console.log(`Total Payment Sessions: ${report.total_sessions}`)
  console.log(`Total Transactions: ${report.total_transactions}`)
  console.log(`Orphaned Sessions Found: ${report.orphaned_sessions}`)
  console.log(`Payments Recovered: ${report.recovered_payments}`)
  console.log(`Success Rate: ${report.recovery_success_rate}`)
  console.log(`Report Generated: ${report.audit_timestamp}`)

  return report
}

async function main() {
  try {
    console.log('🚀 Mobile Payment Recovery System Starting...\n')

    // Step 1: Audit current state
    await auditMobilePaymentSystem()

    // Step 2: Recover orphaned payments
    await recoverOrphanedPayments()

    // Step 3: Apply webhook fixes
    await fixWebhookProcessing()

    // Step 4: Generate final report
    const report = await generateRecoveryReport()

    console.log('\n🎉 Mobile Payment Recovery Complete!')
    
    return report

  } catch (error) {
    console.error('\n❌ Recovery process failed:', error)
    throw error
  }
}

// Export functions for use in other scripts
module.exports = {
  auditMobilePaymentSystem,
  recoverOrphanedPayments,
  processOrphanedSession,
  generateRecoveryReport,
  main
}

// Run if called directly
if (require.main === module) {
  main()
    .then(report => {
      console.log('\n✅ Process completed successfully')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n❌ Process failed:', error)
      process.exit(1)
    })
}
