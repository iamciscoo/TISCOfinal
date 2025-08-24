"use client";
import { useEffect, useState } from "react";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

type RevenuePoint = { month: string; total: number; successful: number };

const chartConfig = {
  total: {
    label: "Total",
    color: "var(--chart-1)",
  },
  successful: {
    label: "Successful",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

async function fetchRevenue(): Promise<RevenuePoint[]> {
  const res = await fetch("/api/dashboard/revenue", { cache: "no-store" });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json?.data) ? json.data : [];
}

const AppBarChart = () => {
  const [chartData, setChartData] = useState<RevenuePoint[]>([]);

  useEffect(() => {
    let es: EventSource | null = null;
    let aborted = false;

    const load = async () => {
      const data = await fetchRevenue();
      if (!aborted) setChartData(data);
    };
    load();

    try {
      es = new EventSource("/api/dashboard/revenue/stream");
      es.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg?.type === "orders_change") {
            load();
          }
        } catch {}
      };
      es.onerror = () => {
        es?.close();
      };
    } catch {}

    return () => {
      aborted = true;
      if (es) es.close();
    };
  }, []);

  return (
    <div className="">
      <h1 className="text-lg font-medium mb-6">Total Revenue</h1>
      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <BarChart accessibilityLayer data={chartData}>
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
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="total" fill="var(--color-total)" radius={4} />
          <Bar dataKey="successful" fill="var(--color-successful)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  );
};

export default AppBarChart;
