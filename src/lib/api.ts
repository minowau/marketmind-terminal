import type { NewsItem, Signal, Opportunity, AgentAction, StockHistory } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export async function fetchNews(limit = 20, sentiment?: string): Promise<NewsItem[]> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (sentiment && sentiment !== 'all') {
    params.set("sentiment", sentiment);
  }
  
  const response = await fetch(`${API_BASE_URL}/news/?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch news');
  }
  
  const data = await response.json();
  // Map backend NewsWithAnalysisOut to frontend NewsItem
  return data.map((item: any) => ({
    id: item.id.toString(),
    title: item.title,
    summary: item.summary || "",
    entities: (item.analysis?.entities || []).map((e: string) => ({
      symbol: e,
      name: e,
      type: "company",
    })),
    sentiment: item.analysis?.sentiment || "neutral",
    impact_score: item.analysis?.impact_score || 0.5,
    agent_explanation: item.analysis?.analysis_text || "",
    timestamp: item.published_at || item.created_at,
    url: item.url,
    source: item.source
  }));
}

export async function fetchSignals(): Promise<Signal[]> {
  const response = await fetch(`${API_BASE_URL}/signals/`);
  if (!response.ok) {
    throw new Error('Failed to fetch signals');
  }
  return await response.json();
}

export async function fetchOpportunities(): Promise<Opportunity[]> {
  const response = await fetch(`${API_BASE_URL}/opportunities/`);
  if (!response.ok) {
    throw new Error('Failed to fetch opportunities');
  }
  return await response.json();
}

export async function fetchStockOverview(symbol: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/stock/${symbol}/overview`);
  if (!response.ok) {
    throw new Error(`Failed to fetch stock overview for ${symbol}`);
  }
  return await response.json();
}

export async function fetchAllStocks(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/stock/`);
  if (!response.ok) {
    throw new Error('Failed to fetch tracked stocks');
  }
  return await response.json();
}

export async function searchStocks(query: string): Promise<any[]> {
  if (!query) return [];
  const response = await fetch(`${API_BASE_URL}/stock/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Search failed');
  }
  return await response.json();
}

export async function fetchWishlist(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/wishlist/`);
  if (!response.ok) {
    throw new Error('Failed to fetch wishlist');
  }
  return await response.json();
}

export async function addToWishlist(symbol: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/wishlist/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol })
  });
  if (!response.ok) {
    throw new Error('Failed to add to wishlist');
  }
  return await response.json();
}

export async function removeFromWishlist(symbol: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/wishlist/${symbol}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error('Failed to remove from wishlist');
  }
  return await response.json();
}

