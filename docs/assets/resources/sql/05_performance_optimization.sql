-- TISCO Market Performance Optimization
-- Database indexes and query optimizations

-- Step 1: Add missing indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_featured_created ON products(is_featured, created_at DESC) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_deal_price ON products(is_deal, deal_price) WHERE is_deal = true;
CREATE INDEX IF NOT EXISTS idx_products_sale_price ON products(is_on_sale, sale_price) WHERE is_on_sale = true;
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON products(stock_quantity) WHERE stock_quantity > 0;
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating DESC) WHERE rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_name_search ON products USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_products_description_search ON products USING gin(to_tsvector('english', description));

-- Cart optimization indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_user_product ON cart_items(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_created_at ON cart_items(created_at DESC);

-- Order optimization indexes
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_product ON order_items(order_id, product_id);

-- Review optimization indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product_rating ON reviews(product_id, rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_approved_created ON reviews(is_approved, created_at DESC) WHERE is_approved = true;

-- Address optimization indexes
CREATE INDEX IF NOT EXISTS idx_addresses_user_default ON addresses(user_id, is_default) WHERE is_default = true;

-- Service booking optimization indexes
CREATE INDEX IF NOT EXISTS idx_service_bookings_status_date ON service_bookings(status, preferred_date);
CREATE INDEX IF NOT EXISTS idx_service_bookings_user_status ON service_bookings(user_id, status);

-- Step 2: Optimize product search function
CREATE OR REPLACE FUNCTION search_products(
  search_query TEXT DEFAULT NULL,
  category_filter UUID DEFAULT NULL,
  min_price DECIMAL DEFAULT NULL,
  max_price DECIMAL DEFAULT NULL,
  in_stock_only BOOLEAN DEFAULT true,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
) RETURNS TABLE (
  id UUID,
  name VARCHAR,
  description TEXT,
  price DECIMAL,
  stock_quantity INTEGER,
  is_featured BOOLEAN,
  is_on_sale BOOLEAN,
  sale_price DECIMAL,
  is_deal BOOLEAN,
  deal_price DECIMAL,
  rating DECIMAL,
  reviews_count INTEGER,
  slug VARCHAR,
  created_at TIMESTAMPTZ,
  category_name VARCHAR,
  main_image_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    p.stock_quantity,
    p.is_featured,
    p.is_on_sale,
    p.sale_price,
    p.is_deal,
    p.deal_price,
    p.rating,
    p.reviews_count,
    p.slug,
    p.created_at,
    c.name as category_name,
    pi.url as main_image_url
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = true
  WHERE 
    (search_query IS NULL OR (
      to_tsvector('english', p.name || ' ' || COALESCE(p.description, '')) 
      @@ plainto_tsquery('english', search_query)
    ))
    AND (category_filter IS NULL OR p.category_id = category_filter)
    AND (min_price IS NULL OR p.price >= min_price)
    AND (max_price IS NULL OR p.price <= max_price)
    AND (NOT in_stock_only OR p.stock_quantity > 0)
  ORDER BY 
    p.is_featured DESC,
    CASE 
      WHEN search_query IS NOT NULL THEN 
        ts_rank(to_tsvector('english', p.name || ' ' || COALESCE(p.description, '')), plainto_tsquery('english', search_query))
      ELSE 0
    END DESC,
    p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Optimize cart operations with atomic functions
CREATE OR REPLACE FUNCTION add_to_cart_atomic(
  p_user_id TEXT,
  p_product_id UUID,
  p_quantity INTEGER
) RETURNS JSON AS $$
DECLARE
  existing_item RECORD;
  product_info RECORD;
  result_item RECORD;
BEGIN
  -- Get product info and check stock
  SELECT id, stock_quantity, price INTO product_info
  FROM products 
  WHERE id = p_product_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Product not found');
  END IF;
  
  -- Check if item exists in cart
  SELECT id, quantity INTO existing_item
  FROM cart_items 
  WHERE user_id = p_user_id AND product_id = p_product_id;
  
  IF FOUND THEN
    -- Update existing item
    IF existing_item.quantity + p_quantity > product_info.stock_quantity THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient stock');
    END IF;
    
    UPDATE cart_items 
    SET quantity = existing_item.quantity + p_quantity,
        created_at = NOW()
    WHERE id = existing_item.id
    RETURNING * INTO result_item;
  ELSE
    -- Create new item
    IF p_quantity > product_info.stock_quantity THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient stock');
    END IF;
    
    INSERT INTO cart_items (user_id, product_id, quantity)
    VALUES (p_user_id, p_product_id, p_quantity)
    RETURNING * INTO result_item;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'item', row_to_json(result_item)
  );
END;
$$ LANGUAGE plpgsql;

-- Step 4: Optimize order creation with inventory management
CREATE OR REPLACE FUNCTION create_order_with_inventory(
  p_user_id TEXT,
  p_items JSON,
  p_shipping_address TEXT,
  p_payment_method TEXT DEFAULT 'pending'
) RETURNS JSON AS $$
DECLARE
  order_record RECORD;
  item_record JSON;
  product_record RECORD;
  total_amount DECIMAL := 0;
  order_id UUID;
BEGIN
  -- Start transaction
  BEGIN
    -- Create the order
    INSERT INTO orders (user_id, total_amount, shipping_address, payment_method, status)
    VALUES (p_user_id, 0, p_shipping_address, p_payment_method, 'pending')
    RETURNING id INTO order_id;
    
    -- Process each item
    FOR item_record IN SELECT * FROM json_array_elements(p_items)
    LOOP
      -- Get product info
      SELECT id, price, stock_quantity, is_deal, deal_price
      INTO product_record
      FROM products 
      WHERE id = (item_record->>'product_id')::UUID;
      
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found: %', item_record->>'product_id';
      END IF;
      
      -- Check stock
      IF product_record.stock_quantity < (item_record->>'quantity')::INTEGER THEN
        RAISE EXCEPTION 'Insufficient stock for product: %', product_record.id;
      END IF;
      
      -- Calculate price (use deal price if available)
      DECLARE
        item_price DECIMAL := COALESCE(product_record.deal_price, product_record.price);
        item_quantity INTEGER := (item_record->>'quantity')::INTEGER;
        line_total DECIMAL := item_price * item_quantity;
      BEGIN
        -- Add to order items
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES (order_id, product_record.id, item_quantity, item_price);
        
        -- Update stock
        UPDATE products 
        SET stock_quantity = stock_quantity - item_quantity
        WHERE id = product_record.id;
        
        -- Add to total
        total_amount := total_amount + line_total;
      END;
    END LOOP;
    
    -- Update order total
    UPDATE orders SET total_amount = total_amount WHERE id = order_id;
    
    -- Clear user's cart
    DELETE FROM cart_items WHERE user_id = p_user_id;
    
    -- Return success
    SELECT * INTO order_record FROM orders WHERE id = order_id;
    
    RETURN json_build_object(
      'success', true,
      'order', row_to_json(order_record)
    );
    
  EXCEPTION WHEN OTHERS THEN
    -- Rollback handled automatically
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
  END;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Update product rating calculation function
CREATE OR REPLACE FUNCTION update_product_rating(p_product_id UUID)
RETURNS VOID AS $$
DECLARE
  avg_rating DECIMAL;
  review_count INTEGER;
BEGIN
  SELECT 
    ROUND(AVG(rating)::NUMERIC, 2),
    COUNT(*)
  INTO avg_rating, review_count
  FROM reviews 
  WHERE product_id = p_product_id AND is_approved = true;
  
  UPDATE products 
  SET 
    rating = avg_rating,
    reviews_count = review_count
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger to auto-update product ratings
CREATE OR REPLACE FUNCTION trigger_update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM update_product_rating(NEW.product_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_product_rating(OLD.product_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger
DROP TRIGGER IF EXISTS trg_update_product_rating ON reviews;
CREATE TRIGGER trg_update_product_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION trigger_update_product_rating();

-- Step 7: Create materialized view for product search performance
CREATE MATERIALIZED VIEW IF NOT EXISTS product_search_view AS
SELECT 
  p.id,
  p.name,
  p.description,
  p.price,
  p.stock_quantity,
  p.is_featured,
  p.is_on_sale,
  p.sale_price,
  p.is_deal,
  p.deal_price,
  p.rating,
  p.reviews_count,
  p.slug,
  p.created_at,
  p.category_id,
  c.name as category_name,
  pi.url as main_image_url,
  to_tsvector('english', p.name || ' ' || COALESCE(p.description, '')) as search_vector
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = true;

-- Index the materialized view
CREATE INDEX IF NOT EXISTS idx_product_search_view_vector ON product_search_view USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_product_search_view_featured ON product_search_view(is_featured, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_search_view_category ON product_search_view(category_id);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_product_search_view()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY product_search_view;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Analyze tables for query optimization
ANALYZE products;
ANALYZE cart_items;
ANALYZE orders;
ANALYZE order_items;
ANALYZE reviews;
ANALYZE categories;
ANALYZE product_images;
