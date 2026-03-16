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

  return (
    <motion.div
      variants={staggerItem}
      {...cardHover}
      onClick={() => navigate(`/stock/${opportunity.symbol}`)}
      className="group relative cursor-pointer rounded-md border border-border bg-card p-4 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-foreground">
              {opportunity.symbol}
            </span>
            <span className="text-xs text-muted-foreground">{opportunity.company}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{opportunity.trigger}</p>
        </div>
        <div className="text-right space-y-1">
          <div className={`font-mono text-lg font-bold ${scoreColor(opportunity.signal_score)}`}>
            {opportunity.signal_score.toFixed(1)}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {Math.round(opportunity.confidence * 100)}% conf
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs">
          <TrendingUp className="h-3 w-3 text-success" />
          <span className="font-mono text-success">
            +{opportunity.predicted_move_min}% to +{opportunity.predicted_move_max}%
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1 rounded hover:bg-muted">
            <Star className="h-3 w-3 text-muted-foreground" />
          </button>
          <button className="p-1 rounded hover:bg-muted">
            <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
