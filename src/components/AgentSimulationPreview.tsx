import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import type { AgentAction } from "@/lib/types";
import { mockAgentActions } from "@/lib/mockData";

const agentColors: Record<string, string> = {
  FOMO: "bg-warning/20 text-warning border-warning/30",
  VALUE: "bg-success/20 text-success border-success/30",
  MOMENTUM: "bg-primary/20 text-primary border-primary/30",
  CONTRARIAN: "bg-destructive/20 text-destructive border-destructive/30",
  INSTITUTIONAL: "bg-accent text-foreground border-border",
};

export default function AgentSimulationPreview() {
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => {
        const next = prev % mockAgentActions.length;
        setActions((a) => [mockAgentActions[next], ...a].slice(0, 6));
        return prev + 1;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Agent Activity
      </h3>
      <div className="space-y-1.5 min-h-[140px]">
        <AnimatePresence mode="popLayout">
          {actions.map((action, i) => (
            <motion.div
              key={`${action.agent_id}-${i}`}
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className={`flex items-center gap-2 rounded border px-2.5 py-1.5 text-xs ${agentColors[action.agent_type]}`}
            >
              <span className="font-mono font-bold text-[10px]">{action.agent_type}</span>
              <span className="text-muted-foreground">→</span>
              <span className={`font-mono font-semibold ${action.action === "BUY" ? "text-success" : "text-destructive"}`}>
                {action.action}
              </span>
              <span className="font-mono">{action.symbol}</span>
              <span className="ml-auto text-muted-foreground font-mono text-[10px]">
                ₹{(action.size / 1000).toFixed(0)}K
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
