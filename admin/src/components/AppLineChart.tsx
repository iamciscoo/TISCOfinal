"use client";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";

type ActivityPoint = { 
  month: string; 
  orders: number; 
  total_spent?: number;
};

interface AppLineChartProps {
  data: ActivityPoint[];
}

const chartConfig = {
  orders: {
    label: "Orders",
    color: "hsl(var(--chart-1))",
  },
  total_spent: {
    label: "Total Spent",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

const AppLineChart = ({ data }: AppLineChartProps) => {
  const chartData = data || [];

  return (
    <div className="mt-4">
      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <LineChart accessibilityLayer data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => String(value).slice(0, 3)}
          />
          <YAxis tickLine={false} tickMargin={10} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line 
            dataKey="orders" 
            stroke="var(--color-orders)" 
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
};

export default AppLineChart;
