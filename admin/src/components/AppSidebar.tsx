'use client'

import { useRouter } from 'next/navigation'
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
  ShoppingCart,
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
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      router.push('/login')
    }
  }

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-4 py-3">
          <img src="/logo.svg" alt="Admin" className="h-8 w-8" />
          <span data-collapse-hide className="font-chango text-xl font-bold text-sidebar-foreground">
            Admin
          </span>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      {!isCollapsed && <span data-collapse-hide>{item.title}</span>}
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
                  <Link href="/products">
                    <Shirt />
                    {!isCollapsed && <span data-collapse-hide>All Products</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="All Categories">
                  <Link href="/categories">
                    <FolderOpen />
                    {!isCollapsed && <span data-collapse-hide>All Categories</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Add Product">
                  <Link href="/products/new">
                    <Plus />
                    {!isCollapsed && <span data-collapse-hide>Add Product</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Sheet>
                  <SheetTrigger asChild>
                    <SidebarMenuButton tooltip="Add Category">
                      <Plus />
                      {!isCollapsed && <span data-collapse-hide>Add Category</span>}
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
                  <Link href="/users">
                    <User />
                    {!isCollapsed && <span data-collapse-hide>All Customers</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Sheet>
                  <SheetTrigger asChild>
                    <SidebarMenuButton tooltip="Add Customer">
                      <Plus />
                      {!isCollapsed && <span data-collapse-hide>Add Customer</span>}
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
                  <Link href="/orders">
                    <Package />
                    {!isCollapsed && <span data-collapse-hide>All Orders</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="All Payments">
                  <Link href="/payments">
                    <CreditCard />
                    {!isCollapsed && <span data-collapse-hide>All Payments</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Cart Management">
                  <Link href="/cart">
                    <ShoppingCart />
                    {!isCollapsed && <span data-collapse-hide>Cart Management</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Sheet>
                  <SheetTrigger asChild>
                    <SidebarMenuButton tooltip="Add Order">
                      <Plus />
                      {!isCollapsed && <span data-collapse-hide>Add Order</span>}
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
                  <Link href="/services">
                    <Wrench />
                    {!isCollapsed && <span data-collapse-hide>All Services</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Service Bookings">
                  <Link href="/service-bookings">
                    <CalendarCheck />
                    {!isCollapsed && <span data-collapse-hide>Service Bookings</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Add Service">
                  <Link href="/services/new">
                    <Plus />
                    {!isCollapsed && <span data-collapse-hide>Add Service</span>}
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
                  <Link href="/reviews">
                    <Star />
                    {!isCollapsed && <span data-collapse-hide>Reviews</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Newsletter">
                  <Link href="/newsletter">
                    <Mail />
                    {!isCollapsed && <span data-collapse-hide>Newsletter</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Messages">
                  <Link href="/messages">
                    <Mail />
                    {!isCollapsed && <span data-collapse-hide>Messages</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* Notifications moved to Application group under Revenue */}
              <SidebarMenuItem>
                <Sheet>
                  <SheetTrigger asChild>
                    <SidebarMenuButton tooltip="Add Review">
                      <Plus />
                      {!isCollapsed && <span data-collapse-hide>Add Review</span>}
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
                  {!isCollapsed && <span data-collapse-hide>Admin User</span>}
                  <ChevronUp className="ml-auto" data-collapse-hide />
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
