import AppBarChart from "@/components/AppBarChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminStats } from "@/lib/database";
import { DollarSign, Receipt, Wrench } from "lucide-react";

const RevenuePage = async () => {
  const stats = await getAdminStats();

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Product Revenue</CardTitle>
            <Receipt className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">TZS {stats.productRevenue.toLocaleString()}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Paid product orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Service Revenue</CardTitle>
            <Wrench className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">TZS {stats.serviceRevenue.toLocaleString()}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Paid service bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">TZS {stats.totalRevenue.toLocaleString()}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Products + services</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg lg:text-xl font-semibold">Revenue (last 6 months)</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <AppBarChart />
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenuePage;
