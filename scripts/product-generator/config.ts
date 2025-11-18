export const CONFIG = {
  PEXELS_API_KEY: 'dLDkey2ntrsXAwI81jNlqPKvSvf1bZFQMvnRSzqhqYX05mAcPpaynKYr',
  PRODUCTS_PER_CATEGORY: 500,
  IMAGES_PER_PRODUCT: 6,
  BATCH_SIZE: 20,
  PEXELS_RATE_LIMIT: 200,
  PEXELS_DELAY_MS: (3600 * 1000) / 200 + 100, // ~18 seconds per request
}

export function createSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
