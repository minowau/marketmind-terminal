import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { StockHistory } from "@/lib/types";

interface Props {
  data: StockHistory[];
  height?: number;
}

export default function MarketChart({ data, height = 300 }: Props) {
  const isUp = data.length > 1 && data[data.length - 1].close >= data[0].close;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isUp ? "hsl(142, 71%, 45%)" : "hsl(0, 84%, 60%)"} stopOpacity={0.2} />
            <stop offset="100%" stopColor={isUp ? "hsl(142, 71%, 45%)" : "hsl(0, 84%, 60%)"} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 4%, 16%)" />
        <XAxis
          dataKey="date"
          tick={{ fill: "hsl(240, 5%, 65%)", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => v.slice(5)}
        />
        <YAxis
          tick={{ fill: "hsl(240, 5%, 65%)", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          domain={["auto", "auto"]}
          width={50}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(240, 6%, 10%)",
            border: "1px solid hsl(240, 4%, 16%)",
            borderRadius: 4,
            fontSize: 11,
            fontFamily: "JetBrains Mono, monospace",
          }}
          labelStyle={{ color: "hsl(0, 0%, 98%)" }}
          itemStyle={{ color: isUp ? "hsl(142, 71%, 45%)" : "hsl(0, 84%, 60%)" }}
        />
        <Area
          type="monotone"
          dataKey="close"
          stroke={isUp ? "hsl(142, 71%, 45%)" : "hsl(0, 84%, 60%)"}
          strokeWidth={1.5}
          fill="url(#chartGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
