# 🚀 Product Generation Instructions

## What Will Happen

The script will generate **30 high-quality products** (3 per category):

### Products Per Category:
- ✅ Electronics (3 products)
- ✅ Health and Beauty (3 products)  
- ✅ Clothing (3 products)
- ✅ Sports & Fitness (3 products)
- ✅ Books (3 products)
- ✅ Home & Garden (3 products)
- ✅ Entertainment (3 products)
- ✅ Anime Merch (3 products)
- ✅ Rare Finds (3 products)
- ✅ New (3 products)

### Each Product Gets:
- ✅ **6 Pexels images** (real product photos)
- ✅ Unique name with brand
- ✅ Descriptive content
- ✅ Realistic pricing (in TZS)
- ✅ Auto-generated slug
- ✅ Random stock quantity (10-60 items)
- ✅ Proper category assignment
- ✅ Brand tagging
- ✅ Content tags
- ✅ Random featured/new/deal flags

### API Usage:
- **~180 Pexels API calls** (within 200/hour limit)
- **Duration**: ~60 minutes (due to rate limiting)
- **Safe**: Automatic rate limiting to avoid hitting limits

## How to Run

### Step 1: Navigate to scripts folder
```bash
cd /home/cisco/Documents/TISCO/scripts
```

### Step 2: Run the generator
```bash
npm run generate
```

### Step 3: Watch the progress
You'll see output like:
```
🚀 Starting product generation...

📦 Category: Electronics
  → Generating "Apple Smartphone Pro 1"...
    📸 Fetching 6 images...
    ⏳ Rate limiting: Waiting 18s...
    ✅ Added 6 images
    ✅ Product created successfully!
  → Generating "Dell Laptop Ultra 2"...
    ...
```

## What Gets Created

### Database Tables Updated:
1. **`products`** - 30 new product entries
2. **`product_images`** - ~180 new image entries

### Product Features:
- Properly linked to categories
- Multiple images per product (main + additional)
- Realistic brand names
- Appropriate pricing for Tanzania market
- SEO-friendly slugs
- Searchable tags

## Safety Features

✅ **Atomic operations** - If anything fails, partial data is logged
✅ **Rate limiting** - Automatic delays to respect Pexels limits  
✅ **Error handling** - Continues even if some images fail
✅ **Validation** - All data validated before insertion
✅ **Duplicate prevention** - Unique slugs generated
✅ **Fallback images** - Placeholder if Pexels fails

## After Completion

You can:
1. ✅ View products in admin dashboard
2. ✅ See them on client website
3. ✅ Run script again for more products
4. ✅ Modify and re-run for different categories
5. ✅ Check product_images table for image URLs

## Time Estimate

- **Total time**: ~60 minutes
- **Products**: 30
- **Images**: ~180
- **API calls**: ~180 (18 seconds each)

## Troubleshooting

### If script fails:
1. Check client/.env.local has correct Supabase credentials
2. Verify internet connection (for Pexels API)
3. Check Supabase connection
4. Look at error messages for specific issues

### If Pexels rate limit hit:
- Script will automatically wait 60 seconds and retry
- Safe to let it continue

### If you want to stop:
- Press `Ctrl+C`
- Already created products will remain in database
- Safe to re-run later

## Next Steps After This Run

Since this only does 3 per category, you can:
1. **Run again** for 3 more products per category
2. **Increase PRODUCTS_PER_CAT** in the script (respect API limits)
3. **Focus on specific categories** by modifying the generators object
4. **Let it run overnight** for larger batches (watch API limits)

---

**Ready to start?** Run: `npm run generate`
