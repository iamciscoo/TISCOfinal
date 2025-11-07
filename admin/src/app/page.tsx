import AppBarChart from "@/components/AppBarChart";
import { getDashboardData } from "@/lib/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Users, Package, DollarSign, AlertTriangle, Clock } from "lucide-react";

const Homepage = async () => {
  const dashboardData = await getDashboardData();
  const { stats } = dashboardData;

  return (
    <div className="flex-1 space-y-4 sm:space-y-6 lg:space-y-8 p-3 sm:p-4 lg:p-6 pt-3 sm:pt-4 lg:pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Net Revenue</CardTitle>
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-base sm:text-xl lg:text-2xl font-bold text-foreground">TZS {(stats.netRevenue || 0).toLocaleString()}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Revenue minus expenses</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-base sm:text-xl lg:text-2xl font-bold text-foreground">{stats.totalOrders}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">All time orders</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-base sm:text-xl lg:text-2xl font-bold text-foreground">{stats.totalUsers}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Registered users</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Products</CardTitle>
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center flex-shrink-0">
              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600 dark:text-orange-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-base sm:text-xl lg:text-2xl font-bold text-foreground">{stats.totalProducts}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">In catalog</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert Cards */}
      <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 md:grid-cols-2">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Pending Orders</CardTitle>
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center flex-shrink-0">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600 dark:text-yellow-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-base sm:text-xl lg:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendingOrders}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Requires attention</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-base sm:text-xl lg:text-2xl font-bold text-red-600 dark:text-red-400">{stats.lowStockProducts}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Below 10 items</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg font-semibold">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <AppBarChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Homepage;
