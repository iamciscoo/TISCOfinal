#!/bin/bash

# Payment Testing with cURL Commands
# Make sure your dev server is running on localhost:3000

BASE_URL="http://localhost:3000"
ORDER_ID="replace_with_actual_order_id"

echo "🧪 TISCO Payment Testing with cURL"
echo "=================================="

# Test 1: Mobile Money Payment (Valid)
echo -e "\n📱 Test 1: Valid Mobile Money Payment"
curl -X POST "${BASE_URL}/api/payments/process" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "'${ORDER_ID}'",
    "amount": 5000,
    "currency": "TZS",
    "provider": "vodacom",
    "phone_number": "255712345678",
    "return_url": "'${BASE_URL}'/checkout/success"
  }' | jq '.'

echo -e "\n⏱️  Waiting 2 seconds...\n"
sleep 2

# Test 2: Invalid Phone Number
echo -e "\n❌ Test 2: Invalid Phone Number"
curl -X POST "${BASE_URL}/api/payments/process" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "'${ORDER_ID}'",
    "amount": 5000,
    "currency": "TZS", 
    "provider": "vodacom",
    "phone_number": "123456789"
  }' | jq '.'

echo -e "\n⏱️  Waiting 2 seconds...\n"
sleep 2

# Test 3: Missing Order ID
echo -e "\n🚫 Test 3: Missing Order ID"
curl -X POST "${BASE_URL}/api/payments/process" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "currency": "TZS",
    "provider": "vodacom", 
    "phone_number": "255712345678"
  }' | jq '.'

echo -e "\n⏱️  Waiting 2 seconds...\n"
sleep 2

# Test 4: Payment Status Check
echo -e "\n📊 Test 4: Payment Status Check"
curl -X GET "${BASE_URL}/api/payments/status?transaction_id=test_tx_123" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n⏱️  Waiting 2 seconds...\n"
sleep 2

# Test 5: Webhook Simulation
echo -e "\n🔗 Test 5: Webhook Simulation"
curl -X POST "${BASE_URL}/api/payments/webhooks" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "'${ORDER_ID}'",
    "status": "completed",
    "transaction_id": "zeno_tx_'$(date +%s)'",
    "amount": "5000.00",
    "currency": "TZS"
  }' | jq '.'

echo -e "\n✅ All tests completed!"
echo -e "\n📝 Next steps:"
echo "1. Check your database for payment_transactions table"
echo "2. Verify order status updates"
echo "3. Test with real ZenoPay credentials in staging"
