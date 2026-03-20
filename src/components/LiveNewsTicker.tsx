import { motion } from "framer-motion";
import type { NewsItem } from "@/lib/types";
import { sentimentColor, formatTimestamp } from "@/lib/format";

interface Props {
  news: NewsItem[];
}

export default function LiveNewsTicker({ news }: Props) {
  const doubled = [...news, ...news];

  return (
    <div className="relative group overflow-hidden border-b border-white/5 bg-black/40 backdrop-blur-md">
      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      
      <div className="flex items-center relative z-10">
        <div className="shrink-0 flex items-center gap-2 border-r border-white/10 bg-black/60 px-4 py-2.5 shadow-[2px_0_10px_rgba(0,0,0,0.3)]">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </div>
          <span className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">Intelligence</span>
        </div>
        
        <div className="overflow-hidden flex-1 relative">
          {/* Edge Blur - Left */}
          <div className="absolute left-0 top-0 bottom-0 w-12 z-20 bg-gradient-to-r from-black/80 to-transparent pointer-events-none" />
          
          <div className="ticker-scroll flex items-center gap-12 whitespace-nowrap py-2.5">
            {doubled.map((item, i) => (
              <div key={`${item.id}-${i}`} className="inline-flex items-center gap-3">
                <div className={`px-1.5 py-0.5 rounded-[3px] text-[9px] font-black font-mono border ${
                  item.sentiment === "positive" 
                    ? "bg-success/10 text-success border-success/20" 
                    : item.sentiment === "negative" 
                    ? "bg-destructive/10 text-destructive border-destructive/20" 
                    : "bg-muted/10 text-muted-foreground border-border/20"
                }`}>
                  {item.entities[0]?.symbol || "MKT"}
                </div>
                <span className="text-[11px] font-medium tracking-tight text-foreground/90 hover:text-primary transition-colors cursor-default">
                  {item.title}
                </span>
                <span className={`flex items-center gap-1 font-mono text-[10px] font-bold ${sentimentColor(item.sentiment)}`}>
                  {item.sentiment === "positive" ? "▲" : item.sentiment === "negative" ? "▼" : "•"}
                  {item.impact_score > 0.8 && <span className="text-[8px] animate-pulse">HOT</span>}
                </span>
                <span className="text-white/10 mx-2 font-light">|</span>
              </div>
            ))}
          </div>

          {/* Edge Blur - Right */}
          <div className="absolute right-0 top-0 bottom-0 w-12 z-20 bg-gradient-to-l from-black/80 to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
