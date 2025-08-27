# Admin Product Creation Test

## Test Steps

1. **Start Admin Panel:**
   ```bash
   cd /home/cisco/Documents/TISCO/admin
   npm run dev
   ```

2. **Navigate to Products:**
   - Go to `http://localhost:3001` (or your admin port)
   - Click on "Products" in sidebar
   - Click "Add Product" button

3. **Fill Required Fields:**
   - **Product Name:** Test Featured Product
   - **Description:** This is a test product for featured section
   - **Price:** 25000 (TZS)
   - **Stock Quantity:** 50
   - **Category:** Select any available category
   - **SKU:** TEST-001 (optional)
   - **✅ Check "Featured Product"** ← This is key!
   - **Check "On Sale"** (optional)
   - **Sale Price:** 20000 (if on sale)

4. **Submit and Verify:**
   - Click "Create Product"
   - Should see success toast
   - Product should appear in products list
   - Check `is_featured = true` in database

## Database Verification

```sql
-- Check if product was created with featured flag
SELECT id, name, is_featured, is_on_sale, price, sale_price 
FROM products 
WHERE name = 'Test Featured Product';

-- Check all featured products
SELECT id, name, is_featured, created_at 
FROM products 
WHERE is_featured = true 
ORDER BY created_at DESC;
```

## Client Homepage Test

1. **Start Client:**
   ```bash
   cd /home/cisco/Documents/TISCO/client/tisco_onlineshop
   npm run dev
   ```

2. **Check Homepage:**
   - Go to `http://localhost:3000`
   - Scroll to "Featured Products" section
   - Should see your test product in the 3x3 grid
   - Maximum 9 products displayed

## Expected Results

- ✅ Admin form accepts all fields including `is_featured`
- ✅ Product created successfully in database
- ✅ Featured products appear on homepage (max 9 in 3x3 grid)
- ✅ Only products with `is_featured = true` show in featured section
