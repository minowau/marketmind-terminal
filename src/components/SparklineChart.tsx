import { Line, LineChart, ResponsiveContainer } from "recharts";

interface Props {
  data: number[];
  color?: string;
}

export default function SparklineChart({ data, color }: Props) {
  const isUp = data[data.length - 1] >= data[0];
  const strokeColor = color || (isUp ? "hsl(142, 71%, 45%)" : "hsl(0, 84%, 60%)");
  const chartData = data.map((value, i) => ({ value, i }));

  return (
    <ResponsiveContainer width="100%" height={32}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={strokeColor}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
