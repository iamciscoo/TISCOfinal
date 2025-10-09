# 🎨 TISCO Styling & Components Guide

**Last Updated:** October 9, 2025  
**Version:** 3.1  
**For:** Designers, Developers, and Maintainers

---

## 📋 Table of Contents

1. [Foundation Principles](#1-foundation-principles)
2. [Technology Stack](#2-technology-stack)
3. [Design System](#3-design-system)
4. [Component Library](#4-component-library)
5. [Animation System](#5-animation-system)
6. [Responsive Design](#6-responsive-design)

---

## 1. Foundation Principles

### 🎯 Simple to Complex Approach

**What is a Component?** (Beginner Level)
Components are like LEGO blocks - reusable pieces that build your UI:

```tsx
// Simple: A button
<Button>Click Me</Button>

// Complex: Built from simple pieces
<Card>
  <CardHeader><CardTitle>Product</CardTitle></CardHeader>
  <CardContent>
    <ProductImage />
    <ProductPrice />
    <Button>Add to Cart</Button>
  </CardContent>
</Card>
```

**What is Styling?** (Beginner Level)
TailwindCSS uses utility classes instead of traditional CSS files:

```tsx
// Traditional way (old)
<button className="my-button">Click</button>
// CSS: .my-button { background: blue; padding: 10px; }

// Tailwind way (TISCO)
<button className="bg-blue-500 px-4 py-2 rounded-lg">Click</button>
// No CSS file needed!
```

**What is Animation?** (Beginner Level)
Framer Motion makes elements move smoothly:

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Smooth fade-in and slide-up!
</motion.div>
```

---

## 2. Technology Stack

### 🛠️ Core Technologies

| Technology | Purpose | Why We Use It |
|------------|---------|---------------|
| **TailwindCSS** | Utility-first CSS framework | Fast development, small bundle size, consistency |
| **shadcn/ui** | Component library (Radix UI) | Accessible, customizable, copy-paste |
| **Framer Motion** | Animation library | Declarative animations, gesture support |
| **Lucide Icons** | Icon library | 1000+ icons, tree-shakeable, consistent |
| **Next.js Image** | Image optimization | Automatic WebP, lazy loading, responsive |

### 📦 Installation

```bash
# TailwindCSS (already configured)
npm install tailwindcss postcss autoprefixer

# shadcn/ui components
npx shadcn-ui@latest add button card dialog input

# Framer Motion
npm install framer-motion

# Lucide Icons
npm install lucide-react
```

### 📍 File Locations

```
/client/
├── tailwind.config.ts          # Tailwind configuration
├── components/
│   ├── ui/                     # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   └── shared/                 # Custom shared components
│       ├── ProductCard.tsx
│       ├── LoadingSpinner.tsx
│       └── StatusBadge.tsx
```

---

## 3. Design System

### 🎨 Color Palette

#### Primary Colors
```tsx
// Blue - Main brand color
bg-primary-500      // Button backgrounds
text-primary-600    // Links
hover:bg-primary-600 // Hover states

// Semantic Colors
bg-green-500    // Success states
bg-yellow-500   // Warning states
bg-red-500      // Error/destructive states
bg-blue-500     // Informational states
```

#### Neutral Colors
```tsx
bg-gray-50    // Page backgrounds
bg-gray-100   // Card backgrounds
bg-gray-200   // Borders
text-gray-600 // Body text
text-gray-900 // Headings
```

### 📏 Spacing System (8px Grid)

```tsx
space-1   // 4px  - Tight spacing
space-2   // 8px  - Icon gaps
space-4   // 16px - Standard spacing (most common)
space-6   // 24px - Card padding
space-8   // 32px - Section margins
space-12  // 48px - Page sections
```

**Common Patterns**:
```tsx
<button className="px-4 py-2">     // Button padding
<Card className="p-6 space-y-4">   // Card with vertical gaps
<section className="py-12 px-4">   // Page section
```

### ✍️ Typography

```tsx
// Font Sizes
text-xs    // 12px - Labels
text-sm    // 14px - Secondary text
text-base  // 16px - Body (default)
text-lg    // 18px - Emphasized text
text-xl    // 20px - Subheadings
text-2xl   // 24px - Card titles
text-3xl   // 30px - Page headings
text-4xl   // 36px - Hero headings

// Font Weights
font-normal    // 400 - Body
font-medium    // 500 - Emphasis
font-semibold  // 600 - Headings
font-bold      // 700 - Important headings

// Line Heights
leading-tight    // 1.25 - Headings
leading-normal   // 1.5  - Body
leading-relaxed  // 1.625 - Long paragraphs
```

### 🔲 Borders & Shadows

```tsx
// Border Radius
rounded        // 4px - Cards
rounded-md     // 6px - Buttons
rounded-lg     // 8px - Large cards
rounded-full   // Circle/pill shape

// Shadows
shadow-sm      // Subtle hover
shadow         // Cards at rest
shadow-md      // Elevated cards
shadow-lg      // Modals
shadow-xl      // Popovers
```

---

## 4. Component Library

### 🧱 Basic Components (`/client/components/ui/`)

#### Button (`button.tsx`)
```tsx
// Variants
<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost">Close</Button>
<Button variant="outline">Filter</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Normal</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Plus /></Button>

// States
<Button disabled>Disabled</Button>
<Button>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Loading...
</Button>
```

#### Badge (`badge.tsx`)
```tsx
<Badge variant="default">New</Badge>
<Badge variant="secondary">Category</Badge>
<Badge variant="destructive">Out of Stock</Badge>
<Badge variant="outline">Featured</Badge>
```

#### Input (`input.tsx`)
```tsx
<Input type="text" placeholder="Name" />
<Input type="email" placeholder="Email" />
<Input type="password" placeholder="Password" />
<Input type="number" min="1" placeholder="Quantity" />
<Input type="search" placeholder="Search..." />
```

### 📦 Container Components

#### Card (`card.tsx`)
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

#### Sheet (`sheet.tsx`) - Mobile Drawer
```tsx
<Sheet open={open} onOpenChange={setOpen}>
  <SheetTrigger asChild>
    <Button>Open</Button>
  </SheetTrigger>
  <SheetContent side="right" className="w-[400px]">
    <SheetHeader>
      <SheetTitle>Shopping Cart</SheetTitle>
    </SheetHeader>
    {/* Content */}
    <SheetFooter>
      <Button>Checkout</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

#### Dialog (`dialog.tsx`) - Modal
```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Profile</DialogTitle>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 🎛️ Interactive Components

#### Select (`select.tsx`)
```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

**Mobile Fix Applied (Oct 2025)**:
```tsx
// Enhanced z-index and touch targets
<SelectContent className="z-[9999]">
  {/* 44px minimum touch targets for iOS */}
</SelectContent>
```

#### Dropdown Menu (`dropdown-menu.tsx`)
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost">
      <MoreVertical className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={handleEdit}>
      <Edit className="mr-2 h-4 w-4" />
      Edit
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleDelete}>
      <Trash2 className="mr-2 h-4 w-4" />
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

#### Toast (`toast.tsx`) - Notifications
```tsx
import { useToast } from '@/hooks/use-toast'

function Component() {
  const { toast } = useToast()
  
  const showSuccess = () => {
    toast({
      title: "Success!",
      description: "Product added to cart"
    })
  }
  
  const showError = () => {
    toast({
      title: "Error",
      description: "Failed to add product",
      variant: "destructive"
    })
  }
}
```

**Mobile Fix Applied (Oct 2025)**:
```tsx
// Close button now visible on mobile
<ToastClose className="opacity-70 sm:opacity-0 sm:hover:opacity-100" />
```

---

## 5. Animation System

### 🎬 Framer Motion Basics

#### Simple Animations
```tsx
import { motion } from 'framer-motion'

// Fade in + slide up
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>

// Hover effects
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Click Me
</motion.button>
```

#### Staggered Animations (List Items)
```tsx
<motion.ul
  variants={{
    visible: {
      transition: { staggerChildren: 0.1 }
    }
  }}
  initial="hidden"
  animate="visible"
>
  {items.map(item => (
    <motion.li
      key={item.id}
      variants={{
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
      }}
    >
      {item.name}
    </motion.li>
  ))}
</motion.ul>
```

#### Layout Animations
```tsx
// Smooth transitions when layout changes
<motion.div layout>
  {expanded ? <FullContent /> : <Summary />}
</motion.div>
```

### Common Animation Patterns in TISCO

#### Product Card Hover
```tsx
<motion.div
  whileHover={{ y: -4, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
  transition={{ type: "spring", stiffness: 300 }}
>
  <ProductCard />
</motion.div>
```

#### Modal Enter/Exit
```tsx
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Modal />
    </motion.div>
  )}
</AnimatePresence>
```

#### Loading Spinner
```tsx
<motion.div
  animate={{ rotate: 360 }}
  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
>
  <Loader2 className="h-8 w-8" />
</motion.div>
```

---

## 6. Responsive Design

### 📱 Breakpoint System

```tsx
// Tailwind breakpoints
sm: '640px'   // Mobile landscape
md: '768px'   // Tablet
lg: '1024px'  // Desktop
xl: '1280px'  // Large desktop
2xl: '1536px' // Extra large
```

### Mobile-First Approach

```tsx
// Start with mobile, add larger screens
<div className="
  p-4           // Mobile: 16px padding
  md:p-6        // Tablet: 24px padding
  lg:p-8        // Desktop: 32px padding
  
  text-base     // Mobile: 16px text
  md:text-lg    // Tablet: 18px text
  lg:text-xl    // Desktop: 20px text
  
  grid-cols-1   // Mobile: 1 column
  md:grid-cols-2 // Tablet: 2 columns
  lg:grid-cols-3 // Desktop: 3 columns
">
  Content
</div>
```

### Common Responsive Patterns

#### Navigation
```tsx
// Mobile: Hamburger menu
// Desktop: Full navigation bar
<nav className="
  flex items-center justify-between
  p-4 lg:px-8
">
  <Logo />
  
  {/* Mobile menu button */}
  <Button className="lg:hidden" onClick={toggleMenu}>
    <Menu />
  </Button>
  
  {/* Desktop menu */}
  <div className="hidden lg:flex gap-6">
    <NavLink href="/products">Products</NavLink>
    <NavLink href="/services">Services</NavLink>
    <NavLink href="/about">About</NavLink>
  </div>
</nav>
```

#### Product Grid
```tsx
<div className="
  grid gap-4
  grid-cols-1      // Mobile: 1 column
  sm:grid-cols-2   // Small: 2 columns
  lg:grid-cols-3   // Large: 3 columns
  xl:grid-cols-4   // XL: 4 columns
">
  {products.map(product => (
    <ProductCard key={product.id} {...product} />
  ))}
</div>
```

#### Typography
```tsx
<h1 className="
  text-2xl md:text-3xl lg:text-4xl  // Responsive font size
  font-bold
  leading-tight
">
  Hero Heading
</h1>
```

### Touch-Friendly Design (Mobile)

```tsx
// Minimum 44px touch targets (iOS guidelines)
<button className="
  min-h-[44px] min-w-[44px]
  flex items-center justify-center
  touch-manipulation   // Prevents double-tap zoom
  select-none          // Prevents text selection
">
  <Icon />
</button>
```

---

## 🎯 Component Usage Examples

### Real-World: Product Card

```tsx
export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCartStore()
  const { toast } = useToast()
  
  const handleAddToCart = () => {
    addItem(product)
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart`
    })
  }
  
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className="h-full hover:shadow-lg transition-shadow">
        <CardHeader className="p-0">
          <Image
            src={product.image_url}
            alt={product.name}
            width={300}
            height={300}
            className="rounded-t-lg object-cover"
          />
        </CardHeader>
        
        <CardContent className="p-4 space-y-2">
          <CardTitle className="text-lg line-clamp-2">
            {product.name}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <PriceDisplay
              amount={product.price}
              currency="TZS"
              className="text-xl font-bold text-primary-600"
            />
            
            {product.is_featured && (
              <Badge variant="secondary">Featured</Badge>
            )}
          </div>
          
          {product.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm text-gray-600">
                {product.rating} ({product.reviews_count})
              </span>
            </div>
          )}
          
          <p className="text-sm text-gray-600 line-clamp-2">
            {product.description}
          </p>
        </CardContent>
        
        <CardFooter className="p-4 pt-0">
          <Button
            onClick={handleAddToCart}
            className="w-full"
            disabled={product.stock_quantity === 0}
          >
            {product.stock_quantity > 0 ? (
              <>
                <ShoppingCart className="mr-2 w-4 h-4" />
                Add to Cart
              </>
            ) : (
              "Out of Stock"
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
```

### Real-World: Shopping Cart Sheet

```tsx
export function CartSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const { items, removeItem, updateQuantity, total } = useCartStore()
  
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {items.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0"
            >
              {items.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Shopping Cart</SheetTitle>
          <SheetDescription>
            You have {items.length} {items.length === 1 ? 'item' : 'items'}
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-8 space-y-4 flex-1 overflow-auto">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Your cart is empty</p>
            </div>
          ) : (
            items.map(item => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="rounded object-cover"
                    />
                    
                    <div className="flex-1">
                      <h4 className="font-medium line-clamp-1">
                        {item.name}
                      </h4>
                      <PriceDisplay
                        amount={item.price}
                        currency="TZS"
                        className="text-sm text-gray-600"
                      />
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        
                        <span className="w-8 text-center">{item.quantity}</span>
                        
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 ml-auto text-red-600"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        <SheetFooter className="border-t pt-4 mt-auto">
          <div className="w-full space-y-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <PriceDisplay amount={total} currency="TZS" />
            </div>
            
            <Button
              className="w-full"
              size="lg"
              disabled={items.length === 0}
              onClick={() => router.push('/checkout')}
            >
              Proceed to Checkout
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
```

---

## 📚 Additional Resources

### Component Documentation
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Radix UI Primitives](https://www.radix-ui.com)
- [Framer Motion Docs](https://www.framer.com/motion)

### Design Resources
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Lucide Icons Library](https://lucide.dev)
- [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)

### Best Practices
- Always use semantic HTML elements
- Ensure 44px minimum touch targets on mobile
- Test components in both light and dark modes
- Provide loading and error states for all interactive components
- Use proper ARIA labels for accessibility

---

**For detailed animation examples and advanced patterns, see:** `ANIMATION-PATTERNS.md`  
**For accessibility guidelines, see:** `ACCESSIBILITY-GUIDE.md`  
**For performance optimization techniques, see:** `PERFORMANCE-OPTIMIZATION.md`
