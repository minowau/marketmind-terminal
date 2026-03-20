import { motion } from "framer-motion";
import { TrendingUp, ArrowUpRight, Star } from "lucide-react";
import type { Opportunity } from "@/lib/types";
import { scoreColor } from "@/lib/format";
import { cardHover, staggerItem } from "@/lib/motionVariants";
import { useNavigate } from "react-router-dom";

interface Props {
  opportunity: Opportunity;
  index: number;
}

export default function OpportunityCard({ opportunity, index }: Props) {
  const navigate = useNavigate();
  const isHighConviction = Math.abs(opportunity.signal_score) > 7;
  const isShort = opportunity.signal_score < 0;

  return (
    <motion.div
      variants={staggerItem}
      {...cardHover}
      onClick={() => navigate(`/stock/${opportunity.symbol}`)}
      className={`group relative cursor-pointer rounded-xl border-2 p-5 transition-all duration-500 backdrop-blur-sm ${
        isShort 
          ? "border-destructive/20 bg-destructive/5 shadow-[0_0_20px_-5px_hsl(var(--destructive)/0.1)] hover:border-destructive/40 hover:bg-destructive/10"
          : "border-success/20 bg-success/5 shadow-[0_0_20px_-5px_hsl(var(--success)/0.1)] hover:border-success/40 hover:bg-success/10"
      }`}
    >
      {/* Header Info */}
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className={`font-mono text-base font-black tracking-tight ${isShort ? "text-destructive" : "text-success"}`}>
              {opportunity.symbol}
            </span>
            <div className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
              isShort ? "bg-destructive/20 text-destructive" : "bg-success/20 text-success"
            }`}>
              {isShort ? "SHORT" : "BUY"}
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider truncate max-w-[140px]">
            {opportunity.company}
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className={`font-mono text-2xl font-black leading-none tracking-tighter ${scoreColor(opportunity.signal_score)}`}>
            {opportunity.signal_score > 0 ? "+" : ""}{opportunity.signal_score.toFixed(1)}
          </div>
          <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <button className="p-1 rounded bg-muted/50 hover:bg-muted text-muted-foreground transition-colors">
               <Star className="h-2.5 w-2.5" />
             </button>
             <div className="p-1 rounded bg-primary/10 text-primary">
               <ArrowUpRight className="h-2.5 w-2.5" />
             </div>
          </div>
        </div>
      </div>

      {/* Trigger Quote */}
      <div className="relative py-3 px-4 rounded-lg bg-background/40 border border-border/20 mb-5">
        <div className={`absolute top-0 left-0 h-full w-1 rounded-l-lg ${isShort ? "bg-destructive/40" : "bg-success/40"}`} />
        <p className="text-[11px] text-foreground leading-relaxed font-medium italic line-clamp-2">
          "{opportunity.trigger}"
        </p>
      </div>

      {/* Bottom Metrics */}
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
            Est. Price Move
          </div>
          <div className={`flex items-center gap-2 font-mono text-xs font-bold ${isShort ? "text-destructive" : "text-success"}`}>
            <TrendingUp className="h-3.5 w-3.5" />
            <span>
              {opportunity.predicted_move 
                ? `${opportunity.predicted_move.min_pct >= 0 ? "+" : ""}${opportunity.predicted_move.min_pct.toFixed(1)}% to ${opportunity.predicted_move.max_pct >= 0 ? "+" : ""}${opportunity.predicted_move.max_pct.toFixed(1)}%`
                : "0.0% to 0.0%"
              }
            </span>
          </div>
        </div>
        
        <div className="w-24 space-y-1.5">
          <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">
            <span>Confidence</span>
            <span>{Math.round(opportunity.confidence * 100)}%</span>
          </div>
          <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${opportunity.confidence * 100}%` }}
              className={`h-full ${isShort ? "bg-destructive" : "bg-success"}`}
            />
          </div>
        </div>
      </div>

      {/* Connection Glow */}
      <div className={`absolute -bottom-px left-10 right-10 h-[2px] blur-sm transition-opacity duration-500 opacity-0 group-hover:opacity-100 ${
        isShort ? "bg-destructive" : "bg-success"
      }`} style={{ boxShadow: `0 0 10px ${isShort ? 'var(--destructive)' : 'var(--success)'}` }} />
    </motion.div>
  );
}
