import AppBarChart from "@/components/AppBarChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminStats } from "@/lib/database";
import { DollarSign } from "lucide-react";

const RevenuePage = async () => {
  const stats = await getAdminStats();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">TZS {stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Paid orders total</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <div className="bg-primary-foreground p-4 rounded-lg">
        <h1 className="text-xl font-semibold mb-4">Revenue (last 6 months)</h1>
        <AppBarChart />
      </div>
    </div>
  );
};

export default RevenuePage;
