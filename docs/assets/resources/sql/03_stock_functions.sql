-- Function to update product stock when order is created
CREATE OR REPLACE FUNCTION update_product_stock(product_id UUID, quantity_sold INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products 
  SET stock_quantity = GREATEST(0, stock_quantity - quantity_sold)
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- Function to restore product stock when order is cancelled
CREATE OR REPLACE FUNCTION restore_product_stock(product_id UUID, quantity_to_restore INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products 
  SET stock_quantity = stock_quantity + quantity_to_restore
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- Transactional function to deliver an order: validate, decrement stock for all items, and set status to 'delivered'
CREATE OR REPLACE FUNCTION deliver_order(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
  cur_status TEXT;
  item RECORD;
BEGIN
  -- Lock the order row to prevent concurrent updates
  SELECT status INTO cur_status
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id USING ERRCODE = 'P0002';
  END IF;

  -- If already delivered or cancelled, be idempotent (no-op)
  IF cur_status IN ('delivered', 'cancelled') THEN
    RETURN;
  END IF;

  -- Decrement product stock for each order item
  FOR item IN
    SELECT product_id, quantity FROM order_items WHERE order_id = p_order_id
  LOOP
    PERFORM update_product_stock(item.product_id, item.quantity);
  END LOOP;

  -- Update the order status to delivered
  UPDATE orders
  SET status = 'delivered',
      updated_at = NOW()
  WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;
