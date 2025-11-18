# TISCO Product Generator

Generates products with Pexels API images.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Make sure parent `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
```

## Run

From TISCO root directory:

```bash
cd scripts
npm install
npm run generate
```

## What it does

- Generates **3 products per category** (30 total)
- Fetches **6 Pexels images** per product
- Makes **~180 API calls** (within 200/hour limit)
- Takes **~60 minutes** to complete
- Auto rate-limits to stay within Pexels limits

## Output

- Products inserted into `products` table
- Images inserted into `product_images` table
- Automatic slug generation
- Random stock quantities
- Some products marked as featured/new/deals
