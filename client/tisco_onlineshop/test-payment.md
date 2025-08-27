# Payment Testing Procedures

## Mobile Money Testing (ZenoPay)

### Test Case 1: Valid Mobile Money Payment
```bash
# 1. Create an order through checkout
# 2. Use these test parameters:

POST /api/payments/process
{
  "order_id": "your_order_id",
  "amount": 5000,
  "currency": "TZS",
  "provider": "vodacom",
  "phone_number": "255712345678",
  "return_url": "http://localhost:3000/checkout/success"
}
```

### Test Case 2: Invalid Phone Number
```bash
POST /api/payments/process
{
  "order_id": "your_order_id", 
  "amount": 5000,
  "currency": "TZS",
  "provider": "vodacom",
  "phone_number": "123456789",  # Invalid format
  "return_url": "http://localhost:3000/checkout/success"
}
# Expected: 400 error with "Invalid phone format"
```

### Test Case 3: Order Validation
```bash
POST /api/payments/process
{
  "order_id": "non_existent_order",
  "amount": 5000,
  "currency": "TZS",
  "provider": "vodacom", 
  "phone_number": "255712345678"
}
# Expected: 404 error "Order not found"
```

## Card Payment Testing

### Test Case 4: Mock Card Payment
```bash
POST /api/payments/process
{
  "order_id": "your_order_id",
  "payment_method_id": "card_method_id",
  "amount": 5000,
  "currency": "TZS",
  "return_url": "http://localhost:3000/checkout/success"
}
# Expected: 90% success rate, 10% decline
```

## Testing Phone Number Formats

The system normalizes these formats to `255XXXXXXXXX`:
- `0712345678` → `255712345678`
- `712345678` → `255712345678` 
- `+255712345678` → `255712345678`
- `255712345678` → `255712345678` (no change)

## Webhook Testing

### Test webhook endpoint:
```bash
POST http://localhost:3000/api/payments/webhooks
Content-Type: application/json

{
  "order_id": "TX123ABC",
  "status": "completed",
  "transaction_id": "zeno_tx_456",
  "amount": "5000.00",
  "currency": "TZS"
}
```

## Database Verification

After each test, check these tables:
```sql
-- Check payment transaction
SELECT * FROM payment_transactions WHERE order_id = 'your_order_id';

-- Check order status
SELECT * FROM orders WHERE id = 'your_order_id';

-- Check order items and stock
SELECT oi.*, p.stock_quantity 
FROM order_items oi 
JOIN products p ON oi.product_id = p.id 
WHERE oi.order_id = 'your_order_id';
```

## Common Test Scenarios

1. **Successful Payment Flow:**
   - Create order → Process payment → Receive webhook → Order confirmed

2. **Failed Payment Flow:**
   - Create order → Payment fails → Order remains pending

3. **Timeout Scenario:**
   - Create order → Payment processing → No webhook received → Manual verification

4. **Stock Validation:**
   - Create order with high quantity → Check stock deduction → Cancel order → Check stock restoration
