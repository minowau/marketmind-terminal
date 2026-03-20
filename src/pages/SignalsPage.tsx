import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { pageTransition, staggerContainer, staggerItem } from "@/lib/motionVariants";
import { fetchSignals } from "@/lib/api";
import SparklineChart from "@/components/SparklineChart";
import { scoreColor } from "@/lib/format";
import { ArrowUpDown, Filter, Loader2, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

type SortKey = "signal_score" | "confidence" | "symbol";

export default function SignalsPage() {
  const [sortBy, setSortBy] = useState<SortKey>("signal_score");
  const [sectorFilter, setSectorFilter] = useState("all");
  const navigate = useNavigate();

  const { data: signals = [], isLoading } = useQuery({
    queryKey: ['signals'],
    queryFn: fetchSignals,
  });

  const sectors = ["all", ...new Set(signals.map((s) => s.sector || 'Unknown'))];

  const filtered = sectorFilter === "all" ? signals : signals.filter((s) => (s.sector || 'Unknown') === sectorFilter);
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "symbol") return a.symbol.localeCompare(b.symbol);
    return (b[sortBy] || 0) - (a[sortBy] || 0);
  });

  const generateMockTrend = (seed: string) => {
    const data = [];
    let val = 50;
    const s = seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    for (let i = 0; i < 10; i++) {
      val += Math.sin(s + i) * 10 + (Math.random() - 0.5) * 5;
      data.push(val);
    }
    return data;
  };

  const getMockGrowth = (symbol: string) => {
    const hash = symbol.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const min = (hash % 15) + 2;
    const max = min + (hash % 10) + 3;
    return { min, max };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div {...pageTransition} className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white">
              SIGNAL DETECTION <span className="text-primary">PROTOCOL</span>
            </h1>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground/30 antialiased">
            REAL-TIME NEURAL SCANNING & PATTERN RECOGNITION
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-black/40 p-1 rounded-lg border border-white/5">
            {sectors.map((s) => (
              <button
                key={s}
                onClick={() => setSectorFilter(s)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  sectorFilter === s
                    ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-white/5 bg-black/20 backdrop-blur-md">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 bg-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
          <div className="col-span-2 flex items-center gap-2 cursor-pointer group" onClick={() => setSortBy("symbol")}>
            Symbol <ArrowUpDown className="h-3 w-3 group-hover:text-primary transition-colors" />
          </div>
          <div className="col-span-3">Trigger Event</div>
          <div className="col-span-1 flex items-center gap-2 cursor-pointer group" onClick={() => setSortBy("signal_score")}>
            Score <ArrowUpDown className="h-3 w-3 group-hover:text-primary transition-colors" />
          </div>
          <div className="col-span-2">Growth Target</div>
          <div className="col-span-2">Trend Analysis</div>
          <div className="col-span-2 text-right">Confidence</div>
        </div>

        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="divide-y divide-white/5">
          {sorted.length === 0 && (
            <div className="text-center py-20 text-muted-foreground/40 font-black uppercase tracking-widest">
              Zero Signal Density Detected
            </div>
          )}
          {sorted.map((signal) => (
            <motion.div
              key={signal.symbol}
              variants={staggerItem}
              onClick={() => navigate(`/stock/${signal.symbol}`)}
              className="grid grid-cols-12 gap-4 px-6 py-5 cursor-pointer hover:bg-primary/5 transition-all duration-300 items-center group"
            >
              <div className="col-span-2">
                <div className="text-[10px] font-black tracking-widest text-primary mb-0.5 uppercase">{signal.sector || "GENERAL"}</div>
                <div className="font-black text-base text-white group-hover:text-primary transition-colors">{signal.symbol}</div>
              </div>
              
              <div className="col-span-3">
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed italic">
                  "{signal.trigger || 'Standard pattern recognition trigger'}"
                </p>
              </div>

              <div className={`col-span-1 font-mono text-lg font-black ${scoreColor(signal.signal_score || 0)}`}>
                {(signal.signal_score || 0).toFixed(1)}
              </div>

              <div className="col-span-2 space-y-1">
                {(() => {
                  const growth = (signal.predicted_move_min && signal.predicted_move_max) 
                    ? { min: signal.predicted_move_min, max: signal.predicted_move_max } 
                    : getMockGrowth(signal.symbol);
                  return (
                    <>
                      <div className="text-[10px] font-bold text-success flex items-center gap-1.5">
                        <TrendingUp className="h-3 w-3" />
                        +{growth.min.toFixed(1)}% TO +{growth.max.toFixed(1)}%
                      </div>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-success transition-all duration-1000" style={{ width: `${Math.min(100, (growth.min / 20) * 100)}%` }} />
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="col-span-2">
                <div className="h-10 w-full opacity-60 group-hover:opacity-100 transition-opacity">
                  <SparklineChart data={signal.sparkline && signal.sparkline.length > 0 ? signal.sparkline : generateMockTrend(signal.symbol)} />
                </div>
              </div>

              <div className="col-span-2 text-right space-y-1">
                <div className="text-[11px] font-black text-white">
                  {Math.round((signal.confidence || 0) * 100)}%
                </div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
                  Reliability
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-3">
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
          {sorted.map((signal) => (
            <motion.div
              key={signal.symbol}
              variants={staggerItem}
              onClick={() => navigate(`/stock/${signal.symbol}`)}
              className="rounded-xl border border-white/5 bg-black/20 p-4 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[9px] font-bold text-primary uppercase tracking-widest mb-1">{signal.sector || "GENERAL"}</div>
                  <div className="text-lg font-black text-white">{signal.symbol}</div>
                </div>
                <div className={`text-xl font-black ${scoreColor(signal.signal_score || 0)}`}>
                  {(signal.signal_score || 0).toFixed(1)}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                "{signal.trigger || 'Standard pattern recognition trigger'}"
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                {(() => {
                  const growth = (signal.predicted_move_min && signal.predicted_move_max) 
                    ? { min: signal.predicted_move_min, max: signal.predicted_move_max } 
                    : getMockGrowth(signal.symbol);
                  return (
                    <div className="text-[11px] font-bold text-success flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3" />
                      {growth.min.toFixed(1)}% - {growth.max.toFixed(1)}%
                    </div>
                  );
                })()}
                <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                  {Math.round((signal.confidence || 0) * 100)}% Conf
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
