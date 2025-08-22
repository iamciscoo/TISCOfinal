-- Clear fabricated rating and reviews_count data from products
-- This ensures products show empty stars and 0.0 (0 reviews) when they have no actual reviews

-- Set all products' rating and reviews_count to NULL
-- The application logic will handle NULL as 0 rating and 0 reviews
UPDATE products 
SET 
  rating = NULL,
  reviews_count = NULL
WHERE rating IS NOT NULL OR reviews_count IS NOT NULL;

-- Verify the update
SELECT name, rating, reviews_count 
FROM products 
WHERE rating IS NOT NULL OR reviews_count IS NOT NULL;

-- This query should return no rows after the update
