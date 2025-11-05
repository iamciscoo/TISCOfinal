"use client";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Pie, PieChart, Cell } from "recharts";

export type PaymentSlice = { method: string; amount: number };

const COLORS = [
  "#22c55e", // green
  "#0ea5e9", // sky
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#14b8a6", // teal
  "#a3e635", // lime
];

function keyFromLabel(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export default function PaymentMethodDonut({ data }: { data: PaymentSlice[] }) {
  const total = (data || []).reduce((s, d) => s + (Number(d.amount) || 0), 0);

  const config: ChartConfig = Object.fromEntries(
    (data || []).map((d, i) => [keyFromLabel(d.method), { label: d.method, color: COLORS[i % COLORS.length] }])
  );

  const withVars = (data || []).map((d) => ({
    ...d,
    key: keyFromLabel(d.method),
    colorVar: `var(--color-${keyFromLabel(d.method)})`,
  }));

  return (
    <ChartContainer config={config} className="min-h-[220px] w-full">
      <PieChart>
        <Pie
          data={withVars}
          dataKey="amount"
          nameKey="method"
          innerRadius={60}
          outerRadius={85}
          strokeWidth={4}
          isAnimationActive={false}
        >
          {withVars.map((d, i) => (
            <Cell key={d.key} fill={d.colorVar} />
          ))}
        </Pie>
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        {/* Center total */}
        <foreignObject x="38%" y="42%" width="100" height="40">
          <div className="text-center text-xs">
            <div className="text-muted-foreground">Total</div>
            <div className="font-semibold">{total.toLocaleString()}</div>
          </div>
        </foreignObject>
      </PieChart>
    </ChartContainer>
  );
}
