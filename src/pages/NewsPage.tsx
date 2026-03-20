import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { pageTransition, staggerContainer } from "@/lib/motionVariants";
import { fetchNews } from "@/lib/api";
import NewsCard from "@/components/NewsCard";

import { Brain, Filter, Newspaper, Search, Zap } from "lucide-react";

const sentimentFilters = ["all", "positive", "negative", "neutral"] as const;

export default function NewsPage() {
  const [filter, setFilter] = useState<string>("all");

  const { data: news = [], isLoading, error } = useQuery({
    queryKey: ['news', filter],
    queryFn: () => fetchNews(60, filter),
    staleTime: 1000 * 60 * 5,
  });

  return (
    <motion.div {...pageTransition} className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-3">
            MARKET INTELLIGENCE <span className="text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.3)]">CENTER</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground/30 antialiased">
            NEURAL SENTIMENT & GLOBAL IMPACT PROTOCOL
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-black/40 p-1 rounded-lg border border-white/5">
          {sentimentFilters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                filter === f
                  ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.3)] scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-[.2em] text-muted-foreground animate-pulse">Syncing Intel...</span>
        </div>
      ) : error ? (
        <div className="py-20 text-center space-y-2">
          <Zap className="h-8 w-8 text-destructive mx-auto opacity-20" />
          <p className="text-sm font-bold text-destructive/60 italic uppercase tracking-widest">Protocol Sync Failed</p>
        </div>
      ) : news.length === 0 ? (
        <div className="py-20 text-center space-y-2">
          <Newspaper className="h-8 w-8 text-muted-foreground/20 mx-auto" />
          <p className="text-sm font-black text-muted-foreground/40 uppercase tracking-widest">No Intelligence Profiles Found</p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          {news.map((n) => (
            <NewsCard key={n.id} news={n} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
