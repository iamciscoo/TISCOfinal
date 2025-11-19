import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from client/.env.local
function loadEnv() {
  try {
    const envPath = resolve(__dirname, '../client/.env.local')
    const envFile = readFileSync(envPath, 'utf-8')
    envFile.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return
      const [key, ...valueParts] = trimmed.split('=')
      const value = valueParts.join('=').replace(/^["']|["']$/g, '')
      if (key && value) process.env[key] = value
    })
  } catch (error) {
    console.error('Warning: Could not load .env.local')
  }
}

loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || ''

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing environment variables')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function cleanup() {
  console.log('🗑️  Cleaning up recent products with broken Unsplash images...\n')
  
  // Get count before
  const { count: beforeCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
  
  console.log(`📊 Total products before cleanup: ${beforeCount}`)
  
  // Get recent products (created in the last 2 hours)
  const oneHourAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  
  const { data: recentProducts, error: fetchError } = await supabase
    .from('products')
    .select('id, name, created_at')
    .gte('created_at', oneHourAgo)
    .order('created_at', { ascending: false })
  
  if (fetchError) {
    console.error('❌ Error fetching recent products:', fetchError.message)
    return
  }
  
  if (!recentProducts || recentProducts.length === 0) {
    console.log('\n✅ No recent products found to delete')
    return
  }
  
  console.log(`\n📋 Found ${recentProducts.length} recent products to delete:`)
  recentProducts.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.name} (${new Date(p.created_at).toLocaleString()})`)
  })
  
  // Delete associated data first (images, categories)
  const productIds = recentProducts.map(p => p.id)
  
  console.log('\n🗑️  Deleting associated data...')
  
  // Delete product images
  const { error: imgError } = await supabase
    .from('product_images')
    .delete()
    .in('product_id', productIds)
  
  if (imgError) {
    console.error('❌ Error deleting images:', imgError.message)
  } else {
    console.log('   ✅ Deleted product images')
  }
  
  // Delete product categories
  const { error: catError } = await supabase
    .from('product_categories')
    .delete()
    .in('product_id', productIds)
  
  if (catError) {
    console.error('❌ Error deleting categories:', catError.message)
  } else {
    console.log('   ✅ Deleted product categories')
  }
  
  // Delete products
  console.log('\n🗑️  Deleting products...')
  const { error: deleteError } = await supabase
    .from('products')
    .delete()
    .in('id', productIds)
  
  if (deleteError) {
    console.error('❌ Error deleting products:', deleteError.message)
    return
  }
  
  console.log('   ✅ Deleted products')
  
  // Get count after
  const { count: afterCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
  
  console.log(`\n📊 Summary:`)
  console.log(`   Before: ${beforeCount} products`)
  console.log(`   After: ${afterCount} products`)
  console.log(`   Deleted: ${beforeCount! - afterCount!} products`)
  console.log('\n✅ Cleanup complete! You can now run "npm run generate" to regenerate products.')
}

cleanup().catch(console.error)
