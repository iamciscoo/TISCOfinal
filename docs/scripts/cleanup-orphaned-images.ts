/**
 * Cleanup Orphaned Images Script
 * 
 * This script deletes orphaned images from Supabase Storage that are no longer
 * linked to any users or products in the database.
 * 
 * Run with: npx tsx scripts/cleanup-orphaned-images.ts
 */

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

/**
 * Orphaned avatar files (not linked to any user)
 */
const orphanedAvatars = [
  '617174ec-9329-41dd-b737-d4b0baab311e/1759584943191.jpeg',
  '40c16613-a507-4fcd-9f42-3a1b16f383e1/1759435221186.jpeg',
  '42c26a15-a29b-4e6c-b4f2-57dd9908c26b/1759429927049.jpeg',
  '455b7a0d-0b60-4835-b7b7-29c03e1a03e0/1759412045450.jpeg',
  '00b882ef-d9ae-4ab0-aa0b-f8bf50027810/1758109214977.jpeg',
  '8e114dd5-d5cb-49b7-8761-b53ba417a433/1758101853161.png'
]

/**
 * Orphaned product image files (not linked to any product_images record)
 */
const orphanedProductImages = [
  // Folder: 682b9b77-c48c-4712-8e6b-3b1830d01bf5
  'products/682b9b77-c48c-4712-8e6b-3b1830d01bf5/1758316964222-2-How_to_Decide_Where_to_Move_Abroad_-_Teaspoon_of_Adventure.jpeg',
  'products/682b9b77-c48c-4712-8e6b-3b1830d01bf5/1758316963728-1-A_food_delivery_man_in_a_helmet_and_bright_backpack_speeds_through_the_busy_streets_on_his_motorbike_motion_blur_generative_ai___Premium_AI-generated_image.jpeg',
  'products/682b9b77-c48c-4712-8e6b-3b1830d01bf5/1758316962960-0-Bay_Area_Office_Moving_San_Francisco_Office_Relocation_Sacramento___Magic_Moving.jpeg',
  
  // Folder: 1984ab96-5f1f-4777-86f7-3b617e2ea5ab
  'products/1984ab96-5f1f-4777-86f7-3b617e2ea5ab/1758313156064-2-How_to_Decide_Where_to_Move_Abroad_-_Teaspoon_of_Adventure.jpeg',
  'products/1984ab96-5f1f-4777-86f7-3b617e2ea5ab/1758313154549-1-Bay_Area_Office_Moving_San_Francisco_Office_Relocation_Sacramento___Magic_Moving.jpeg',
  'products/1984ab96-5f1f-4777-86f7-3b617e2ea5ab/1758313152029-0-product-banner.png',
  
  // Folder: 3e0341ff-c92c-453a-bef9-ca30de5c6898 (old images)
  'products/3e0341ff-c92c-453a-bef9-ca30de5c6898/1758312560063-A_food_delivery_man_in_a_helmet_and_bright_backpack_speeds_through_the_busy_streets_on_his_motorbike_motion_blur_generative_ai___Premium_AI-generated_image.jpeg',
  'products/3e0341ff-c92c-453a-bef9-ca30de5c6898/1758312559582-Bay_Area_Office_Moving_San_Francisco_Office_Relocation_Sacramento___Magic_Moving.jpeg',
  'products/3e0341ff-c92c-453a-bef9-ca30de5c6898/1758312558141-tiscologo-deskbg.png',
  'products/3e0341ff-c92c-453a-bef9-ca30de5c6898/1758312555672-product-banner.png',
  
  // Folder: c657e22e-6af2-4eb1-99c6-7feb807585b2 (old images)
  'products/c657e22e-6af2-4eb1-99c6-7feb807585b2/1758287359435-3d_logistic_application_service_concept_global_logistics_network_smartphone_and_packaging___Premium_Photo.jpeg',
  'products/c657e22e-6af2-4eb1-99c6-7feb807585b2/1758287358929-Banner_promo_Photos_-_Download_Free_High-Quality_Pictures___Freepik.jpeg',
  'products/c657e22e-6af2-4eb1-99c6-7feb807585b2/1758287357321-Bay_Area_Office_Moving_San_Francisco_Office_Relocation_Sacramento___Magic_Moving.jpeg',
  'products/c657e22e-6af2-4eb1-99c6-7feb807585b2/1758287354656-product-banner.png',
  
  // Folder: 3b91b9b5-0661-41f6-9c95-67a211629d90
  'products/3b91b9b5-0661-41f6-9c95-67a211629d90/1758286728043-Bay_Area_Office_Moving_San_Francisco_Office_Relocation_Sacramento___Magic_Moving.jpeg',
  'products/3b91b9b5-0661-41f6-9c95-67a211629d90/1758286725573-product-banner.png',
  
  // Folder: c2969bf0-43ae-4821-a053-444e3e597f3a
  'products/c2969bf0-43ae-4821-a053-444e3e597f3a/1758216485696-Banner_promo_Photos_-_Download_Free_High-Quality_Pictures___Freepik.jpeg',
  'products/c2969bf0-43ae-4821-a053-444e3e597f3a/1758216484097-Bay_Area_Office_Moving_San_Francisco_Office_Relocation_Sacramento___Magic_Moving.jpeg',
  'products/c2969bf0-43ae-4821-a053-444e3e597f3a/1758216483125-tiscologo-deskbg.png',
  'products/c2969bf0-43ae-4821-a053-444e3e597f3a/1758216480631-product-banner.png',
  
  // Folder: d2fc5120-8120-4976-8cd4-3cdef197431a (old images)
  'products/d2fc5120-8120-4976-8cd4-3cdef197431a/1758208615700-How_to_Decide_Where_to_Move_Abroad_-_Teaspoon_of_Adventure.jpeg',
  'products/d2fc5120-8120-4976-8cd4-3cdef197431a/1758208613439-tiscologo-deskbg.png'
]

/**
 * Cleanup orphaned avatars
 */
async function cleanupAvatars() {
  console.log('🔍 Starting avatar cleanup...')
  console.log(`Found ${orphanedAvatars.length} orphaned avatars\n`)

  let successCount = 0
  let errorCount = 0

  for (const path of orphanedAvatars) {
    try {
      const { error } = await supabase.storage
        .from('avatars')
        .remove([path])

      if (error) {
        console.error(`❌ Failed to delete ${path}:`, error.message)
        errorCount++
      } else {
        console.log(`✅ Deleted: ${path}`)
        successCount++
      }
    } catch (err) {
      console.error(`❌ Error deleting ${path}:`, err)
      errorCount++
    }
  }

  console.log(`\n📊 Avatar cleanup complete:`)
  console.log(`   ✅ Deleted: ${successCount}`)
  console.log(`   ❌ Failed: ${errorCount}\n`)

  return { successCount, errorCount }
}

/**
 * Cleanup orphaned product images
 */
async function cleanupProductImages() {
  console.log('🔍 Starting product image cleanup...')
  console.log(`Found ${orphanedProductImages.length} orphaned product images\n`)

  let successCount = 0
  let errorCount = 0

  // Process in batches of 10 to avoid overwhelming the API
  const batchSize = 10
  for (let i = 0; i < orphanedProductImages.length; i += batchSize) {
    const batch = orphanedProductImages.slice(i, i + batchSize)

    for (const path of batch) {
      try {
        const { error } = await supabase.storage
          .from('product-images')
          .remove([path])

        if (error) {
          console.error(`❌ Failed to delete ${path}:`, error.message)
          errorCount++
        } else {
          console.log(`✅ Deleted: ${path}`)
          successCount++
        }
      } catch (err) {
        console.error(`❌ Error deleting ${path}:`, err)
        errorCount++
      }
    }

    // Small delay between batches
    if (i + batchSize < orphanedProductImages.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  console.log(`\n📊 Product image cleanup complete:`)
  console.log(`   ✅ Deleted: ${successCount}`)
  console.log(`   ❌ Failed: ${errorCount}\n`)

  return { successCount, errorCount }
}

/**
 * Main cleanup function
 */
async function main() {
  console.log('🧹 TISCO Storage Cleanup - Orphaned Images')
  console.log('==========================================\n')

  // Check environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
    console.error('❌ Missing environment variables!')
    console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE')
    process.exit(1)
  }

  try {
    // Cleanup avatars
    const avatarResults = await cleanupAvatars()

    // Cleanup product images
    const productImageResults = await cleanupProductImages()

    // Summary
    const totalSuccess = avatarResults.successCount + productImageResults.successCount
    const totalFailed = avatarResults.errorCount + productImageResults.errorCount
    const totalFiles = orphanedAvatars.length + orphanedProductImages.length

    console.log('✅ CLEANUP COMPLETE!')
    console.log('===================')
    console.log(`📁 Total files processed: ${totalFiles}`)
    console.log(`✅ Successfully deleted: ${totalSuccess}`)
    console.log(`❌ Failed: ${totalFailed}`)
    
    if (totalFailed > 0) {
      console.log(`\n⚠️  Some files failed to delete. Check error messages above.`)
      process.exit(1)
    } else {
      console.log(`\n🎉 All orphaned images cleaned up successfully!`)
      console.log(`💾 Freed up approximately 5.3MB of storage space.`)
      process.exit(0)
    }
  } catch (error) {
    console.error('❌ Fatal error during cleanup:', error)
    process.exit(1)
  }
}

// Run cleanup
main()
