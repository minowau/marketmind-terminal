import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { pageTransition, staggerContainer, staggerItem } from "@/lib/motionVariants";
import { mockOpportunities, mockNews, generateStockHistory } from "@/lib/mockData";
import { scoreColor, formatTimestamp } from "@/lib/format";
import MarketChart from "@/components/MarketChart";
import NewsCard from "@/components/NewsCard";
import { ArrowLeft, TrendingUp, Star, BarChart3, Activity } from "lucide-react";
import { useMemo } from "react";

export default function StockDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();

  const opp = mockOpportunities.find((o) => o.symbol === symbol);
  const relatedNews = mockNews.filter((n) => n.entities.some((e) => e.symbol === symbol));
  const history = useMemo(() => generateStockHistory(1500, 90), [symbol]);
  const currentPrice = history[history.length - 1]?.close ?? 0;
  const prevPrice = history[history.length - 2]?.close ?? currentPrice;
  const dayChange = ((currentPrice - prevPrice) / prevPrice * 100).toFixed(2);
  const isUp = currentPrice >= prevPrice;

  return (
    <motion.div {...pageTransition} className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded bg-muted hover:bg-accent transition-colors">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-mono text-foreground">{symbol}</h1>
            {opp && <span className="text-sm text-muted-foreground">{opp.company}</span>}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="text-right">
            <div className="font-mono text-xl font-bold text-foreground">₹{currentPrice.toFixed(2)}</div>
            <div className={`font-mono text-xs ${isUp ? "text-success" : "text-destructive"}`}>
              {isUp ? "+" : ""}{dayChange}%
            </div>
          </div>
          <button className="p-2 rounded border border-border hover:border-primary/40 transition-colors">
            <Star className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Signal score row */}
      {opp && (
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-md border border-border bg-card p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Signal Score</div>
            <div className={`font-mono text-2xl font-bold ${scoreColor(opp.signal_score)}`}>
              {opp.signal_score.toFixed(1)}
            </div>
          </div>
          <div className="rounded-md border border-border bg-card p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Predicted Move</div>
            <div className="font-mono text-lg font-bold text-success">
              +{opp.predicted_move_min}% to +{opp.predicted_move_max}%
            </div>
          </div>
          <div className="rounded-md border border-border bg-card p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Confidence</div>
            <div className="font-mono text-lg font-bold text-foreground">
              {Math.round(opp.confidence * 100)}%
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${opp.confidence * 100}%` }} />
            </div>
          </div>
          <div className="rounded-md border border-border bg-card p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Trigger</div>
            <div className="text-sm text-foreground">{opp.trigger}</div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="rounded-md border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> Price Chart (3M)
          </h3>
          <div className="flex items-center gap-1">
            {["1W", "1M", "3M", "1Y"].map((r) => (
              <button
                key={r}
                className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                  r === "3M" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <MarketChart data={history} height={350} />
      </div>

      {/* Related news */}
      {relatedNews.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" /> Related News ({relatedNews.length})
          </h3>
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-3">
            {relatedNews.map((news) => (
              <NewsCard key={news.id} news={news} />
            ))}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
