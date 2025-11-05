import AppBarChart from "@/components/AppBarChart";
import DailyRevenueChart from "@/components/revenue/DailyRevenueChart";
import PaymentMethodDonut from "@/components/revenue/PaymentMethodDonut";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAdminStats,
  getDailyRevenue,
  getPaymentMethodBreakdown,
  getTopProductsByRevenue,
  getTopServicesByRevenue,
  getRevenueKPIs,
  getRevenueByCategory,
  getRevenueTrends,
  getConversionMetrics,
  getPaymentMethodDetails,
  getExpenseSummary,
  getNetProfitMetrics,
} from "@/lib/database";
import { 
  DollarSign, 
  Receipt, 
  Wrench, 
  TrendingUp, 
  Wallet, 
  ShoppingCart, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Package,
  Tag,
  CreditCard,
  Minus,
  PiggyBank,
  BarChart3
} from "lucide-react";

function formatTZS(n: number | string | null | undefined) {
  const v = Number(n ?? 0);
  return `TZS ${v.toLocaleString()}`;
}

function formatPercentage(n: number) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
}

const RevenuePage = async () => {
  const [
    stats, 
    daily, 
    paymentSlices, 
    topProducts, 
    topServices, 
    kpis,
    categoryRevenue,
    trends,
    conversion,
    paymentDetails,
    expenseSummary,
    netProfit
  ] = await Promise.all([
    getAdminStats(),
    getDailyRevenue(30),
    getPaymentMethodBreakdown(90),
    getTopProductsByRevenue(5, 90),
    getTopServicesByRevenue(5, 90),
    getRevenueKPIs(),
    getRevenueByCategory(90),
    getRevenueTrends(30),
    getConversionMetrics(30),
    getPaymentMethodDetails(90),
    getExpenseSummary(30),
    getNetProfitMetrics(30),
  ]);

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Revenue Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Comprehensive revenue insights and performance metrics</p>
        </div>
      </div>

      {/* Net Profit Highlight Banner */}
      <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 shadow-xl">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm sm:text-base font-medium opacity-90">Net Profit (Last 30 Days)</p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">{formatTZS(netProfit.netProfit)}</h2>
                <span className={`text-lg font-semibold ${netProfit.profitMargin >= 0 ? 'text-emerald-100' : 'text-red-200'}`}>
                  {netProfit.profitMargin.toFixed(1)}% margin
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs sm:text-sm opacity-90 mt-2">
                <div>Revenue: {formatTZS(netProfit.revenue)}</div>
                <div>•</div>
                <div>Expenses: {formatTZS(netProfit.expenses)}</div>
                <div>•</div>
                <div>Daily Avg: {formatTZS(netProfit.dailyAverage)}</div>
              </div>
            </div>
            <div className="hidden sm:block">
              <PiggyBank className="h-16 w-16 sm:h-20 sm:w-20 opacity-20" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards with Trends */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Revenue (30d)</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatTZS(trends.currentPeriodRevenue)}</div>
            <div className="flex items-center mt-1 text-xs">
              {trends.growthPercentage >= 0 ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-green-600 font-medium">{formatPercentage(trends.growthPercentage)}</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
                  <span className="text-red-600 font-medium">{formatPercentage(trends.growthPercentage)}</span>
                </>
              )}
              <span className="text-muted-foreground ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Product Revenue</CardTitle>
            <Receipt className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatTZS(stats.productRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">All-time paid orders</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Service Revenue</CardTitle>
            <Wrench className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatTZS(stats.serviceRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">All-time bookings</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Avg Order Value</CardTitle>
            <ShoppingCart className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatTZS(kpis.avgOrderValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">This month average</p>
          </CardContent>
        </Card>
      </div>

      {/* Expense Summary */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-red-50 to-rose-100 border-rose-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-rose-900 flex items-center gap-2">
              <Minus className="h-4 w-4" />
              Total Expenses (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-900">{formatTZS(expenseSummary.totalExpenses)}</div>
            <p className="text-xs text-rose-700 mt-1">{expenseSummary.expenseCount} expense entries</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-900 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Monthly Projection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">{formatTZS(netProfit.monthlyProjection)}</div>
            <p className="text-xs text-amber-700 mt-1">Based on 30-day average</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-blue-100 border-indigo-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-indigo-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <a 
              href="/expenses" 
              className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              Manage Expenses →
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Conversion & Performance Metrics */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              Paid Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-600">{conversion.paidOrders}</div>
            <p className="text-[10px] text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-yellow-600" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-yellow-600">{conversion.pendingOrders}</div>
            <p className="text-[10px] text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center gap-1">
              <XCircle className="h-3 w-3 text-red-600" />
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-red-600">{conversion.failedOrders}</div>
            <p className="text-[10px] text-muted-foreground">Payment failed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-blue-600" />
              Conversion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-blue-600">{conversion.conversionRate.toFixed(1)}%</div>
            <p className="text-[10px] text-muted-foreground">Success rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center gap-1">
              <Clock className="h-3 w-3 text-purple-600" />
              Avg Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-purple-600">{conversion.averageProcessingTime.toFixed(1)}h</div>
            <p className="text-[10px] text-muted-foreground">To payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center gap-1">
              <Package className="h-3 w-3 text-indigo-600" />
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-indigo-600">{conversion.totalOrders}</div>
            <p className="text-[10px] text-muted-foreground">All statuses</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Revenue Trend (last 6 months)</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <AppBarChart />
        </CardContent>
      </Card>

      {/* Daily revenue & Category Breakdown */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Daily Revenue (last 30 days)</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <DailyRevenueChart data={daily} />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Revenue by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-4">
            {categoryRevenue.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">No category data yet</div>
            ) : (
              <div className="space-y-3">
                {categoryRevenue.slice(0, 5).map((cat) => (
                  <div key={cat.category_id || 'uncategorized'} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate">{cat.category_name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{cat.orders_count} items</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full"
                          style={{ 
                            width: `${(cat.revenue / categoryRevenue[0].revenue) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold tabular-nums min-w-[80px] text-right">
                        {formatTZS(cat.revenue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expense Breakdown */}
      {expenseSummary.expenseCount > 0 && (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Minus className="h-4 w-4 text-rose-600" />
                Expenses by Category (30d)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-4">
              <div className="space-y-3">
                {expenseSummary.byCategory.slice(0, 5).map((cat) => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate">{cat.category}</span>
                      <span className="text-xs text-muted-foreground ml-2">{cat.count} entries</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-rose-500 to-red-500 rounded-full"
                          style={{ 
                            width: `${(cat.amount / expenseSummary.byCategory[0].amount) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold tabular-nums min-w-[80px] text-right">
                        {formatTZS(cat.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-600" />
                Expenses by Frequency
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-4">
              <div className="space-y-3">
                {expenseSummary.byFrequency.map((freq) => (
                  <div key={freq.frequency} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      <div>
                        <div className="font-medium text-sm capitalize">{freq.frequency}</div>
                        <div className="text-xs text-muted-foreground">{freq.count} entries</div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold">{formatTZS(freq.amount)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Methods Details & Top Performers */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Method Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-4">
            {paymentDetails.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">No payment data yet</div>
            ) : (
              <div className="space-y-3">
                {paymentDetails.map((pm) => (
                  <div key={pm.method} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold capitalize text-sm">{pm.method}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {pm.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-muted-foreground">Revenue</div>
                        <div className="font-semibold">{formatTZS(pm.revenue)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Orders</div>
                        <div className="font-semibold">{pm.orderCount}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Avg Value</div>
                        <div className="font-semibold">{formatTZS(pm.averageOrderValue)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3 sm:space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Top Products (90 days)</CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-4">
              {topProducts.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">No data yet</div>
              ) : (
                <ul className="divide-y">
                  {topProducts.map((p, idx) => (
                    <li key={String(p.id)} className="py-2 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 flex-1 truncate">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-semibold">
                          {idx + 1}
                        </span>
                        <span className="truncate">{p.name}</span>
                      </div>
                      <div className="text-right ml-2">
                        <div className="font-semibold text-xs">{formatTZS(p.revenue)}</div>
                        {p.quantity && <div className="text-[10px] text-muted-foreground">×{p.quantity}</div>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Top Services (90 days)</CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-4">
              {topServices.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">No data yet</div>
              ) : (
                <ul className="divide-y">
                  {topServices.map((s, idx) => (
                    <li key={String(s.id)} className="py-2 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 flex-1 truncate">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs flex items-center justify-center font-semibold">
                          {idx + 1}
                        </span>
                        <span className="truncate">{s.name}</span>
                      </div>
                      <div className="font-semibold text-xs">{formatTZS(s.revenue)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-blue-900">Today's Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-900">{formatTZS(kpis.todayRevenue)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-green-900">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-900">{formatTZS(kpis.monthRevenue)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-purple-900">Orders This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-purple-900">{kpis.paidOrdersCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-orange-900">Bookings This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-orange-900">{kpis.paidBookingsCount}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RevenuePage;
