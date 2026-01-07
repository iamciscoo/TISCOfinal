# Archived Components

This folder contains components that have been removed from active use but are preserved for potential future use or reference.

## Components

### ServicesPromoGrid.tsx
- **Original Location**: `components/ServicesPromoGrid.tsx`
- **Description**: "Power Up Your Experience" section - A promo grid showcasing services like workspace setup, device repair, and game installation
- **Archived Date**: 2026-01-07
- **Reason**: Removed from homepage per user request

### ServicesPreview.tsx
- **Original Location**: `components/ServicesPreview.tsx`
- **Description**: "Top Services" section - Detailed cards showing Custom PC Building, Office Space Setup, and Software Installation services
- **Archived Date**: 2026-01-07
- **Reason**: Removed from homepage per user request

## Usage

If you want to restore these components to the homepage, you can:

1. Move them back to the main `components/` folder
2. Add the dynamic imports in `app/page.tsx`:
```tsx
const ServicesPromoGrid = dynamic(() => import("@/components/ServicesPromoGrid").then(mod => ({ default: mod.ServicesPromoGrid })), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
})

const ServicesPreview = dynamic(() => import("@/components/ServicesPreview").then(mod => ({ default: mod.ServicesPreview })), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
})
```
3. Add them to the page JSX
