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
  } catch (error) {
    console.error('Warning: Could not load .env.local')
  }
}

loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || ''
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function checkUrls() {
  const { data, error } = await supabase
    .from('product_images')
    .select('url, created_at, products(name)')
    .ilike('url', '%unsplash%')
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log('Recent Unsplash Image URLs:\n')
  data?.forEach((img: any) => {
    console.log('Product:', img.products?.name)
    console.log('URL:', img.url)
    console.log('Created:', new Date(img.created_at).toLocaleString())
    console.log('---')
  })
}

checkUrls()
