import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { staggerContainer, pageTransition } from "@/lib/motionVariants";
import { fetchNews, fetchSignals, fetchWishlist, fetchOpportunities } from "@/lib/api";
import OpportunityCard from "@/components/OpportunityCard";
import LiveNewsTicker from "@/components/LiveNewsTicker";
import MarketMiniMap from "@/components/MarketMiniMap";
import AgentSimulationPreview from "@/components/AgentSimulationPreview";
import SparklineChart from "@/components/SparklineChart";
import { scoreColor } from "@/lib/format";
import { Loader2, Star } from "lucide-react";

const topSparklines = [
  { symbol: "NIFTY 50", data: [100, 101, 102, 101, 103, 104, 103, 105, 106, 107], change: "+1.2%" },
  { symbol: "SENSEX", data: [200, 201, 203, 202, 205, 204, 206, 208, 207, 210], change: "+0.9%" },
  { symbol: "BANK NIFTY", data: [150, 149, 151, 152, 150, 153, 155, 154, 156, 158], change: "+1.5%" },
];

import { useNavigate } from "react-router-dom";

import LanguageGuide from "@/components/LanguageGuide";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: news = [] } = useQuery({
    queryKey: ['news', 'all'],
    queryFn: () => fetchNews(10, 'all'),
    staleTime: 1000 * 60 * 5,
  });

  const { data: opportunities = [], isLoading: isLoadingSignals } = useQuery({
    queryKey: ['opportunities'],
    queryFn: fetchOpportunities,
    staleTime: 1000 * 60 * 2,
  });

  const { data: wishlist = [], isLoading: isLoadingWishlist } = useQuery({
    queryKey: ['wishlist'],
    queryFn: fetchWishlist,
    staleTime: 1000 * 60 * 2,
  });

  return (
    <motion.div {...pageTransition} className="space-y-0">
      <LiveNewsTicker news={news} />

      <div className="p-3 md:p-4 space-y-3 md:space-y-4">
        {/* Market indices row */}
        <div id="market-indices" className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
          {topSparklines.map((idx) => (
            <div key={idx.symbol} className="rounded-md border border-border bg-card p-2.5 md:p-3 flex items-center gap-3">
              <div className="shrink-0">
                <div className="text-xs font-mono font-semibold text-foreground">{idx.symbol}</div>
                <div className="text-xs font-mono text-success">{idx.change}</div>
              </div>
              <div className="flex-1 min-w-0">
                <SparklineChart data={idx.data} />
              </div>
            </div>
          ))}
        </div>

        {/* Main grid — stacks on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">
          {/* Opportunity Radar */}
          <div id="opportunity-radar" className="lg:col-span-7">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80 mb-3 flex justify-between items-center">
              <span className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Opportunity Radar
              </span>
              <div className="flex items-center gap-4">
                <LanguageGuide />
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-[8px] text-muted-foreground uppercase tracking-widest leading-none">Last Updated</span>
                  <span className="text-[9px] font-mono text-foreground font-bold leading-none mt-0.5">
                    {new Date().toLocaleTimeString('en-IN', { hour12: false })}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-2 py-0.5 rounded-full bg-primary/5 border border-primary/20 shadow-[0_0_10px_-2px_rgba(var(--primary),0.1)]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                  </span>
                  <span className="text-[9px] text-primary font-black uppercase tracking-widest">
                    Live Scanning
                  </span>
                </div>
                {isLoadingSignals && <Loader2 className="h-3 w-3 animate-spin"/>}
              </div>
            </h2>
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3"
            >
              {opportunities.slice(0, 6).map((opp, i) => (
                <OpportunityCard key={opp.symbol} opportunity={opp} index={i} />
              ))}
              {!isLoadingSignals && opportunities.length === 0 && (
                <div className="col-span-1 border border-border bg-muted/20 rounded p-4 text-center text-sm text-muted-foreground sm:col-span-2">
                  No signals generated yet. Run a simulation to start populating data.
                </div>
              )}
            </motion.div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-5 space-y-3 md:space-y-4">
            {/* Wishlist Section */}
            <div id="wishlist-section" className="rounded-md border border-border bg-card p-3 md:p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5" /> Your Wishlist</span>
                <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">{wishlist.length}</span>
              </h2>
              {isLoadingWishlist ? (
                <div className="py-4 text-center"><Loader2 className="h-4 w-4 animate-spin inline text-muted-foreground"/></div>
              ) : wishlist.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                  {wishlist.map((item: any) => (
                    <div 
                      key={item.symbol} 
                      onClick={() => navigate(`/stock/${item.symbol}`)}
                      className="group p-2.5 rounded border border-border/50 bg-muted/20 hover:bg-muted/40 cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="text-sm font-mono font-bold text-foreground group-hover:text-primary transition-colors">{item.symbol}</div>
                          <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">{item.stock?.company_name}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-mono font-bold text-foreground">₹{item.stock?.last_price?.toFixed(2) || "---"}</div>
                          <div className={`text-[10px] font-mono ${item.stock?.day_change_pct >= 0 ? "text-success" : "text-destructive"}`}>
                            {item.stock?.day_change_pct >= 0 ? "+" : ""}{item.stock?.day_change_pct?.toFixed(2) || "0.00"}%
                          </div>
                        </div>
                      </div>
                      
                      {/* Enrichment Info */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/30">
                        <div>
                          <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Predicted Move</div>
                          <div className="text-[10px] font-mono font-bold text-success">
                            {item.prediction ? `+${item.prediction.min_pct}% to +${item.prediction.max_pct}%` : "Calculating..."}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Latest Signal</div>
                          <div className="flex gap-1 overflow-hidden">
                            {item.latest_signals?.length > 0 ? (
                              item.latest_signals.slice(0, 1).map((sig: any) => (
                                <div key={sig.id} className={`text-[10px] font-mono font-bold ${scoreColor(sig.signal_score)}`}>
                                  {sig.signal_score > 0 ? "+" : ""}{sig.signal_score.toFixed(1)}
                                </div>
                              ))
                            ) : (
                              <div className="text-[10px] font-mono text-muted-foreground italic">None</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center border border-dashed border-border rounded-md">
                  <p className="text-xs text-muted-foreground italic">Your wishlist is empty.</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Star a stock to track it here.</p>
                </div>
              )}
            </div>

            <MarketMiniMap />
            <AgentSimulationPreview />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
