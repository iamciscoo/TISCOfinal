"use client";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

export type DailyPoint = { date: string; total: number; products: number; services: number; successful: number };

const chartConfig = {
  products: { label: "Products", color: "#3b82f6" }, // blue-500
  services: { label: "Services", color: "#8b5cf6" }, // violet-500
} satisfies ChartConfig;

export default function DailyRevenueChart({ data }: { data: DailyPoint[] }) {
  return (
    <ChartContainer config={chartConfig} className="min-h-[220px] w-full">
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => {
            try {
              const d = new Date(String(value))
              return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
            } catch {
              return String(value)
            }
          }}
        />
        <YAxis tickLine={false} tickMargin={10} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="products" stackId="a" fill="var(--color-products)" radius={4} />
        <Bar dataKey="services" stackId="a" fill="var(--color-services)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
