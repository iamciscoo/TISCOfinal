import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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
  } catch (error) {}
}

loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || ''
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function checkProduct() {
  const { data, error } = await supabase
    .from('products')
    .select('name, image_url, product_images(url, is_main)')
    .ilike('name', '%Demon Slayer Exclusive%')
    .limit(1)
    .single()
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log('Product:', data.name)
  console.log('Main image_url:', data.image_url || 'NULL')
  console.log('\nProduct Images:')
  const images = data.product_images as any[] || []
  images.forEach((img: any, i: number) => {
    console.log(`  ${i + 1}. ${img.is_main ? '[MAIN]' : '      '} ${img.url.substring(0, 80)}...`)
  })
}

checkProduct()
