import type { Opportunity, NewsItem, Signal, AgentAction, StockHistory } from "./types";

export const mockOpportunities: Opportunity[] = [
  { symbol: "INFY", company: "Infosys Ltd", signal_score: 4.2, predicted_move_min: 3, predicted_move_max: 5, confidence: 0.72, trigger: "$1B AI contract win", last_updated: "2026-03-16T08:11:00Z" },
  { symbol: "TATAMOTORS", company: "Tata Motors", signal_score: 3.8, predicted_move_min: 2, predicted_move_max: 4, confidence: 0.68, trigger: "EV sales surge 40% YoY", last_updated: "2026-03-16T07:45:00Z" },
  { symbol: "HDFC", company: "HDFC Bank", signal_score: 4.5, predicted_move_min: 1, predicted_move_max: 3, confidence: 0.81, trigger: "Q4 earnings beat estimates", last_updated: "2026-03-16T09:00:00Z" },
  { symbol: "RELIANCE", company: "Reliance Industries", signal_score: 3.2, predicted_move_min: -1, predicted_move_max: 2, confidence: 0.55, trigger: "Jio 5G expansion complete", last_updated: "2026-03-16T06:30:00Z" },
  { symbol: "TCS", company: "Tata Consultancy", signal_score: 3.9, predicted_move_min: 2, predicted_move_max: 4, confidence: 0.74, trigger: "Major cloud deal signed", last_updated: "2026-03-16T08:30:00Z" },
  { symbol: "WIPRO", company: "Wipro Ltd", signal_score: 2.8, predicted_move_min: -2, predicted_move_max: 1, confidence: 0.45, trigger: "CEO transition announced", last_updated: "2026-03-16T07:00:00Z" },
];

export const mockNews: NewsItem[] = [
  { id: "n-1", title: "HDFC Bank Q4 results beat street expectations by 12%", summary: "HDFC Bank reported strong Q4 results with net profit up 20% YoY, beating analyst estimates.", entities: [{ symbol: "HDFC", name: "HDFC Bank", type: "company" }], sentiment: "positive", impact_score: 0.82, agent_explanation: "Strong earnings increase buy-side interest. Historical pattern shows 3-5% post-earnings rally.", timestamp: "2026-03-16T09:00:00Z" },
  { id: "n-2", title: "Infosys wins $1B AI transformation deal with European bank", summary: "Infosys secured a landmark $1B deal to build AI infrastructure for a major European financial institution.", entities: [{ symbol: "INFY", name: "Infosys", type: "company" }], sentiment: "positive", impact_score: 0.91, agent_explanation: "Largest AI deal in Indian IT sector. Revenue visibility improved significantly for next 3 years.", timestamp: "2026-03-16T08:11:00Z" },
  { id: "n-3", title: "Tata Motors EV division reports 40% sales growth", summary: "Tata Motors' electric vehicle segment showed exceptional growth with 40% increase in quarterly sales.", entities: [{ symbol: "TATAMOTORS", name: "Tata Motors", type: "company" }], sentiment: "positive", impact_score: 0.76, agent_explanation: "EV transition accelerating faster than expected. Market share gains from legacy automakers.", timestamp: "2026-03-16T07:45:00Z" },
  { id: "n-4", title: "RBI holds interest rates steady, signals caution", summary: "Reserve Bank of India maintains repo rate at 6.5%, cites global uncertainty and inflation risks.", entities: [{ symbol: "HDFC", name: "HDFC Bank", type: "company" }, { symbol: "ICICI", name: "ICICI Bank", type: "company" }], sentiment: "neutral", impact_score: 0.65, agent_explanation: "Status quo expected. Banking sector flat. Focus shifts to credit growth metrics.", timestamp: "2026-03-16T06:00:00Z" },
  { id: "n-5", title: "Wipro announces CEO transition, stock dips 2%", summary: "Wipro's board announced a planned CEO succession, leading to short-term uncertainty.", entities: [{ symbol: "WIPRO", name: "Wipro", type: "company" }], sentiment: "negative", impact_score: 0.58, agent_explanation: "Leadership transitions historically cause 5-10 day volatility. Long-term impact depends on successor.", timestamp: "2026-03-16T07:00:00Z" },
  { id: "n-6", title: "TCS bags $800M cloud migration deal with Fortune 500 firm", summary: "TCS won a major cloud infrastructure deal reinforcing its position in enterprise cloud services.", entities: [{ symbol: "TCS", name: "TCS", type: "company" }], sentiment: "positive", impact_score: 0.84, agent_explanation: "Strengthens cloud services pipeline. Deal size indicates strong enterprise demand.", timestamp: "2026-03-16T08:30:00Z" },
  { id: "n-7", title: "Reliance Jio completes pan-India 5G rollout", summary: "Reliance Jio has achieved complete 5G coverage across all Indian states and major cities.", entities: [{ symbol: "RELIANCE", name: "Reliance Industries", type: "company" }], sentiment: "positive", impact_score: 0.71, agent_explanation: "5G completion is priced in but monetization potential upside remains. ARPU growth key metric.", timestamp: "2026-03-16T06:30:00Z" },
  { id: "n-8", title: "Global semiconductor shortage easing, tech stocks rally", summary: "Major chip manufacturers report improved supply chains, boosting technology sector sentiment.", entities: [{ symbol: "INFY", name: "Infosys", type: "company" }, { symbol: "TCS", name: "TCS", type: "company" }], sentiment: "positive", impact_score: 0.63, agent_explanation: "Indirect positive for IT services — client capex may increase. Modest 1-2% sector uplift expected.", timestamp: "2026-03-16T05:15:00Z" },
];

export const mockSignals: Signal[] = [
  { symbol: "HDFC", company: "HDFC Bank", signal_score: 4.5, predicted_move_min: 1, predicted_move_max: 3, confidence: 0.81, trigger: "Q4 earnings beat", sector: "Banking", last_news: "Q4 results beat expectations", sparkline: [100, 102, 101, 103, 105, 104, 107, 109, 108, 111] },
  { symbol: "INFY", company: "Infosys Ltd", signal_score: 4.2, predicted_move_min: 3, predicted_move_max: 5, confidence: 0.72, trigger: "$1B AI contract", sector: "IT Services", last_news: "$1B AI deal with EU bank", sparkline: [95, 96, 98, 97, 100, 103, 105, 104, 106, 108] },
  { symbol: "TCS", company: "Tata Consultancy", signal_score: 3.9, predicted_move_min: 2, predicted_move_max: 4, confidence: 0.74, trigger: "Cloud deal", sector: "IT Services", last_news: "$800M cloud migration deal", sparkline: [88, 89, 90, 91, 90, 92, 93, 95, 94, 96] },
  { symbol: "TATAMOTORS", company: "Tata Motors", signal_score: 3.8, predicted_move_min: 2, predicted_move_max: 4, confidence: 0.68, trigger: "EV sales growth", sector: "Auto", last_news: "EV sales up 40%", sparkline: [75, 76, 78, 77, 80, 82, 81, 84, 86, 88] },
  { symbol: "RELIANCE", company: "Reliance Industries", signal_score: 3.2, predicted_move_min: -1, predicted_move_max: 2, confidence: 0.55, trigger: "5G rollout", sector: "Conglomerate", last_news: "Jio 5G pan-India", sparkline: [110, 111, 109, 112, 111, 113, 112, 114, 113, 115] },
  { symbol: "WIPRO", company: "Wipro Ltd", signal_score: 2.8, predicted_move_min: -2, predicted_move_max: 1, confidence: 0.45, trigger: "CEO change", sector: "IT Services", last_news: "CEO transition announced", sparkline: [65, 66, 64, 63, 62, 63, 61, 60, 61, 59] },
  { symbol: "ICICI", company: "ICICI Bank", signal_score: 3.5, predicted_move_min: 1, predicted_move_max: 2, confidence: 0.62, trigger: "Credit growth", sector: "Banking", last_news: "Strong retail loan growth", sparkline: [92, 93, 94, 93, 95, 96, 97, 96, 98, 99] },
  { symbol: "SBIN", company: "State Bank of India", signal_score: 3.1, predicted_move_min: 0, predicted_move_max: 2, confidence: 0.58, trigger: "NPA reduction", sector: "Banking", last_news: "NPAs at multi-year low", sparkline: [55, 56, 57, 56, 58, 59, 58, 60, 61, 62] },
];

export const mockAgentActions: AgentAction[] = [
  { type: "agent_action", agent_id: "A-001", agent_type: "FOMO", symbol: "INFY", action: "BUY", size: 75000, timestamp: "2026-03-16T08:12:00Z" },
  { type: "agent_action", agent_id: "A-002", agent_type: "VALUE", symbol: "HDFC", action: "BUY", size: 120000, timestamp: "2026-03-16T09:01:00Z" },
  { type: "agent_action", agent_id: "A-003", agent_type: "MOMENTUM", symbol: "TATAMOTORS", action: "BUY", size: 50000, timestamp: "2026-03-16T07:46:00Z" },
  { type: "agent_action", agent_id: "A-004", agent_type: "CONTRARIAN", symbol: "WIPRO", action: "BUY", size: 30000, timestamp: "2026-03-16T07:05:00Z" },
  { type: "agent_action", agent_id: "A-005", agent_type: "INSTITUTIONAL", symbol: "TCS", action: "BUY", size: 200000, timestamp: "2026-03-16T08:31:00Z" },
  { type: "agent_action", agent_id: "A-006", agent_type: "FOMO", symbol: "RELIANCE", action: "SELL", size: 45000, timestamp: "2026-03-16T06:35:00Z" },
  { type: "agent_action", agent_id: "A-007", agent_type: "VALUE", symbol: "INFY", action: "BUY", size: 90000, timestamp: "2026-03-16T08:15:00Z" },
  { type: "agent_action", agent_id: "A-008", agent_type: "MOMENTUM", symbol: "HDFC", action: "BUY", size: 80000, timestamp: "2026-03-16T09:05:00Z" },
  { type: "agent_action", agent_id: "A-009", agent_type: "CONTRARIAN", symbol: "TATAMOTORS", action: "SELL", size: 25000, timestamp: "2026-03-16T07:50:00Z" },
  { type: "agent_action", agent_id: "A-010", agent_type: "INSTITUTIONAL", symbol: "HDFC", action: "BUY", size: 300000, timestamp: "2026-03-16T09:10:00Z" },
];

export function generateStockHistory(basePrice: number, days: number = 90): StockHistory[] {
  const data: StockHistory[] = [];
  let price = basePrice;
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const change = (Math.random() - 0.48) * (price * 0.03);
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * (price * 0.01);
    const low = Math.min(open, close) - Math.random() * (price * 0.01);
    const volume = Math.floor(1000000 + Math.random() * 5000000);
    data.push({ date: date.toISOString().split("T")[0], open: +open.toFixed(2), high: +high.toFixed(2), low: +low.toFixed(2), close: +close.toFixed(2), volume });
    price = close;
  }
  return data;
}
