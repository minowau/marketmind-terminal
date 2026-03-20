import { motion } from "framer-motion";
import type { NewsItem } from "@/lib/types";
import { sentimentColor, formatTimestamp } from "@/lib/format";
import { staggerItem, cardHover } from "@/lib/motionVariants";
import { ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  news: NewsItem;
}

const sentimentIcon = {
  positive: TrendingUp,
  negative: TrendingDown,
  neutral: Minus,
};

export default function NewsCard({ news }: Props) {
  const navigate = useNavigate();
  const Icon = sentimentIcon[news.sentiment];

  return (
    <motion.div
      variants={staggerItem}
      {...cardHover}
      className="group relative overflow-hidden rounded-xl border border-white/5 bg-black/20 hover:bg-black/40 hover:border-primary/20 transition-all duration-500 p-5"
    >
      {/* Sentiment Glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] opacity-10 pointer-events-none ${
        news.sentiment === "positive" ? "bg-success" : news.sentiment === "negative" ? "bg-destructive" : "bg-primary"
      }`} />

      <div className="flex flex-col h-full relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`px-2 py-0.5 rounded-sm text-[10px] font-black font-mono tracking-tighter border ${
              news.sentiment === "positive" 
                ? "bg-success/10 text-success border-success/20" 
                : news.sentiment === "negative" 
                ? "bg-destructive/10 text-destructive border-destructive/20" 
                : "bg-primary/10 text-primary border-primary/20"
            }`}>
              {news.entities[0]?.symbol || "MKT"}
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3" />
              {formatTimestamp(news.timestamp)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">
            {news.source}
          </div>
        </div>

        <h3 className="text-base font-bold text-foreground leading-tight mb-3 group-hover:text-primary transition-colors">
          {news.title}
        </h3>
        
        <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-3">
          {news.summary}
        </p>

        {/* Entities */}
        <div className="flex items-center gap-2 flex-wrap mb-5">
          {news.entities.map((entity) => (
            <button
              key={entity.symbol}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/stock/${entity.symbol}`);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/5 px-2.5 py-1 text-[9px] font-mono font-bold text-foreground hover:border-primary/40 hover:bg-primary/10 transition-all"
            >
              {entity.symbol}
              <ExternalLink className="h-2.5 w-2.5 text-muted-foreground/50" />
            </button>
          ))}
        </div>

        {/* AI Analysis Section */}
        <div className="mt-auto pt-4 border-t border-white/5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-primary/10 text-primary">
              <TrendingUp className="h-3 w-3" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">AI Reasoning</span>
          </div>
          
          <p className="text-[11px] text-foreground/80 leading-relaxed italic border-l-2 border-primary/20 pl-3">
            "{news.agent_explanation}"
          </p>

          <div className="flex items-center justify-between mt-2">
            <div className="space-y-1.5 flex-1 max-w-[120px]">
              <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                <span>Market Impact</span>
                <span>{Math.round(news.impact_score * 100)}%</span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${news.impact_score * 100}%` }}
                  className={`h-full ${news.sentiment === "positive" ? "bg-success" : news.sentiment === "negative" ? "bg-destructive" : "bg-primary"}`}
                />
              </div>
            </div>
            <div className={`text-[10px] font-black uppercase tracking-widest ${
              news.sentiment === "positive" ? "text-success" : news.sentiment === "negative" ? "text-destructive" : "text-primary"
            }`}>
              {news.sentiment}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
