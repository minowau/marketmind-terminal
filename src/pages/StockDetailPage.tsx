import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { pageTransition, staggerContainer } from "@/lib/motionVariants";
import { fetchStockOverview, fetchWishlist, addToWishlist, removeFromWishlist } from "@/lib/api";
import { generateStockHistory } from "@/lib/mockData";
import { scoreColor } from "@/lib/format";
import MarketChart from "@/components/MarketChart";
import NewsCard from "@/components/NewsCard";
import { ArrowLeft, Star, BarChart3, Activity, Loader2, Target } from "lucide-react";
import { useMemo } from "react";

export default function StockDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();

  const { data: stock, isLoading, error } = useQuery({
    queryKey: ['stock', symbol],
    queryFn: () => fetchStockOverview(symbol!),
    enabled: !!symbol
  });

  const history = useMemo(() => {
    return stock ? generateStockHistory(stock.last_price || 100, 90) : [];
  }, [stock]);

  const { data: wishlist, refetch: refetchWishlist } = useQuery<any[]>({
    queryKey: ['wishlist'],
    queryFn: fetchWishlist
  });

  const isFavorited = useMemo(() => {
    return wishlist?.some((item: any) => item.symbol === symbol);
  }, [wishlist, symbol]);

  const toggleWishlist = async () => {
    try {
      if (isFavorited) {
        await removeFromWishlist(symbol!);
      } else {
        await addToWishlist(symbol!);
      }
      refetchWishlist();
    } catch (err) {
      console.error("Wishlist toggle failed", err);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground"><Loader2 className="animate-spin inline mr-2"/> Loading stock details...</div>;
  if (error || !stock) return <div className="p-8 text-center text-destructive">Failed to load stock data for {symbol}</div>;

  const currentPrice = stock.last_price || 0;
  const dayChange = stock.day_change_pct || 0;
  const isUp = dayChange >= 0;
  const opp = stock.latest_signals?.[0];

  return (
    <motion.div {...pageTransition} className="p-3 md:p-4 space-y-3 md:space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 md:gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded bg-muted hover:bg-accent transition-colors shrink-0">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg md:text-xl font-bold font-mono text-foreground">{stock.symbol}</h1>
            <span className="text-xs md:text-sm text-muted-foreground truncate">{stock.company_name}</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 md:gap-4 shrink-0">
          <div className="text-right">
            <div className="font-mono text-base md:text-xl font-bold text-foreground">₹{currentPrice.toFixed(2)}</div>
            <div className={`font-mono text-[10px] md:text-xs ${isUp ? "text-success" : "text-destructive"}`}>
              {isUp ? "+" : ""}{dayChange.toFixed(2)}%
            </div>
          </div>
          <button 
            onClick={toggleWishlist}
            className={`p-1.5 md:p-2 rounded border transition-colors ${
              isFavorited ? "border-primary/60 bg-primary/10" : "border-border hover:border-primary/40"
            }`}
          >
            <Star className={`h-3.5 md:h-4 w-3.5 md:w-4 ${isFavorited ? "text-primary fill-primary" : "text-muted-foreground"}`} />
          </button>
        </div>
      </div>

      {/* AI Predictions Section - Prominently Displayed */}
      {(stock.prediction || opp) && (
        <div className="rounded-md border border-primary/50 bg-primary/5 p-3 md:p-4 mb-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"/>
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-2">
            <Target className="h-4 w-4" /> AI Prediction & Analysis
          </h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 mt-3">
            {opp && (
              <div className="rounded-md border border-border bg-card/50 p-2.5">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Signal Score</div>
                <div className={`font-mono text-xl md:text-2xl font-bold ${scoreColor(opp.signal_score)}`}>
                  {opp.signal_score.toFixed(1)}
                </div>
              </div>
            )}
            
            {(stock.prediction || opp) && (
              <div className="rounded-md border border-border bg-card/50 p-2.5">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Predicted Move</div>
                <div className="font-mono text-sm md:text-lg font-bold text-success">
                  {stock.prediction ? `+${stock.prediction.min_pct}% to +${stock.prediction.max_pct}%` : "Pending Data"}
                </div>
              </div>
            )}

            {(stock.prediction || opp) && (
              <div className="rounded-md border border-border bg-card/50 p-2.5">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Confidence</div>
                <div className="font-mono text-sm md:text-lg font-bold text-foreground">
                  {Math.round((stock.prediction?.confidence || opp?.confidence || 0) * 100)}%
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(stock.prediction?.confidence || opp?.confidence || 0) * 100}%` }} />
                </div>
              </div>
            )}
            
            {opp?.trigger && (
              <div className="rounded-md border border-border bg-card/50 p-2.5">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Latest Trigger</div>
                <div className="text-xs text-foreground line-clamp-2">{opp.trigger}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="rounded-md border border-border bg-card p-3 md:p-4">
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> Price Chart (3M)
          </h3>
          <div className="flex items-center gap-1">
            {["1W", "1M", "3M", "1Y"].map((r) => (
              <button
                key={r}
                className={`px-1.5 md:px-2 py-0.5 rounded text-[10px] font-mono ${
                  r === "3M" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <MarketChart data={history} height={250} />
      </div>

      {/* Related news */}
      {stock.latest_news?.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 md:mb-3 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" /> Related News ({stock.latest_news.length})
          </h3>
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-2 md:gap-3">
            {stock.latest_news.map((news: any) => (
              <NewsCard key={news.id} news={{
                id: news.id.toString(),
                title: news.title,
                summary: news.summary || "",
                entities: news.analysis?.entities || [],
                sentiment: news.analysis?.sentiment || "neutral",
                impact_score: news.analysis?.impact_score || 0.5,
                agent_explanation: news.analysis?.analysis_text || "",
                timestamp: news.published_at || news.created_at,
                url: news.url,
                source: news.source
              }} />
            ))}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
