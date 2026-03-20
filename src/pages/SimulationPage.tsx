import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { pageTransition } from "@/lib/motionVariants";
import type { AgentAction } from "@/lib/types";
import { Play, Pause, AlertCircle, Target, CheckCircle2, Loader2, RefreshCw, TrendingUp, ArrowUpRight, ArrowDownRight, Zap } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
const WS_URL = API_BASE_URL.replace("http", "ws").replace("/api/v1", "/ws/simulation");

const agentTypeColors: Record<string, string> = {
  FOMO: "border-warning/50 bg-warning/10",
  VALUE: "border-success/50 bg-success/10",
  MOMENTUM: "border-primary/50 bg-primary/10",
  CONTRARIAN: "border-destructive/50 bg-destructive/10",
  INSTITUTIONAL: "border-border bg-muted",
  DAY_TRADER: "border-info/50 bg-info/10",
};

const agentTypeText: Record<string, string> = {
  FOMO: "text-warning",
  VALUE: "text-success",
  MOMENTUM: "text-primary",
  CONTRARIAN: "text-destructive",
  INSTITUTIONAL: "text-foreground",
  DAY_TRADER: "text-info",
};

export default function SimulationPage() {
  const [playing, setPlaying] = useState(true);
  
  // Persistence: Initialize from localStorage
  const [actions, setActions] = useState<(AgentAction & { _key: number })[]>(() => {
    const saved = localStorage.getItem("sim_actions");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [predictionRationale, setPredictionRationale] = useState<string | null>(() => {
    return localStorage.getItem("sim_rationale");
  });

  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const wsRef = useRef<WebSocket | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("sim_actions", JSON.stringify(actions));
  }, [actions]);

  useEffect(() => {
    if (predictionRationale) {
      localStorage.setItem("sim_rationale", predictionRationale);
    } else {
      localStorage.removeItem("sim_rationale");
    }
  }, [predictionRationale]);

  const handleReload = () => {
    setActions([]);
    setPredictionRationale(null);
    localStorage.removeItem("sim_actions");
    localStorage.removeItem("sim_rationale");
    // Optionally trigger a new simulation or just wait for next event
  };

  const pressure = actions.reduce<Record<string, { buy: number; sell: number }>>((acc, a) => {
    if (!acc[a.symbol]) acc[a.symbol] = { buy: 0, sell: 0 };
    if (a.action === "BUY") acc[a.symbol].buy += a.size;
    else acc[a.symbol].sell += a.size;
    return acc;
  }, {});

  useEffect(() => {
    let ws: WebSocket;

    const connectWs = () => {
      ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus("connected");
        ws.send(JSON.stringify({ action: "subscribe", channel: "global:simulation" }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "agent_action") {
             setActions((prev) => {
               // Hard limit: Stop recording actions after exactly 30 actions.
               if (prev.length >= 30) return prev;
               
               const newAction = { ...data, _key: Date.now() + Math.random() };
               return [newAction, ...prev];
             });
          } else if (data.type === "prediction") {
             if (data.rationale) {
               setPredictionRationale(data.rationale);
             }
          }
        } catch (err) {
          console.error("WebSocket message parsing error:", err);
        }
      };

      ws.onclose = () => {
        setWsStatus("disconnected");
        // Reconnect after 3 seconds if disconnected
        setTimeout(connectWs, 3000);
      };
    };

    if (playing) {
       connectWs();
    } else if (wsRef.current) {
       wsRef.current.close();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null; // Disable reconnect on unmount
        wsRef.current.close();
      }
    };
  }, [playing]);

  const filteredActions = typeFilter === "all" ? actions : actions.filter((a) => a.agent_type === typeFilter);
  const agentTypes = ["all", "FOMO", "VALUE", "MOMENTUM", "CONTRARIAN", "INSTITUTIONAL", "DAY_TRADER"];
  
  const simulationFinished = actions.length >= 30;

  return (
    <motion.div {...pageTransition} className="p-3 md:p-4 space-y-3 md:space-y-4 max-w-[1400px] mx-auto">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <h1 className="text-xl font-black uppercase tracking-tight text-white">Agent <span className="text-primary">Simulation</span></h1>
             {wsStatus === "connected" ? (
               <span className="flex items-center gap-1.5 text-[9px] uppercase font-black text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-full">
                 <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> LIVE STREAM
               </span>
             ) : (
               <span className="flex items-center gap-1.5 text-[9px] uppercase font-black text-warning bg-warning/10 border border-warning/20 px-2 py-0.5 rounded-full">
                 <AlertCircle className="h-3.5 w-3.5" /> {wsStatus}
               </span>
             )}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/30 antialiased">
            MULTI-AGENT MARKET DYNAMICS SIMULATOR
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-white/5">
            {agentTypes.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-tighter transition-all ${
                  typeFilter === t ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(var(--primary),0.3)]" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          {/* Playback controls */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handleReload}
              className="p-2 rounded-md bg-white/5 hover:bg-white/10 border border-white/5 text-muted-foreground hover:text-primary transition-all group"
              title="Reload Protocol"
            >
              <RefreshCw className="h-3.5 w-3.5 group-hover:rotate-180 transition-transform duration-500" />
            </button>
            <button 
              onClick={() => setPlaying(!playing)} 
              className={`p-2 rounded-md border transition-all ${playing ? "bg-primary/10 border-primary/20 text-primary" : "bg-white/5 border-white/5 text-muted-foreground"}`}
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {simulationFinished && predictionRationale && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="rounded-xl border border-primary/30 bg-primary/5 p-6 relative overflow-hidden backdrop-blur-sm">
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none"/>
             <div className="relative z-10">
               <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-3 flex items-center gap-2">
                 <Target className="h-4 w-4" /> Final Intelligence Consensus
               </h2>
               <p className="text-base font-bold text-foreground leading-relaxed italic border-l-2 border-primary/40 pl-4 mb-4">
                 "{predictionRationale}"
               </p>
               <div className="flex items-center gap-2 text-[10px] text-primary font-black uppercase tracking-widest">
                  <CheckCircle2 className="h-4 w-4" /> Cycle Complete. Manual Reload required for next stream.
               </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {simulationFinished && !predictionRationale && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-warning/30 bg-warning/5 p-4 flex items-center gap-3 text-warning text-xs font-black uppercase tracking-widest">
           <Loader2 className="h-4 w-4 animate-spin" /> Synthesizing AI Matrix...
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pressure heatmap */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
              <TrendingUp className="h-3 w-3" /> Market Pressure
            </h3>
            <span className="text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
              {actions.length}/30 EVENTS
            </span>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {Object.keys(pressure).length === 0 && (
               <div className="text-center py-12 px-6 text-muted-foreground/30 border border-white/5 bg-white/5 rounded-xl border-dashed font-black uppercase tracking-widest text-[10px]">
                 Awaiting Stream Initialization...
               </div>
            )}
            <AnimatePresence mode="popLayout">
              {Object.entries(pressure).map(([symbol, p]) => {
                const total = p.buy + p.sell;
                const buyPct = total > 0 ? (p.buy / total) * 100 : 50;
                return (
                  <motion.div 
                    key={symbol} 
                    layout 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-xl border border-white/5 bg-black/40 p-4 space-y-3 backdrop-blur-sm group hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-black text-sm text-white tracking-widest">{symbol}</div>
                      <div className="text-[9px] font-black text-muted-foreground/40 uppercase">Liquidity: ₹{(total / 1000).toFixed(0)}K</div>
                    </div>
                    
                    <div className="relative h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${buyPct}%` }} 
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-success to-success/60 shadow-[0_0_10px_rgba(var(--success),0.3)]" 
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                      <span className="text-success flex items-center gap-1">
                        <ArrowUpRight className="h-3 w-3" /> {(buyPct).toFixed(0)}% BUY
                      </span>
                      <span className="text-destructive flex items-center gap-1">
                        {(100 - buyPct).toFixed(0)}% SELL <ArrowDownRight className="h-3 w-3" />
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Agent action feed */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
              <Zap className="h-3 w-3" /> Real-Time Intelligence Stream
            </h3>
            {filteredActions.length > 0 && (
              <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
                <span className="h-1 w-1 rounded-full bg-primary animate-pulse" /> Processing Protocol
              </div>
            )}
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {actions.length === 0 && (
                 <div className="text-center py-24 text-muted-foreground/30 border border-white/5 bg-white/5 rounded-2xl border-dashed font-black uppercase tracking-[0.2em]">
                   NO ACTIVE AGENT TELEMETRY
                 </div>
              )}
              {filteredActions.map((action) => (
                <motion.div
                  key={action._key}
                  initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`flex flex-col md:flex-row md:items-center gap-3 md:gap-4 rounded-xl border p-4 transition-all hover:bg-white/5 ${agentTypeColors[action.agent_type] || "border-white/5 bg-black/40"}`}
                >
                  <div className="flex items-center justify-between md:justify-start gap-4">
                    <div className={`font-black text-[10px] uppercase tracking-widest px-2 py-1 rounded border shrink-0 ${agentTypeText[action.agent_type] || "text-foreground"}`}>
                      {action.agent_type}
                    </div>
                    <div className={`font-black text-xs px-2 py-0.5 rounded-full ${action.action === "BUY" ? "bg-success/20 text-success border border-success/30" : "bg-destructive/20 text-destructive border border-destructive/30"}`}>
                      {action.action}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="font-black text-base text-white tracking-widest">{action.symbol}</div>
                    <div className="h-4 w-px bg-white/10" />
                    <div className="font-black text-xs text-foreground/80">₹{(action.size / 1000).toFixed(0)}K</div>
                  </div>

                  <div className="text-[11px] text-muted-foreground italic leading-relaxed md:ml-4 border-l border-white/10 pl-4 py-0.5 line-clamp-1 group-hover:line-clamp-none transition-all">
                     "{action.reasoning}"
                  </div>

                  <div className="ml-auto text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] hidden xl:block">
                     {new Date(action.timestamp || Date.now()).toLocaleTimeString()}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
