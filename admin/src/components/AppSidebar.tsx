'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Home,
  User2,
  ChevronUp,
  Plus,
  Shirt,
  User,
  FolderOpen,
  Package,
  CreditCard,
  LogOut,
  Star,
  Wrench,
  DollarSign,
  CalendarCheck,
  Mail,
  Bell,
  Receipt,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,

  SidebarSeparator,
  useSidebar,
} from "./ui/sidebar";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Sheet, SheetTrigger } from "./ui/sheet";
import AddOrder from "./AddOrder";
import AddUser from "./AddUser";
import AddCategory from "./AddCategory";
import AddReview from "./AddReview";
 

const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Revenue",
    url: "/revenue",
    icon: DollarSign,
  },
  {
    title: "Expenses",
    url: "/expenses",
    icon: Receipt,
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: Bell,
  },
];

const AppSidebar = () => {
  const router = useRouter()
  const { state, setOpenMobile, isMobile, open } = useSidebar()
  const isCollapsed = state === "collapsed"
  const [isMobileView, setIsMobileView] = useState(false)
  
  // Memoize expensive check - only re-compute when state changes
  const shouldShowText = useMemo(() => isMobileView ? true : !isCollapsed, [isMobileView, isCollapsed])

  // Initialize and track mobile view state
  useEffect(() => {
    // Initial check
    const checkMobile = () => window.innerWidth < 768
    setIsMobileView(checkMobile())

    // Debounced resize handler for performance
    let resizeTimer: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        const isMobile = checkMobile()
        setIsMobileView(isMobile)
        if (isMobile) {
          setOpenMobile(false)
        }
      }, 150) // Debounce for 150ms
    }

    window.addEventListener('resize', handleResize)
    return () => {
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', handleResize)
    }
  }, [setOpenMobile])

  // Memoized mobile close handler
  const handleMobileNavigation = useCallback(() => {
    if (isMobileView) {
      setOpenMobile(false)
    }
  }, [isMobileView, setOpenMobile])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      router.push('/login')
    }
  }

  return (
    <Sidebar variant="inset" collapsible="icon" className="md:w-64 w-72">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-3">
          <img src="/logo.svg" alt="Admin" className="h-8 w-8" />
          {shouldShowText && (
            <span className="font-chango text-xl font-bold text-sidebar-foreground">
              Admin
            </span>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url} onClick={handleMobileNavigation}>
                      <item.icon />
                      {shouldShowText && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Catalog</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="All Products">
                  <Link href="/products" onClick={handleMobileNavigation}>
                    <Shirt />
                    {shouldShowText && <span>All Products</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="All Categories">
                  <Link href="/categories" onClick={handleMobileNavigation}>
                    <FolderOpen />
                    {shouldShowText && <span>All Categories</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Add Product">
                  <Link href="/products/new" onClick={handleMobileNavigation}>
                    <Plus />
                    {shouldShowText && <span>Add Product</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Sheet>
                  <SheetTrigger asChild>
                    <SidebarMenuButton tooltip="Add Category">
                      <Plus />
                      {shouldShowText && <span>Add Category</span>}
                    </SidebarMenuButton>
                  </SheetTrigger>
                  <AddCategory />
                </Sheet>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Customers</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="All Customers">
                  <Link href="/users" onClick={handleMobileNavigation}>
                    <User />
                    {shouldShowText && <span>All Customers</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Orders & Payments</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="All Orders">
                  <Link href="/orders" onClick={handleMobileNavigation}>
                    <Package />
                    {shouldShowText && <span>All Orders</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="All Payments">
                  <Link href="/payments" onClick={handleMobileNavigation}>
                    <CreditCard />
                    {shouldShowText && <span>All Payments</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Sheet>
                  <SheetTrigger asChild>
                    <SidebarMenuButton tooltip="Add Order">
                      <Plus />
                      {shouldShowText && <span>Add Order</span>}
                    </SidebarMenuButton>
                  </SheetTrigger>
                  <AddOrder />
                </Sheet>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Services</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="All Services">
                  <Link href="/services" onClick={handleMobileNavigation}>
                    <Wrench />
                    {shouldShowText && <span>All Services</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Service Bookings">
                  <Link href="/service-bookings" onClick={handleMobileNavigation}>
                    <CalendarCheck />
                    {shouldShowText && <span>Service Bookings</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Add Service">
                  <Link href="/services/new" onClick={handleMobileNavigation}>
                    <Plus />
                    {shouldShowText && <span>Add Service</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Content & Reviews</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Reviews">
                  <Link href="/reviews" onClick={handleMobileNavigation}>
                    <Star />
                    {shouldShowText && <span>Reviews</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Newsletter">
                  <Link href="/newsletter" onClick={handleMobileNavigation}>
                    <Mail />
                    {shouldShowText && <span>Newsletter</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Messages">
                  <Link href="/messages" onClick={handleMobileNavigation}>
                    <Mail />
                    {shouldShowText && <span>Messages</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* Notifications moved to Application group under Revenue */}
              <SidebarMenuItem>
                <Sheet>
                  <SheetTrigger asChild>
                    <SidebarMenuButton tooltip="Add Review">
                      <Plus />
                      {shouldShowText && <span>Add Review</span>}
                    </SidebarMenuButton>
                  </SheetTrigger>
                  <AddReview onCreated={() => { router.push('/reviews'); (router as any).refresh?.() }} />
                </Sheet>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton tooltip="Admin">
                  <User2 />
                  {shouldShowText && <span>Admin User</span>}
                  {shouldShowText && <ChevronUp className="ml-auto" />}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
