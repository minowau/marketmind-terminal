import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { pageTransition, staggerContainer, staggerItem } from "@/lib/motionVariants";
import { mockAgentActions } from "@/lib/mockData";
import type { AgentAction } from "@/lib/types";
import { Play, Pause, Gauge } from "lucide-react";

const agentTypeColors: Record<string, string> = {
  FOMO: "border-warning/50 bg-warning/10",
  VALUE: "border-success/50 bg-success/10",
  MOMENTUM: "border-primary/50 bg-primary/10",
  CONTRARIAN: "border-destructive/50 bg-destructive/10",
  INSTITUTIONAL: "border-border bg-muted",
};

const agentTypeText: Record<string, string> = {
  FOMO: "text-warning",
  VALUE: "text-success",
  MOMENTUM: "text-primary",
  CONTRARIAN: "text-destructive",
  INSTITUTIONAL: "text-foreground",
};

export default function SimulationPage() {
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [actions, setActions] = useState<(AgentAction & { _key: number })[]>([]);
  const [counter, setCounter] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const pressure = actions.reduce<Record<string, { buy: number; sell: number }>>((acc, a) => {
    if (!acc[a.symbol]) acc[a.symbol] = { buy: 0, sell: 0 };
    if (a.action === "BUY") acc[a.symbol].buy += a.size;
    else acc[a.symbol].sell += a.size;
    return acc;
  }, {});

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setCounter((prev) => {
        const idx = prev % mockAgentActions.length;
        const action = { ...mockAgentActions[idx], _key: Date.now() + Math.random() };
        setActions((a) => [action, ...a].slice(0, 30));
        return prev + 1;
      });
    }, 1500 / speed);
    return () => clearInterval(interval);
  }, [playing, speed]);

  const filteredActions = typeFilter === "all" ? actions : actions.filter((a) => a.agent_type === typeFilter);
  const agentTypes = ["all", "FOMO", "VALUE", "MOMENTUM", "CONTRARIAN", "INSTITUTIONAL"];

  return (
    <motion.div {...pageTransition} className="p-3 md:p-4 space-y-3 md:space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-lg font-bold text-foreground">Investor Simulation</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Agent type filter — scrollable on mobile */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {agentTypes.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors whitespace-nowrap ${
                  typeFilter === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {t === "all" ? "ALL" : t}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-border hidden sm:block" />

          {/* Playback controls */}
          <div className="flex items-center gap-1">
            <button onClick={() => setPlaying(!playing)} className="p-1.5 rounded bg-muted hover:bg-accent transition-colors">
              {playing ? <Pause className="h-3.5 w-3.5 text-foreground" /> : <Play className="h-3.5 w-3.5 text-foreground" />}
            </button>
            <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  speed === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">
        {/* Pressure heatmap */}
        <div className="lg:col-span-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 md:mb-3">
            Buy/Sell Pressure
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(pressure).map(([symbol, p]) => {
              const total = p.buy + p.sell;
              const buyPct = total > 0 ? (p.buy / total) * 100 : 50;
              return (
                <motion.div key={symbol} layout className="rounded border border-border bg-card p-2.5 md:p-3 space-y-2">
                  <div className="font-mono text-sm font-bold text-foreground">{symbol}</div>
                  <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div animate={{ width: `${buyPct}%` }} transition={{ duration: 0.3 }} className="absolute left-0 top-0 h-full bg-success rounded-full" />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-success">BUY ₹{(p.buy / 1000).toFixed(0)}K</span>
                    <span className="text-destructive">SELL ₹{(p.sell / 1000).toFixed(0)}K</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Agent action feed */}
        <div className="lg:col-span-7">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 md:mb-3">
            Live Agent Actions ({filteredActions.length})
          </h3>
          <div className="space-y-1 max-h-[400px] md:max-h-[500px] overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {filteredActions.map((action) => (
                <motion.div
                  key={action._key}
                  initial={{ opacity: 0, x: 30, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25 }}
                  className={`flex items-center gap-2 md:gap-3 rounded border p-2 md:p-2.5 ${agentTypeColors[action.agent_type]}`}
                >
                  <div className={`font-mono text-[10px] font-bold w-16 md:w-24 shrink-0 ${agentTypeText[action.agent_type]}`}>
                    {action.agent_type}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground hidden sm:block">{action.agent_id}</div>
                  <div className={`font-mono text-xs font-bold ${action.action === "BUY" ? "text-success" : "text-destructive"}`}>
                    {action.action}
                  </div>
                  <div className="font-mono text-xs md:text-sm font-semibold text-foreground truncate">{action.symbol}</div>
                  <div className="ml-auto font-mono text-[10px] md:text-xs text-muted-foreground shrink-0">₹{(action.size / 1000).toFixed(0)}K</div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
