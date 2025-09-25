'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
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
    title: "Notifications",
    url: "/notifications",
    icon: Bell,
  },
];

const AppSidebar = () => {
  const router = useRouter()
  const { state, setOpenMobile, isMobile, open } = useSidebar()
  const isCollapsed = state === "collapsed"
  
  // On mobile, show text when sidebar is open, regardless of collapsed state
  const shouldShowText = isMobile ? open : !isCollapsed

  // Auto-collapse sidebar on mobile when navigation occurs
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) { // Mobile breakpoint
        setOpenMobile(false)
      }
    }

    // Close sidebar on mobile when clicking navigation links
    const handleNavigation = () => {
      if (window.innerWidth < 768) {
        setOpenMobile(false)
      }
    }

    // Listen for navigation events
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [setOpenMobile])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      router.push('/login')
    }
  }

  return (
    <Sidebar variant="inset" collapsible="icon">
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
                    <Link href={item.url} onClick={() => window.innerWidth < 768 && setOpenMobile(false)}>
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
          <SidebarGroupAction className="group-data-[collapsible=icon]:hidden">
            <Plus /> <span className="sr-only">Add Product</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="All Products">
                  <Link href="/products" onClick={() => window.innerWidth < 768 && setOpenMobile(false)}>
                    <Shirt />
                    {shouldShowText && <span>All Products</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="All Categories">
                  <Link href="/categories" onClick={() => window.innerWidth < 768 && setOpenMobile(false)}>
                    <FolderOpen />
                    {shouldShowText && <span>All Categories</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Add Product">
                  <Link href="/products/new" onClick={() => window.innerWidth < 768 && setOpenMobile(false)}>
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
          <SidebarGroupAction className="group-data-[collapsible=icon]:hidden">
            <Plus /> <span className="sr-only">Add Customer</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="All Customers">
                  <Link href="/users" onClick={() => window.innerWidth < 768 && setOpenMobile(false)}>
                    <User />
                    {shouldShowText && <span>All Customers</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Sheet>
                  <SheetTrigger asChild>
                    <SidebarMenuButton tooltip="Add Customer">
                      <Plus />
                      {shouldShowText && <span>Add Customer</span>}
                    </SidebarMenuButton>
                  </SheetTrigger>
                  <AddUser />
                </Sheet>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Orders & Payments</SidebarGroupLabel>
          <SidebarGroupAction className="group-data-[collapsible=icon]:hidden">
            <Plus /> <span className="sr-only">Add Order</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="All Orders">
                  <Link href="/orders" onClick={() => window.innerWidth < 768 && setOpenMobile(false)}>
                    <Package />
                    {shouldShowText && <span>All Orders</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="All Payments">
                  <Link href="/payments" onClick={() => window.innerWidth < 768 && setOpenMobile(false)}>
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
          <SidebarGroupAction className="group-data-[collapsible=icon]:hidden">
            <Plus /> <span className="sr-only">Add Service</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="All Services">
                  <Link href="/services" onClick={() => window.innerWidth < 768 && setOpenMobile(false)}>
                    <Wrench />
                    {shouldShowText && <span>All Services</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Service Bookings">
                  <Link href="/service-bookings" onClick={() => window.innerWidth < 768 && setOpenMobile(false)}>
                    <CalendarCheck />
                    {shouldShowText && <span>Service Bookings</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Add Service">
                  <Link href="/services/new" onClick={() => window.innerWidth < 768 && setOpenMobile(false)}>
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
          <SidebarGroupAction className="group-data-[collapsible=icon]:hidden">
            <Plus /> <span className="sr-only">Add Review</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Reviews">
                  <Link href="/reviews" onClick={() => window.innerWidth < 768 && setOpenMobile(false)}>
                    <Star />
                    {shouldShowText && <span>Reviews</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Newsletter">
                  <Link href="/newsletter" onClick={() => window.innerWidth < 768 && setOpenMobile(false)}>
                    <Mail />
                    {shouldShowText && <span>Newsletter</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Messages">
                  <Link href="/messages" onClick={() => window.innerWidth < 768 && setOpenMobile(false)}>
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
