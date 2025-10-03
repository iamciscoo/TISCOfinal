/**
 * TISCO Notification Flow Debug Script
 * Traces product-specific notification issues
 */

const { createClient } = require('@supabase/supabase-js');

// Mock order data for testing
const mockOrderData = {
  orderId: 'test-order-123',
  customerEmail: 'customer@test.com',
  customerName: 'Test Customer',
  totalAmount: '150000',
  currency: 'TZS',
  paymentMethod: 'Pay at Office', // or 'Mobile Money'
  paymentStatus: 'pending',
  itemsCount: 2,
  items: [
    {
      product_id: '0919b99b-213b-4857-82a3-ed37764e74f6', // PS5 Pro
      name: 'PS5 Pro',
      quantity: 1,
      price: '100000'
    },
    {
      product_id: 'c657e22e-6af2-4eb1-99c6-7feb807585b2', // PS Vita
      name: 'PS Vita',
      quantity: 1,
      price: '50000'
    }
  ]
};

async function debugNotificationFlow() {
  console.log('🔍 DEBUGGING PRODUCT-SPECIFIC NOTIFICATIONS');
  console.log('============================================\n');

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE
  );

  try {
    // Step 1: Check current recipients in database
    console.log('📊 STEP 1: Current Notification Recipients');
    console.log('------------------------------------------');
    
    const { data: recipients, error: recipientsError } = await supabase
      .from('notification_recipients')
      .select('*')
      .eq('is_active', true);
    
    if (recipientsError) {
      console.error('❌ Error fetching recipients:', recipientsError);
      return;
    }

    console.log(`Found ${recipients.length} active recipients:`);
    recipients.forEach((recipient, index) => {
      console.log(`${index + 1}. ${recipient.email} (${recipient.name || 'No name'})`);
      console.log(`   Department: ${recipient.department}`);
      console.log(`   Categories: ${JSON.stringify(recipient.notification_categories)}`);
      console.log(`   Product IDs: ${JSON.stringify(recipient.assigned_product_ids)}`);
      console.log(`   Created: ${recipient.created_at}`);
      console.log('');
    });

    // Step 2: Test product-specific filtering logic
    console.log('🎯 STEP 2: Product-Specific Filtering Logic');
    console.log('-------------------------------------------');

    const orderProductIds = mockOrderData.items.map(item => item.product_id);
    console.log('Order Product IDs:', orderProductIds);

    // Find recipients with product assignments
    const productSpecificRecipients = recipients.filter(recipient => 
      recipient.assigned_product_ids && 
      Array.isArray(recipient.assigned_product_ids) && 
      recipient.assigned_product_ids.length > 0
    );

    console.log(`\nFound ${productSpecificRecipients.length} recipients with product assignments:`);
    
    productSpecificRecipients.forEach(recipient => {
      const hasMatchingProducts = recipient.assigned_product_ids.some(productId => 
        orderProductIds.includes(productId)
      );
      
      console.log(`✉️  ${recipient.email}`);
      console.log(`   Assigned Products: ${JSON.stringify(recipient.assigned_product_ids)}`);
      console.log(`   Matches Order: ${hasMatchingProducts ? '✅ YES' : '❌ NO'}`);
      
      if (hasMatchingProducts) {
        const matchingProducts = recipient.assigned_product_ids.filter(productId => 
          orderProductIds.includes(productId)
        );
        console.log(`   Matching Products: ${JSON.stringify(matchingProducts)}`);
      }
      console.log('');
    });

    // Step 3: Test category-based recipients (fallback)
    console.log('📂 STEP 3: Category-Based Recipients (Fallback)');
    console.log('-----------------------------------------------');

    const categoryRecipients = recipients.filter(recipient => 
      !recipient.assigned_product_ids || 
      recipient.assigned_product_ids.length === 0 ||
      (recipient.notification_categories && recipient.notification_categories.includes('all'))
    );

    console.log(`Found ${categoryRecipients.length} category-based recipients:`);
    categoryRecipients.forEach(recipient => {
      console.log(`✉️  ${recipient.email} - Categories: ${JSON.stringify(recipient.notification_categories)}`);
    });

    // Step 4: Simulate notification sending logic
    console.log('\n📧 STEP 4: Notification Sending Simulation');
    console.log('------------------------------------------');

    let finalRecipients = [];

    // Check if any product-specific recipients match
    const matchingProductRecipients = productSpecificRecipients.filter(recipient =>
      recipient.assigned_product_ids.some(productId => orderProductIds.includes(productId))
    );

    if (matchingProductRecipients.length > 0) {
      console.log('🎯 Product-specific recipients found, using them:');
      finalRecipients = matchingProductRecipients;
    } else {
      console.log('📂 No product-specific matches, falling back to category recipients:');
      finalRecipients = categoryRecipients.filter(recipient =>
        recipient.notification_categories && 
        (recipient.notification_categories.includes('all') || 
         recipient.notification_categories.includes('orders') ||
         recipient.notification_categories.includes('order_created'))
      );
    }

    console.log(`\n📬 Final Recipients (${finalRecipients.length}):`);
    finalRecipients.forEach((recipient, index) => {
      console.log(`${index + 1}. ${recipient.email} - ${recipient.name || 'No name'}`);
    });

    // Step 5: Check audit logs
    console.log('\n📋 STEP 5: Recent Audit Logs');
    console.log('----------------------------');

    const { data: auditLogs, error: auditError } = await supabase
      .from('notification_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (auditError) {
      console.error('❌ Error fetching audit logs:', auditError);
    } else {
      console.log(`Found ${auditLogs.length} recent audit entries:`);
      auditLogs.forEach(log => {
        console.log(`📝 ${log.created_at} - ${log.event_type}`);
        console.log(`   Recipient: ${log.recipient_email}`);
        console.log(`   Status: ${log.status}`);
        console.log(`   Order ID: ${log.order_id || 'N/A'}`);
        console.log(`   Error: ${log.error_message || 'None'}`);
        console.log('');
      });
    }

    // Step 6: Test deduplication
    console.log('🔄 STEP 6: Deduplication Test');
    console.log('-----------------------------');

    // Simulate multiple recipients with same email
    const allEmails = finalRecipients.map(r => r.email);
    const uniqueEmails = [...new Set(allEmails)];
    
    console.log(`Total recipients: ${allEmails.length}`);
    console.log(`Unique emails: ${uniqueEmails.length}`);
    console.log(`Duplicates detected: ${allEmails.length > uniqueEmails.length ? 'YES' : 'NO'}`);

  } catch (error) {
    console.error('💥 Debug script error:', error);
  }
}

// Export for use in other scripts
module.exports = { debugNotificationFlow, mockOrderData };

// Run if called directly
if (require.main === module) {
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });
  debugNotificationFlow();
}
