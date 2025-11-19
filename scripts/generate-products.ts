import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import * as readline from 'readline'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PEXELS_KEY = 'dLDkey2ntrsXAwI81jNlqPKvSvf1bZFQMvnRSzqhqYX05mAcPpaynKYr'
const UNSPLASH_ACCESS_KEY = 'LC-Trw1wuCjE941M3nUn179tTWKoZWynTNnFa2Al-K8'
const PRODUCTS_PER_CAT = 3
const IMGS_PER_PROD = 6
const API_DELAY = 18500

// User's preferred primary API (set during runtime)
let PRIMARY_API: 'pexels' | 'unsplash' = 'pexels'

// Generate unique run ID for this session
const RUN_ID = Date.now()
const randomVariant = () => ['Pro', 'Plus', 'Ultra', 'Max', 'Elite', 'Premium', 'Advanced', 'Standard', 'Deluxe', 'Exclusive'][Math.floor(Math.random() * 10)]
const randomColor = () => ['Black', 'White', 'Blue', 'Red', 'Gray', 'Navy', 'Green', 'Silver', 'Gold', 'Rose'][Math.floor(Math.random() * 10)]
const randomSize = () => ['Compact', 'Standard', 'Large', 'XL', 'Mini', 'Mega'][Math.floor(Math.random() * 6)]
const randomYear = () => 2023 + Math.floor(Math.random() * 3) // 2023-2025

// Load environment variables from client/.env.local
function loadEnv() {
  try {
    const envPath = resolve(__dirname, '../client/.env.local')
    const envFile = readFileSync(envPath, 'utf-8')
    const lines = envFile.split('\n')
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      
      const [key, ...values] = trimmed.split('=')
      const value = values.join('=').replace(/^["']|["']$/g, '')
      process.env[key.trim()] = value.trim()
    }
  } catch (error) {
    console.error('⚠️  Could not load .env.local, using process.env')
  }
}

loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || ''

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing environment variables. Check client/.env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE')
}

console.log('✅ Connected to Supabase:', SUPABASE_URL)
console.log('✅ Image APIs available: Pexels + Unsplash (you will choose primary)')
console.log('⏰ Estimated completion time: ~60 minutes')

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const slug = (n: string) => n.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '')

async function fetchFromPexels(query: string, count: number): Promise<{ urls: string[], limitReached: boolean, error?: string }> {
  try {
    const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}`, {
      headers: { Authorization: PEXELS_KEY }
    })
    
    // Check for rate limit errors
    if (res.status === 429 || res.status === 403) {
      console.log(`    ⚠️  Pexels API limit reached (Status: ${res.status})`)
      return { urls: [], limitReached: true }
    }
    
    if (!res.ok) {
      console.log(`    ⚠️  Pexels API error: ${res.status}`)
      return { urls: [], limitReached: false, error: `HTTP ${res.status}` }
    }
    
    const data = await res.json()
    return { 
      urls: data.photos?.map((p: any) => p.src.large) || [],
      limitReached: false
    }
  } catch (error: any) {
    // Network errors (timeout, connection refused, etc.)
    const errorMsg = error.code || error.message || 'Network error'
    console.log(`    ⚠️  Pexels network error: ${errorMsg}`)
    return { urls: [], limitReached: false, error: errorMsg }
  }
}

async function fetchFromUnsplash(query: string, count: number): Promise<{ urls: string[], limitReached: boolean, error?: string }> {
  try {
    const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`, {
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` }
    })
    
    // Check for rate limit errors
    if (res.status === 429 || res.status === 403) {
      console.log(`    ⚠️  Unsplash API limit reached (Status: ${res.status})`)
      return { urls: [], limitReached: true }
    }
    
    // Handle authentication errors
    if (res.status === 401) {
      console.log(`    ⚠️  Unsplash authentication failed (401)`)
      console.log(`    💡 Tip: Check if UNSPLASH_ACCESS_KEY is valid`)
      const errorBody = await res.text().catch(() => 'Unable to read error')
      console.log(`    Error details: ${errorBody.substring(0, 100)}`)
      return { urls: [], limitReached: false, error: 'Authentication failed' }
    }
    
    if (!res.ok) {
      console.log(`    ⚠️  Unsplash API error: ${res.status}`)
      const errorBody = await res.text().catch(() => 'Unable to read error')
      console.log(`    Error details: ${errorBody.substring(0, 100)}`)
      return { urls: [], limitReached: false, error: `HTTP ${res.status}` }
    }
    
    const data = await res.json()
    
    // Check if we got valid results
    if (!data.results || data.results.length === 0) {
      console.log(`    ⚠️  Unsplash returned no results for query: "${query}"`)
      return { urls: [], limitReached: false, error: 'No results found' }
    }
    
    return { 
      urls: data.results?.map((p: any) => {
        // Use raw URL with custom parameters for better control and reliability
        const rawUrl = p.urls.raw
        // Add parameters for consistent sizing and format
        return `${rawUrl}&w=1200&q=85&fm=jpg&fit=crop`
      }) || [],
      limitReached: false
    }
  } catch (error: any) {
    // Network errors (timeout, connection refused, etc.)
    const errorMsg = error.code || error.message || 'Network error'
    console.log(`    ⚠️  Unsplash network error: ${errorMsg}`)
    return { urls: [], limitReached: false, error: errorMsg }
  }
}

async function fetchImages(query: string, count: number): Promise<{ urls: string[], limitReached: boolean }> {
  await new Promise(r => setTimeout(r, API_DELAY))
  
  // Track all fetched URLs to avoid duplicates
  const usedUrls = new Set<string>()
  const allImages: string[] = []
  
  // Determine primary and fallback APIs based on user preference
  const primaryAPI = PRIMARY_API
  const fallbackAPI = primaryAPI === 'pexels' ? 'unsplash' : 'pexels'
  
  // Try primary API first
  console.log(`    📸 Trying ${primaryAPI.toUpperCase()} API (primary)...`)
  const primaryResult = primaryAPI === 'pexels' 
    ? await fetchFromPexels(query, count)
    : await fetchFromUnsplash(query, count)
  
  if (primaryResult.urls.length > 0) {
    // Add unique images from primary API
    primaryResult.urls.forEach(url => {
      if (!usedUrls.has(url)) {
        usedUrls.add(url)
        allImages.push(url)
      }
    })
    console.log(`    ✅ Got ${allImages.length} unique images from ${primaryAPI.toUpperCase()}`)
  }
  
  // If we still need more images, try fallback API
  const stillNeeded = count - allImages.length
  if (stillNeeded > 0 && (primaryResult.limitReached || primaryResult.urls.length < count)) {
    console.log(`    🔄 Need ${stillNeeded} more images, trying ${fallbackAPI.toUpperCase()} API...`)
    await new Promise(r => setTimeout(r, 2000)) // Small delay between APIs
    
    // Request extra images to account for potential duplicates
    const fallbackResult = fallbackAPI === 'pexels'
      ? await fetchFromPexels(query, Math.min(stillNeeded + 5, 15)) // Request a few extra
      : await fetchFromUnsplash(query, Math.min(stillNeeded + 5, 15))
    
    if (fallbackResult.urls.length > 0) {
      // Add unique images from fallback API (filter out duplicates)
      let addedCount = 0
      for (const url of fallbackResult.urls) {
        if (!usedUrls.has(url) && allImages.length < count) {
          usedUrls.add(url)
          allImages.push(url)
          addedCount++
        }
      }
      console.log(`    ✅ Got ${addedCount} unique images from ${fallbackAPI.toUpperCase()} (${fallbackResult.urls.length - addedCount} duplicates filtered)`)
    }
    
    // If both APIs hit limits, stop the process
    if (primaryResult.limitReached && fallbackResult.limitReached) {
      console.log(`    ❌ Both Pexels and Unsplash limits reached!`)
      return { urls: allImages, limitReached: true }
    }
  }
  
  // If we got enough images, return them
  if (allImages.length > 0) {
    console.log(`    📊 Total unique images collected: ${allImages.length}/${count}`)
    return { urls: allImages, limitReached: false }
  }
  
  // If we get here, use placeholder
  console.log(`    ⚠️  No images from either API, using placeholder`)
  return { urls: ['https://via.placeholder.com/800'], limitReached: false }
}

const generators: Record<string, (i: number) => any> = {
  'Electronics': i => {
    const items = [
      { n: 'Smartphone', b: ['Apple', 'Samsung', 'Xiaomi', 'OnePlus'], p: 800000, q: 'smartphone' },
      { n: 'Laptop', b: ['Dell', 'HP', 'Lenovo', 'Asus'], p: 1500000, q: 'laptop' },
      { n: 'Wireless Earbuds', b: ['Sony', 'Bose', 'JBL', 'Beats'], p: 200000, q: 'earbuds' },
      { n: 'Smartwatch', b: ['Apple', 'Samsung', 'Garmin'], p: 300000, q: 'smartwatch' },
      { n: 'Tablet', b: ['Apple', 'Samsung', 'Amazon'], p: 600000, q: 'tablet' }
    ]
    const x = items[i % items.length]
    const brand = x.b[Math.floor(Math.random() * x.b.length)]
    const variant = randomVariant()
    const year = randomYear()
    return { 
      name: `${brand} ${x.n} ${variant} ${year}`, 
      desc: `${randomSize()} ${x.n} from ${brand}. Latest ${year} model with advanced features.`, 
      price: x.p + Math.floor(Math.random() * x.p * 0.3), 
      brands: [brand], 
      tags: ['tech', 'electronics', x.n.toLowerCase().replace(' ', '-')], 
      search: `${x.q} ${brand.toLowerCase()}` 
    }
  },
  'Health and Beauty': i => {
    const items = [
      { n: 'Facial Serum', b: ['L\'Oreal', 'Neutrogena', 'CeraVe'], p: 45000, q: 'serum' },
      { n: 'Moisturizer', b: ['Nivea', 'Cetaphil', 'Aveeno'], p: 35000, q: 'moisturizer' },
      { n: 'Perfume', b: ['Chanel', 'Dior', 'Versace'], p: 120000, q: 'perfume' },
      { n: 'Shampoo', b: ['Pantene', 'Head & Shoulders'], p: 25000, q: 'shampoo' },
      { n: 'Body Lotion', b: ['Nivea', 'Vaseline'], p: 30000, q: 'body lotion' }
    ]
    const x = items[i % items.length]
    const brand = x.b[Math.floor(Math.random() * x.b.length)]
    const types = ['Hydrating', 'Nourishing', 'Revitalizing', 'Gentle', 'Advanced']
    const type = types[Math.floor(Math.random() * types.length)]
    return { 
      name: `${brand} ${type} ${x.n} ${randomSize()}`, 
      desc: `Premium ${type.toLowerCase()} ${x.n.toLowerCase()} by ${brand}. Dermatologist tested.`, 
      price: x.p + Math.floor(Math.random() * x.p * 0.2), 
      brands: [brand], 
      tags: ['beauty', 'health', 'skincare'], 
      search: `${x.q} ${brand.toLowerCase()}` 
    }
  },
  'Clothing': i => {
    const items = [
      { n: 'T-Shirt', b: ['Nike', 'Adidas', 'Puma', 'Uniqlo'], p: 25000, q: 'tshirt' },
      { n: 'Jeans', b: ['Levi\'s', 'Wrangler', 'Diesel'], p: 65000, q: 'jeans' },
      { n: 'Sneakers', b: ['Adidas', 'Nike', 'Puma', 'New Balance'], p: 95000, q: 'sneakers' },
      { n: 'Hoodie', b: ['Champion', 'Nike', 'Adidas'], p: 75000, q: 'hoodie' },
      { n: 'Jacket', b: ['North Face', 'Columbia'], p: 150000, q: 'jacket' }
    ]
    const x = items[i % items.length]
    const brand = x.b[Math.floor(Math.random() * x.b.length)]
    const color = randomColor()
    return { 
      name: `${brand} ${color} ${x.n} ${randomVariant()}`, 
      desc: `Stylish ${color.toLowerCase()} ${x.n.toLowerCase()} from ${brand}. Premium quality.`, 
      price: x.p + Math.floor(Math.random() * x.p * 0.25), 
      brands: [brand], 
      tags: ['clothing', 'fashion', color.toLowerCase()], 
      search: `${x.q} ${color.toLowerCase()}` 
    }
  },
  'Sports & Fitness.': i => {
    const items = [
      { n: 'Running Shoes', b: ['Nike', 'Adidas', 'Asics', 'Brooks'], p: 120000, q: 'running shoes' },
      { n: 'Yoga Mat', b: ['Lululemon', 'Manduka', 'Gaiam'], p: 45000, q: 'yoga mat' },
      { n: 'Dumbbells', b: ['Bowflex', 'CAP', 'York'], p: 180000, q: 'dumbbells' },
      { n: 'Gym Bag', b: ['Nike', 'Adidas', 'Under Armour'], p: 55000, q: 'gym bag' },
      { n: 'Water Bottle', b: ['Hydro Flask', 'Nalgene'], p: 35000, q: 'water bottle' }
    ]
    const x = items[i % items.length]
    const brand = x.b[Math.floor(Math.random() * x.b.length)]
    const levels = ['Pro', 'Elite', 'Performance', 'Training', 'Sport']
    const level = levels[Math.floor(Math.random() * levels.length)]
    return { 
      name: `${brand} ${level} ${x.n} ${randomSize()}`, 
      desc: `Professional ${level.toLowerCase()} ${x.n.toLowerCase()} from ${brand}. For serious athletes.`, 
      price: x.p + Math.floor(Math.random() * x.p * 0.2), 
      brands: [brand], 
      tags: ['sports', 'fitness', 'workout'], 
      search: `${x.q} ${brand.toLowerCase()}` 
    }
  },
  'Books': i => {
    const items = [
      { n: 'Fiction Novel', b: ['Penguin', 'HarperCollins'], p: 35000, q: 'book novel' },
      { n: 'Self-Help Book', b: ['Random House', 'Simon & Schuster'], p: 28000, q: 'self help book' },
      { n: 'Biography', b: ['HarperCollins', 'Penguin'], p: 40000, q: 'biography' },
      { n: 'Cookbook', b: ['Phaidon', 'Chronicle Books'], p: 50000, q: 'cookbook' },
      { n: 'Business Book', b: ['Wiley', 'McGraw-Hill'], p: 45000, q: 'business book' }
    ]
    const x = items[i % items.length]
    const brand = x.b[Math.floor(Math.random() * x.b.length)]
    const adjectives = ['Essential', 'Complete', 'Ultimate', 'Modern', 'Practical']
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
    const topics = ['Success', 'Leadership', 'Innovation', 'Mastery', 'Guide']
    const topic = topics[Math.floor(Math.random() * topics.length)]
    return { 
      name: `The ${adj} ${topic} - ${x.n}`, 
      desc: `${adj} ${x.n.toLowerCase()} published by ${brand}. Bestselling edition.`, 
      price: x.p + Math.floor(Math.random() * x.p * 0.15), 
      brands: [brand], 
      tags: ['books', 'reading', x.n.toLowerCase().replace(' ', '-')], 
      search: x.q 
    }
  },
  'Home & Garden': i => {
    const items = [
      { n: 'Throw Pillow', b: ['IKEA', 'West Elm', 'Pottery Barn'], p: 35000, q: 'pillow' },
      { n: 'Table Lamp', b: ['Philips', 'IKEA', 'Wayfair'], p: 75000, q: 'lamp' },
      { n: 'Plant Pot', b: ['Lechuza', 'Bloem'], p: 25000, q: 'plant pot' },
      { n: 'Wall Art', b: ['Society6', 'Minted'], p: 65000, q: 'wall art' },
      { n: 'Storage Basket', b: ['mDesign', 'SimpleHouseware'], p: 28000, q: 'storage basket' }
    ]
    const x = items[i % items.length]
    const brand = x.b[Math.floor(Math.random() * x.b.length)]
    const styles = ['Modern', 'Rustic', 'Contemporary', 'Vintage', 'Minimalist', 'Classic']
    const style = styles[Math.floor(Math.random() * styles.length)]
    return { 
      name: `${brand} ${style} ${x.n} ${randomSize()}`, 
      desc: `${style} ${x.n.toLowerCase()} from ${brand}. Perfect for home decor.`, 
      price: x.p + Math.floor(Math.random() * x.p * 0.25), 
      brands: [brand], 
      tags: ['home', 'garden', 'decor', style.toLowerCase()], 
      search: `${x.q} ${style.toLowerCase()}` 
    }
  },
  'Entertainment': i => {
    const items = [
      { n: 'Board Game', b: ['Hasbro', 'Mattel', 'Ravensburger'], p: 45000, q: 'board game' },
      { n: 'Building Blocks Set', b: ['LEGO'], p: 95000, q: 'building blocks toy' },
      { n: 'Video Game', b: ['PlayStation', 'Xbox', 'Nintendo'], p: 120000, q: 'video game' },
      { n: 'Puzzle', b: ['Ravensburger', 'Buffalo Games'], p: 28000, q: 'puzzle' },
      { n: 'Action Figure', b: ['Hasbro', 'Mattel', 'Funko'], p: 55000, q: 'action figure' }
    ]
    const x = items[i % items.length]
    const brand = x.b[Math.floor(Math.random() * x.b.length)]
    const themes = ['Adventure', 'Fantasy', 'Action', 'Strategy', 'Classic', 'Premium']
    const theme = themes[Math.floor(Math.random() * themes.length)]
    
    // Use brand name in product name only if not generic (like LEGO for Building Blocks)
    const productName = x.n === 'Building Blocks Set' 
      ? `${theme} ${x.n} ${randomVariant()}`  // Don't show "LEGO" in name to avoid trademark
      : `${brand} ${theme} ${x.n} ${randomVariant()}`;
    
    return { 
      name: productName, 
      desc: `${theme} ${x.n.toLowerCase()} from ${brand}. Hours of entertainment.`, 
      price: x.p + Math.floor(Math.random() * x.p * 0.3), 
      brands: [brand], 
      tags: ['entertainment', 'games', 'fun'], 
      search: x.q 
    }
  },
  'Anime Merch': i => {
    const items = [
      { n: 'Figure', b: ['Banpresto', 'Good Smile', 'Funko'], p: 85000, q: 'anime figure' },
      { n: 'Poster', b: ['Crunchyroll', 'AnimePoster'], p: 18000, q: 'anime poster' },
      { n: 'T-Shirt', b: ['Good Smile', 'Crunchyroll'], p: 35000, q: 'anime shirt' },
      { n: 'Keychain', b: ['Banpresto', 'Good Smile'], p: 12000, q: 'anime keychain' },
      { n: 'Plushie', b: ['Banpresto', 'San-ei'], p: 45000, q: 'anime plush' }
    ]
    const x = items[i % items.length]
    const brand = x.b[Math.floor(Math.random() * x.b.length)]
    const series = ['Naruto', 'One Piece', 'Dragon Ball', 'Attack on Titan', 'Demon Slayer', 'My Hero Academia']
    const anime = series[Math.floor(Math.random() * series.length)]
    const editions = ['Limited Edition', 'Collector Edition', 'Special Edition', 'Exclusive']
    const edition = editions[Math.floor(Math.random() * editions.length)]
    return { 
      name: `${anime} ${edition} ${x.n}`, 
      desc: `Official ${anime} ${x.n.toLowerCase()} by ${brand}. ${edition} collectible.`, 
      price: x.p + Math.floor(Math.random() * x.p * 0.25), 
      brands: [brand], 
      tags: ['anime', 'merch', 'collectible', anime.toLowerCase().replace(' ', '-')], 
      search: `${x.q} ${anime.toLowerCase()}` 
    }
  },
  'Rare Finds': i => {
    const items = [
      { n: 'Vintage Watch', b: ['Rolex', 'Omega', 'Patek Philippe'], p: 850000, q: 'vintage watch' },
      { n: 'Antique Vase', b: ['Ming', 'Qing', 'Victorian'], p: 450000, q: 'antique vase' },
      { n: 'Limited Sneaker', b: ['Nike', 'Adidas', 'Jordan'], p: 550000, q: 'limited sneakers' },
      { n: 'Rare Coin', b: ['Numismatic'], p: 350000, q: 'rare coin' },
      { n: 'Vintage Camera', b: ['Leica', 'Hasselblad'], p: 650000, q: 'vintage camera' }
    ]
    const x = items[i % items.length]
    const brand = x.b[Math.floor(Math.random() * x.b.length)]
    const years = [1950, 1960, 1970, 1980, 1990, 2000]
    const year = years[Math.floor(Math.random() * years.length)]
    const conditions = ['Mint Condition', 'Excellent', 'Pristine', 'Authenticated']
    const condition = conditions[Math.floor(Math.random() * conditions.length)]
    return { 
      name: `${brand} ${x.n} ${year} ${condition}`, 
      desc: `Rare ${year} ${x.n.toLowerCase()} from ${brand}. ${condition}. Collector's item.`, 
      price: x.p + Math.floor(Math.random() * x.p * 0.4), 
      brands: [brand], 
      tags: ['rare', 'collectible', 'vintage'], 
      search: `${x.q} ${brand.toLowerCase()}` 
    }
  },
  'New': i => {
    const allItems = [
      { n: 'Smart Device', b: ['TechPro', 'InnoTech'], p: 150000, q: 'smart device' },
      { n: 'Wireless Speaker', b: ['JBL', 'Bose', 'Sony'], p: 95000, q: 'wireless speaker' },
      { n: 'Fitness Band', b: ['Fitbit', 'Xiaomi'], p: 75000, q: 'fitness band' },
      { n: 'Power Station', b: ['Anker', 'RAVPower'], p: 180000, q: 'power station' },
      { n: 'LED Light Strip', b: ['Philips', 'LIFX'], p: 45000, q: 'led light' }
    ]
    const x = allItems[i % allItems.length]
    const brand = x.b[Math.floor(Math.random() * x.b.length)]
    const year = new Date().getFullYear()
    const version = Math.floor(Math.random() * 5) + 1
    return { 
      name: `${brand} ${x.n} ${year} v${version}`, 
      desc: `Brand new ${year} ${x.n.toLowerCase()} from ${brand}. Latest version ${version} release.`, 
      price: x.p + Math.floor(Math.random() * x.p * 0.2), 
      brands: [brand], 
      tags: ['new', 'latest', year.toString()], 
      search: `${x.q} ${year}` 
    }
  }
}

// Prompt user to select primary API
async function promptForAPI(): Promise<'pexels' | 'unsplash'> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  return new Promise((resolve) => {
    console.log('\n🎨 Select your primary image API:')
    console.log('  1️⃣  Pexels (default, fast)')
    console.log('  2️⃣  Unsplash (alternative)\n')
    
    rl.question('Enter choice (1 or 2, press Enter for default): ', (answer) => {
      rl.close()
      const choice = answer.trim()
      
      if (choice === '2') {
        console.log('✅ Using Unsplash as primary API (will fallback to Pexels if needed)\n')
        resolve('unsplash')
      } else {
        console.log('✅ Using Pexels as primary API (will fallback to Unsplash if needed)\n')
        resolve('pexels')
      }
    })
  })
}

async function main() {
  // Ask user which API to use first
  PRIMARY_API = await promptForAPI()
  
  console.log('🚀 Starting product generation...\n')
  
  // Check current product count before generation
  const { count: beforeCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
  
  console.log(`📊 Current products in database: ${beforeCount || 0}`)
  console.log(`➕ Will add ${PRODUCTS_PER_CAT} products per category\n`)
  
  const { data: cats } = await supabase.from('categories').select('id, name')
  if (!cats) throw new Error('No categories found')
  
  let totalProducts = 0
  let totalImages = 0
  
  for (const cat of cats) {
    const gen = generators[cat.name]
    if (!gen) {
      console.log(`⚠️  No generator for "${cat.name}", skipping...`)
      continue
    }
    
    console.log(`\n📦 Category: ${cat.name}`)
    
    for (let i = 0; i < PRODUCTS_PER_CAT; i++) {
      const prod = gen(i)
      
      console.log(`  → Generating "${prod.name}"...`)
      
      // Fetch images
      console.log(`    📸 Fetching ${IMGS_PER_PROD} images...`)
      const imgResult = await fetchImages(prod.search, IMGS_PER_PROD)
      
      // Check if both API limits reached
      if (imgResult.limitReached) {
        console.log(`\n🛑 STOPPING GENERATION - Both API Limits Reached!`)
        console.log(`\n📊 Progress Summary:`)
        console.log(`   ✅ Products created: ${totalProducts}`)
        console.log(`   ✅ Images added: ${totalImages}`)
        console.log(`\n⚠️  API Status:`)
        console.log(`   ❌ Pexels API: Limit reached (~200/month)`)
        console.log(`   ❌ Unsplash API: Limit reached (~50/hour)`)
        console.log(`\n💡 Next Steps:`)
        console.log(`   • Wait 1 hour for Unsplash hourly limit to reset`)
        console.log(`   • Wait 24 hours for Pexels daily limit to reset`)
        console.log(`   • Or upgrade to paid API plans for unlimited access`)
        
        // Exit the main function gracefully
        const { count: afterCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
        
        console.log(`\n📊 Final Database Summary:`)
        console.log(`   Total products in DB: ${afterCount || 0}`)
        console.log(`   Products added this run: ${totalProducts}`)
        console.log(`\n✨ Generation stopped cleanly. No errors!`)
        return
      }
      
      let imgUrls = imgResult.urls
      
      if (imgUrls.length === 0) {
        console.log(`    ⚠️  No images found, using placeholder`)
        imgUrls = ['https://via.placeholder.com/800']
      }
      
      // Insert product with proper deal pricing logic
      const isDeal = Math.random() > 0.7
      const dealDiscount = 0.15 + (Math.random() * 0.20) // 15-35% off
      
      // Generate unique slug to avoid duplicates
      let productSlug = slug(prod.name)
      let slugSuffix = 1
      
      // Check if slug exists, if so, append number
      while (true) {
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('slug', productSlug)
          .single()
        
        if (!existing) break
        
        // Slug exists, try with suffix
        productSlug = `${slug(prod.name)}-${slugSuffix}`
        slugSuffix++
      }
      
      const { data: newProd, error: prodErr } = await supabase
        .from('products')
        .insert({
          name: prod.name,
          description: prod.desc,
          price: prod.price,
          category_id: cat.id,
          brands: prod.brands,
          tags: prod.tags,
          slug: productSlug,
          image_url: imgUrls[0], // Set main image URL
          stock_quantity: Math.floor(Math.random() * 50) + 10,
          is_active: true,
          is_featured: Math.random() > 0.7,
          is_new: Math.random() > 0.6,
          is_deal: isDeal,
          original_price: isDeal ? prod.price : null,
          deal_price: isDeal ? Math.floor(prod.price * (1 - dealDiscount)) : null
        })
        .select()
        .single()
      
      if (prodErr) {
        console.error(`    ❌ Failed to insert product:`, prodErr.message)
        continue
      }
      
      // Insert into product_categories junction table
      const { error: catErr } = await supabase
        .from('product_categories')
        .insert({
          product_id: newProd.id,
          category_id: cat.id
        })
      
      if (catErr) {
        console.error(`    ⚠️  Failed to link category:`, catErr.message)
      }
      
      // Insert images
      const imgs = imgUrls.slice(0, IMGS_PER_PROD).map((url: string, idx: number) => ({
        product_id: newProd.id,
        url,
        is_main: idx === 0,
        sort_order: idx
      }))
      
      const { error: imgErr } = await supabase.from('product_images').insert(imgs)
      
      if (imgErr) {
        console.error(`    ❌ Failed to insert images:`, imgErr.message)
      } else {
        console.log(`    ✅ Added ${imgs.length} images`)
        totalImages += imgs.length
      }
      
      totalProducts++
      console.log(`    ✅ Product created successfully!`)
    }
  }
  
  // Check final product count after generation
  const { count: afterCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
  
  console.log(`\n🎉 Generation complete!`)
  console.log(`   Products created this run: ${totalProducts}`)
  console.log(`   Images added: ${totalImages}`)
  console.log(`   API calls made: ~${totalImages}`)
  console.log(`\n📊 Database Summary:`)
  console.log(`   Before: ${beforeCount || 0} products`)
  console.log(`   After: ${afterCount || 0} products`)
  console.log(`   ➕ Net increase: +${(afterCount || 0) - (beforeCount || 0)} products`)
  console.log(`\n💡 Note: Products are ADDED to existing inventory, not replaced!`)
  console.log(`   View all products at: ${SUPABASE_URL.replace(/\/$/, '')}/project/default/editor`)
}

main().catch(console.error)
