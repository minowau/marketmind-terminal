import { motion } from "framer-motion";
import { useState } from "react";
import { pageTransition, staggerContainer, staggerItem } from "@/lib/motionVariants";
import { mockSignals } from "@/lib/mockData";
import SparklineChart from "@/components/SparklineChart";
import { scoreColor } from "@/lib/format";
import { ArrowUpDown, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";

type SortKey = "signal_score" | "confidence" | "symbol";

export default function SignalsPage() {
  const [sortBy, setSortBy] = useState<SortKey>("signal_score");
  const [sectorFilter, setSectorFilter] = useState("all");
  const navigate = useNavigate();

  const sectors = ["all", ...new Set(mockSignals.map((s) => s.sector))];

  const filtered = sectorFilter === "all" ? mockSignals : mockSignals.filter((s) => s.sector === sectorFilter);
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "symbol") return a.symbol.localeCompare(b.symbol);
    return b[sortBy] - a[sortBy];
  });

  return (
    <motion.div {...pageTransition} className="p-3 md:p-4 space-y-3 md:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-lg font-bold text-foreground">Signal Detections</h1>
        <div className="flex items-center gap-1 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {sectors.map((s) => (
            <button
              key={s}
              onClick={() => setSectorFilter(s)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                sectorFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop table — hidden on mobile */}
      <div className="rounded-md border border-border bg-card overflow-hidden hidden md:block">
        <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-border text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <div className="col-span-2 flex items-center gap-1 cursor-pointer" onClick={() => setSortBy("symbol")}>Symbol <ArrowUpDown className="h-3 w-3" /></div>
          <div className="col-span-2">Trigger</div>
          <div className="col-span-1 flex items-center gap-1 cursor-pointer" onClick={() => setSortBy("signal_score")}>Score <ArrowUpDown className="h-3 w-3" /></div>
          <div className="col-span-2">Predicted Move</div>
          <div className="col-span-1 flex items-center gap-1 cursor-pointer" onClick={() => setSortBy("confidence")}>Conf <ArrowUpDown className="h-3 w-3" /></div>
          <div className="col-span-2">Last News</div>
          <div className="col-span-2">1W Chart</div>
        </div>
        <motion.div variants={staggerContainer} initial="initial" animate="animate">
          {sorted.map((signal) => (
            <motion.div
              key={signal.symbol}
              variants={staggerItem}
              onClick={() => navigate(`/stock/${signal.symbol}`)}
              className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border last:border-0 cursor-pointer hover:bg-muted/30 transition-colors items-center"
            >
              <div className="col-span-2">
                <span className="font-mono text-sm font-bold text-foreground">{signal.symbol}</span>
                <div className="text-[10px] text-muted-foreground">{signal.company}</div>
              </div>
              <div className="col-span-2 text-xs text-muted-foreground truncate">{signal.trigger}</div>
              <div className={`col-span-1 font-mono text-sm font-bold ${scoreColor(signal.signal_score)}`}>
                {signal.signal_score.toFixed(1)}
              </div>
              <div className="col-span-2 font-mono text-xs text-success">
                +{signal.predicted_move_min}% to +{signal.predicted_move_max}%
              </div>
              <div className="col-span-1 font-mono text-xs text-muted-foreground">
                {Math.round(signal.confidence * 100)}%
              </div>
              <div className="col-span-2 text-[10px] text-muted-foreground truncate">{signal.last_news}</div>
              <div className="col-span-2">
                <SparklineChart data={signal.sparkline} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Mobile card list */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-2 md:hidden">
        {sorted.map((signal) => (
          <motion.div
            key={signal.symbol}
            variants={staggerItem}
            onClick={() => navigate(`/stock/${signal.symbol}`)}
            className="rounded-md border border-border bg-card p-3 cursor-pointer active:bg-muted/30 transition-colors space-y-2"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-sm font-bold text-foreground">{signal.symbol}</span>
                <div className="text-[10px] text-muted-foreground">{signal.company}</div>
              </div>
              <div className={`font-mono text-lg font-bold ${scoreColor(signal.signal_score)}`}>
                {signal.signal_score.toFixed(1)}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">{signal.trigger}</div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-success">
                +{signal.predicted_move_min}% to +{signal.predicted_move_max}%
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {Math.round(signal.confidence * 100)}% conf
              </span>
            </div>
            <div className="h-8">
              <SparklineChart data={signal.sparkline} />
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
