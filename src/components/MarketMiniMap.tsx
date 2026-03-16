import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motionVariants";

const sectors = [
  { name: "IT Services", change: 2.4, stocks: ["INFY", "TCS", "WIPRO"] },
  { name: "Banking", change: 1.8, stocks: ["HDFC", "ICICI", "SBIN"] },
  { name: "Auto", change: 3.1, stocks: ["TATAMOTORS", "MARUTI"] },
  { name: "Pharma", change: -0.5, stocks: ["SUNPHARMA", "DRREDDY"] },
  { name: "Energy", change: 0.8, stocks: ["RELIANCE", "ONGC"] },
  { name: "FMCG", change: -0.2, stocks: ["HUL", "ITC"] },
  { name: "Metals", change: 1.2, stocks: ["TATASTEEL", "HINDALCO"] },
  { name: "Telecom", change: 0.5, stocks: ["BHARTIARTL", "IDEA"] },
];

function getHeatColor(change: number): string {
  if (change >= 2) return "bg-success/30 border-success/40 text-success";
  if (change >= 0.5) return "bg-success/15 border-success/20 text-success";
  if (change >= 0) return "bg-muted border-border text-muted-foreground";
  if (change >= -1) return "bg-destructive/15 border-destructive/20 text-destructive";
  return "bg-destructive/30 border-destructive/40 text-destructive";
}

export default function MarketMiniMap() {
  return (
    <div className="rounded-md border border-border bg-card p-3 md:p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 md:mb-3">
        Sector Heatmap
      </h3>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-4 gap-1.5"
      >
        {sectors.map((sector) => (
          <motion.div
            key={sector.name}
            variants={staggerItem}
            className={`rounded border p-1.5 md:p-2 text-center cursor-pointer transition-all hover:scale-105 ${getHeatColor(sector.change)}`}
          >
            <div className="text-[9px] md:text-[10px] font-medium truncate">{sector.name}</div>
            <div className="font-mono text-[10px] md:text-xs font-bold mt-0.5">
              {sector.change > 0 ? "+" : ""}{sector.change}%
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
