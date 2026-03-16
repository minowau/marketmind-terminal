import { motion } from "framer-motion";
import { staggerContainer, pageTransition } from "@/lib/motionVariants";
import { mockOpportunities, mockNews, generateStockHistory } from "@/lib/mockData";
import OpportunityCard from "@/components/OpportunityCard";
import LiveNewsTicker from "@/components/LiveNewsTicker";
import MarketMiniMap from "@/components/MarketMiniMap";
import AgentSimulationPreview from "@/components/AgentSimulationPreview";
import SparklineChart from "@/components/SparklineChart";

const topSparklines = [
  { symbol: "NIFTY 50", data: [100, 101, 102, 101, 103, 104, 103, 105, 106, 107], change: "+1.2%" },
  { symbol: "SENSEX", data: [200, 201, 203, 202, 205, 204, 206, 208, 207, 210], change: "+0.9%" },
  { symbol: "BANK NIFTY", data: [150, 149, 151, 152, 150, 153, 155, 154, 156, 158], change: "+1.5%" },
];

export default function Dashboard() {
  return (
    <motion.div {...pageTransition} className="space-y-0">
      {/* Live News Ticker */}
      <LiveNewsTicker news={mockNews} />

      <div className="p-4 space-y-4">
        {/* Market indices row */}
        <div className="grid grid-cols-3 gap-3">
          {topSparklines.map((idx) => (
            <div key={idx.symbol} className="rounded-md border border-border bg-card p-3 flex items-center gap-3">
              <div>
                <div className="text-xs font-mono font-semibold text-foreground">{idx.symbol}</div>
                <div className="text-xs font-mono text-success">{idx.change}</div>
              </div>
              <div className="flex-1">
                <SparklineChart data={idx.data} />
              </div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-12 gap-4">
          {/* Opportunity Radar */}
          <div className="col-span-7">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Opportunity Radar
            </h2>
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-2 gap-3"
            >
              {mockOpportunities.slice(0, 6).map((opp, i) => (
                <OpportunityCard key={opp.symbol} opportunity={opp} index={i} />
              ))}
            </motion.div>
          </div>

          {/* Right column */}
          <div className="col-span-5 space-y-4">
            <MarketMiniMap />
            <AgentSimulationPreview />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
