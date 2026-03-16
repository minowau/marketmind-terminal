import { motion } from "framer-motion";
import { useState } from "react";
import { pageTransition, staggerContainer } from "@/lib/motionVariants";
import { mockNews } from "@/lib/mockData";
import NewsCard from "@/components/NewsCard";

const sentimentFilters = ["all", "positive", "negative", "neutral"] as const;

export default function NewsPage() {
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? mockNews : mockNews.filter((n) => n.sentiment === filter);

  return (
    <motion.div {...pageTransition} className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">News Intelligence</h1>
        <div className="flex items-center gap-1">
          {sentimentFilters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid gap-3"
      >
        {filtered.map((news) => (
          <NewsCard key={news.id} news={news} />
        ))}
      </motion.div>
    </motion.div>
  );
}
