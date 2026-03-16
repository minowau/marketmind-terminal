import { motion } from "framer-motion";
import { pageTransition } from "@/lib/motionVariants";
import { useState } from "react";
import { Save } from "lucide-react";

export default function SettingsPage() {
  const [riskTolerance, setRiskTolerance] = useState(50);
  const [newsSensitivity, setNewsSensitivity] = useState(70);
  const [useLLM, setUseLLM] = useState(true);
  const [wsSpeed, setWsSpeed] = useState(1);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <motion.div {...pageTransition} className="p-4 space-y-6 max-w-2xl">
      <h1 className="text-lg font-bold text-foreground">Settings & Configuration</h1>

      {/* Agent Config */}
      <div className="rounded-md border border-border bg-card p-4 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agent Parameters</h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Risk Tolerance ({riskTolerance}%)</label>
            <input
              type="range" min={0} max={100} value={riskTolerance}
              onChange={(e) => setRiskTolerance(+e.target.value)}
              className="w-full accent-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">News Sensitivity ({newsSensitivity}%)</label>
            <input
              type="range" min={0} max={100} value={newsSensitivity}
              onChange={(e) => setNewsSensitivity(+e.target.value)}
              className="w-full accent-primary"
            />
          </div>
        </div>
      </div>

      {/* Feature toggles */}
      <div className="rounded-md border border-border bg-card p-4 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Feature Toggles</h3>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-foreground">LLM Reasoning</div>
            <div className="text-xs text-muted-foreground">Use LLM for agent decisions vs simple rules</div>
          </div>
          <button
            onClick={() => setUseLLM(!useLLM)}
            className={`relative h-6 w-11 rounded-full transition-colors ${useLLM ? "bg-primary" : "bg-muted"}`}
          >
            <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform ${useLLM ? "translate-x-[22px]" : "translate-x-0.5"}`} />
          </button>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">WebSocket Speed ({wsSpeed}x)</label>
          <div className="flex gap-1">
            {[0.5, 1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setWsSpeed(s)}
                className={`px-3 py-1 rounded text-xs font-mono ${wsSpeed === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Save className="h-4 w-4" />
        {saved ? "Saved!" : "Save Configuration"}
      </button>
    </motion.div>
  );
}
