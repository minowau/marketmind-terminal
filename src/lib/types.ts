export interface Opportunity {
  symbol: string;
  company: string;
  signal_score: number;
  predicted_move: {
    min_pct: number;
    max_pct: number;
    confidence: number;
  };
  confidence: number;
  trigger: string;
  last_updated?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  entities: { symbol: string; name: string; type: string }[];
  sentiment: "positive" | "negative" | "neutral";
  impact_score: number;
  agent_explanation: string;
  timestamp: string;
  url?: string;
  source?: string;
}

export interface AgentAction {
  type: "agent_action";
  agent_id: string;
  agent_type: "FOMO" | "VALUE" | "MOMENTUM" | "CONTRARIAN" | "INSTITUTIONAL" | "DAY_TRADER";
  symbol: string;
  action: "BUY" | "SELL" | "HOLD";
  size: number;
  timestamp: string;
  reasoning?: string;
}

export interface StockHistory {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Signal {
  symbol: string;
  company: string;
  signal_score: number;
  predicted_move_min: number;
  predicted_move_max: number;
  confidence: number;
  trigger: string;
  sector: string;
  last_news: string;
  sparkline: number[];
  last_updated?: string;
}
