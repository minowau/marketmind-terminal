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
      className="rounded-md border border-border bg-card p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 flex-1">
          <h3 className="text-sm font-semibold text-foreground leading-snug">{news.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{news.summary}</p>
        </div>
        <div className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded text-xs font-mono ${sentimentColor(news.sentiment)} bg-muted`}>
          <Icon className="h-3 w-3" />
          <span>{Math.round(news.impact_score * 100)}</span>
        </div>
      </div>

      {/* Entities */}
      <div className="flex items-center gap-2 flex-wrap">
        {news.entities.map((entity) => (
          <button
            key={entity.symbol}
            onClick={() => navigate(`/stock/${entity.symbol}`)}
            className="inline-flex items-center gap-1 rounded border border-border bg-muted px-2 py-0.5 text-[10px] font-mono font-semibold text-foreground hover:border-primary/40 transition-colors"
          >
            {entity.symbol}
            <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
          </button>
        ))}
      </div>

      {/* Agent explanation */}
      <div className="rounded bg-muted/50 border border-border p-2.5">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">AI Analysis</div>
        <p className="text-xs text-muted-foreground leading-relaxed">{news.agent_explanation}</p>
      </div>

      <div className="text-[10px] text-muted-foreground font-mono">{formatTimestamp(news.timestamp)}</div>
    </motion.div>
  );
}
