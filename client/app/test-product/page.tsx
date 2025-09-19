import { Suspense } from 'react'

async function TestProductData() {
  // Test with real product ID from database
  const realProductId = 'd0446ca6-d88a-48bb-be00-03cb193d5e69'
  
  try {
    console.log('[TEST] Fetching debug endpoint...')
    const debugResponse = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/debug/products`, {
      cache: 'no-store'
    })
    
    const debugData = await debugResponse.json()
    
    console.log('[TEST] Fetching product directly...')
    const { getProductById } = await import('@/lib/database')
    const product = await getProductById(realProductId)
    
    return (
      <div className="p-8 space-y-6">
        <h1 className="text-2xl font-bold">Production Debug Test</h1>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold">Debug API Response:</h2>
          <pre className="text-sm mt-2 overflow-auto">
            {JSON.stringify(debugData, null, 2)}
          </pre>
        </div>
        
        <div className="bg-blue-100 p-4 rounded">
          <h2 className="font-bold">Product Fetch Test (ID: {realProductId}):</h2>
          {product ? (
            <div className="mt-2">
              <p><strong>Success!</strong> Product: {product.name}</p>
              <p>Price: {product.price}</p>
              <p>Stock: {product.stock_quantity}</p>
            </div>
          ) : (
            <p className="text-red-600 mt-2">❌ Product not found</p>
          )}
        </div>
        
        <div className="bg-green-100 p-4 rounded">
          <h2 className="font-bold">Environment Check:</h2>
          <p>NODE_ENV: {process.env.NODE_ENV}</p>
          <p>Has Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'}</p>
          <p>Has Service Role: {process.env.SUPABASE_SERVICE_ROLE ? '✅' : '❌'}</p>
          <p>Vercel URL: {process.env.VERCEL_URL || 'Not set'}</p>
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Test Failed</h1>
        <pre className="bg-red-100 p-4 rounded mt-4 text-sm overflow-auto">
          {error instanceof Error ? error.stack : JSON.stringify(error, null, 2)}
        </pre>
      </div>
    )
  }
}

export default function TestProductPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading debug test...</div>}>
      <TestProductData />
    </Suspense>
  )
}
