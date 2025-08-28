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
