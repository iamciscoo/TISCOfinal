-- Populate product_categories junction table with existing single category relationships
INSERT INTO product_categories (product_id, category_id)
SELECT p.id, p.category_id 
FROM products p
WHERE p.category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM product_categories pc 
    WHERE pc.product_id = p.id AND pc.category_id = p.category_id
  );
