import { motion } from "framer-motion";
import type { NewsItem } from "@/lib/types";
import { sentimentColor, formatTimestamp } from "@/lib/format";

interface Props {
  news: NewsItem[];
}

export default function LiveNewsTicker({ news }: Props) {
  const doubled = [...news, ...news];

  return (
    <div className="relative overflow-hidden border-b border-border bg-card/50">
      <div className="flex items-center">
        <div className="shrink-0 border-r border-border bg-primary/10 px-3 py-2">
          <span className="text-[10px] font-bold tracking-widest text-primary uppercase">LIVE</span>
        </div>
        <div className="overflow-hidden flex-1">
          <div className="ticker-scroll flex items-center gap-8 whitespace-nowrap py-2 px-4">
            {doubled.map((item, i) => (
              <span key={`${item.id}-${i}`} className="inline-flex items-center gap-2 text-xs">
                <span className="font-mono font-semibold text-foreground">
                  {item.entities[0]?.symbol}
                </span>
                <span className="text-muted-foreground">{item.title}</span>
                <span className={`font-mono text-[10px] ${sentimentColor(item.sentiment)}`}>
                  {item.sentiment === "positive" ? "▲" : item.sentiment === "negative" ? "▼" : "●"}
                </span>
                <span className="text-muted-foreground/50">•</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
