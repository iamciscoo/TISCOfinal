import { Metadata } from 'next'
import ProductsClient from './ProductsClient'

export const metadata: Metadata = {
  title: 'Shop Products | TISCO Market - Electronics & Gadgets Tanzania',
  description: 'Browse our extensive collection of electronics, gadgets, gaming accessories, and rare tech products. Quality items delivered fast across Tanzania and East Africa with secure mobile money payments.',
  keywords: [
    'TISCO products', 'electronics Tanzania', 'gadgets Dar es Salaam', 'gaming accessories', 
    'mobile phones Tanzania', 'laptops Tanzania', 'rare tech products', 'anime merchandise',
    'computer accessories Tanzania', 'electronics online shopping', 'tech gadgets East Africa',
    'gaming setup Tanzania', 'PC components Tanzania', 'mobile money shopping',
    'rare finds Tanzania', 'antiques Tanzania', 'anime merch Dar es Salaam', 'niche products Tanzania',
    'collectibles Tanzania', 'figurines Tanzania', 'manga Tanzania', 'vintage electronics Tanzania',
    'unique gadgets Tanzania', 'hard to find products Tanzania', 'specialty items Tanzania'
  ],
  openGraph: {
    title: 'Shop Electronics & Tech Products | TISCO Market Tanzania',
    description: 'Browse quality electronics, gadgets, gaming accessories, and rare tech products. Fast delivery across Tanzania with secure mobile money payments.',
    url: 'https://tiscomarket.store/products',
    images: ['https://tiscomarket.store/logo-email.png'],
  },
  twitter: {
    title: 'Shop Electronics & Tech Products | TISCO Market Tanzania',
    description: 'Browse quality electronics, gadgets, gaming accessories, and rare tech products. Fast delivery across Tanzania with secure mobile money payments.',
    images: ['https://tiscomarket.store/logo-email.png'],
  },
}

export default function ProductsPage() {
  return <ProductsClient />
}
