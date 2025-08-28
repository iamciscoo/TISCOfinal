import { getProducts, getCategories } from '@/lib/database'

export default async function TestDatabase() {
  try {
    const products = await getProducts(5)
    const categories = await getCategories()

    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Database Connection Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Categories ({categories?.length || 0})</h2>
            <div className="space-y-2">
              {categories?.map((category) => (
                <div key={category.id} className="p-3 bg-gray-100 rounded">
                  <h3 className="font-medium">{category.name}</h3>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold mb-4">Products ({products?.length || 0})</h2>
            <div className="space-y-2">
              {products?.map((product) => (
                <div key={product.id} className="p-3 bg-gray-100 rounded">
                  <h3 className="font-medium">{product.name}</h3>
                  <p className="text-sm text-gray-600">${product.price}</p>
                  <p className="text-xs text-gray-500">Stock: {product.stock_quantity}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Database Connection Error</h1>
        <pre className="bg-red-100 p-4 rounded text-sm">
          {error instanceof Error ? error.message : 'Unknown error'}
        </pre>
      </div>
    )
  }
}
