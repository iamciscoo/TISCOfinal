/**
 * Debug Script for Product-Specific Notifications
 * 
 * This script helps debug and test product-specific notification assignments
 * Run with: node debug-product-notifications.js
 */

const { createClient } = require('@supabase/supabase-js')

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE || 'your-service-key'

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || SUPABASE_URL.includes('your-')) {
  console.error('❌ Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function debugProductNotifications() {
  console.log('🔍 === PRODUCT-SPECIFIC NOTIFICATION DEBUG ===\n')
  
  try {
    // 1. Check notification recipients table
    console.log('1️⃣  Fetching notification recipients...')
    const { data: recipients, error: recipientsError } = await supabase
      .from('notification_recipients')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (recipientsError) {
      console.error('❌ Error fetching recipients:', recipientsError)
      return
    }
    
    console.log(`✅ Found ${recipients?.length || 0} recipients`)
    
    if (recipients && recipients.length > 0) {
      console.log('\n📋 Recipients breakdown:')
      recipients.forEach((recipient, index) => {
        console.log(`   ${index + 1}. ${recipient.email}`)
        console.log(`      Name: ${recipient.name || 'N/A'}`)
        console.log(`      Active: ${recipient.is_active ? '✅' : '❌'}`)
        console.log(`      Department: ${recipient.department || 'N/A'}`)
        console.log(`      Categories: [${(recipient.notification_categories || ['all']).join(', ')}]`)
        console.log(`      Assigned Products: ${recipient.assigned_product_ids ? `[${recipient.assigned_product_ids.join(', ')}]` : 'None'}`)
        console.log(`      Created: ${new Date(recipient.created_at).toLocaleString()}`)
        console.log('')
      })
    }
    
    // 2. Check products table for reference
    console.log('\n2️⃣  Fetching sample products for reference...')
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price')
      .limit(10)
    
    if (productsError) {
      console.error('❌ Error fetching products:', productsError)
    } else {
      console.log(`✅ Sample products (first 10):`)
      products?.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.id} - ${product.name} (${product.price})`)
      })
    }
    
    // 3. Check for recent orders and their items
    console.log('\n3️⃣  Fetching recent orders to test matching...')
    const { data: recentOrders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id, 
        user_id,
        total_amount,
        currency,
        created_at,
        order_items(
          product_id,
          quantity,
          price,
          products(id, name)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError)
    } else {
      console.log(`✅ Recent orders (last 5):`)
      recentOrders?.forEach((order, index) => {
        console.log(`   ${index + 1}. Order ${order.id}`)
        console.log(`      Created: ${new Date(order.created_at).toLocaleString()}`)
        console.log(`      Total: ${order.currency} ${order.total_amount}`)
        console.log(`      Items:`)
        order.order_items?.forEach((item, itemIndex) => {
          console.log(`         ${itemIndex + 1}. Product ${item.product_id} (${item.products?.name || 'Unknown'}) - Qty: ${item.quantity}`)
        })
        console.log('')
      })
    }
    
    // 4. Simulate product-specific matching logic
    console.log('\n4️⃣  Simulating product-specific notification matching...')
    
    const recipientsWithProducts = recipients?.filter(r => r.assigned_product_ids && r.assigned_product_ids.length > 0) || []
    const recipientsWithoutProducts = recipients?.filter(r => !r.assigned_product_ids || r.assigned_product_ids.length === 0) || []
    
    console.log(`📊 Recipients with product assignments: ${recipientsWithProducts.length}`)
    console.log(`📊 Recipients without product assignments: ${recipientsWithoutProducts.length}`)
    
    if (recentOrders && recentOrders.length > 0 && recipientsWithProducts.length > 0) {
      const testOrder = recentOrders[0]
      const orderProductIds = testOrder.order_items?.map(item => item.product_id) || []
      
      console.log(`\n🧪 Testing with most recent order (${testOrder.id}):`)
      console.log(`   Order products: [${orderProductIds.join(', ')}]`)
      
      const matchingRecipients = recipientsWithProducts.filter(recipient => {
        const hasMatch = orderProductIds.some(productId => 
          recipient.assigned_product_ids?.includes(productId)
        )
        return hasMatch
      })
      
      console.log(`\n🎯 Matching recipients for this order: ${matchingRecipients.length}`)
      matchingRecipients.forEach((recipient, index) => {
        const matchingProducts = recipient.assigned_product_ids?.filter(pid => orderProductIds.includes(pid)) || []
        console.log(`   ${index + 1}. ${recipient.email} - matches products: [${matchingProducts.join(', ')}]`)
      })
      
      if (matchingRecipients.length === 0) {
        console.log('⚠️  No product-specific matches - would fall back to category-based recipients')
        console.log(`   Category-based recipients available: ${recipientsWithoutProducts.length}`)
      }
    }
    
    // 5. Validate configuration
    console.log('\n5️⃣  Configuration validation...')
    
    const issues = []
    
    if (!recipients || recipients.length === 0) {
      issues.push('❌ No notification recipients configured')
    }
    
    const activeRecipients = recipients?.filter(r => r.is_active) || []
    if (activeRecipients.length === 0) {
      issues.push('❌ No active notification recipients')
    }
    
    const recipientsWithValidEmails = activeRecipients.filter(r => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(r.email)
    })
    if (recipientsWithValidEmails.length !== activeRecipients.length) {
      issues.push('❌ Some recipients have invalid email formats')
    }
    
    if (issues.length === 0) {
      console.log('✅ Configuration looks good!')
    } else {
      console.log('⚠️  Configuration issues found:')
      issues.forEach(issue => console.log(`   ${issue}`))
    }
    
    console.log('\n📊 === SUMMARY ===')
    console.log(`Total recipients: ${recipients?.length || 0}`)
    console.log(`Active recipients: ${activeRecipients.length}`)
    console.log(`Product-specific recipients: ${recipientsWithProducts.length}`)
    console.log(`Category-based recipients: ${recipientsWithoutProducts.length}`)
    console.log(`Recent orders checked: ${recentOrders?.length || 0}`)
    
  } catch (error) {
    console.error('❌ Debug script error:', error)
  }
}

// Run the debug function
debugProductNotifications()
  .then(() => {
    console.log('\n✅ Debug complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script error:', error)
    process.exit(1)
  })
