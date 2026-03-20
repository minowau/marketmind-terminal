import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { searchStocks } from "@/lib/api";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const data = await searchStocks(query);
        setResults(data);
        setIsOpen(true);
      } catch (error) {
        console.error("Failed to search stocks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (symbol: string) => {
    setIsOpen(false);
    setQuery("");
    navigate(`/stock/${symbol}`);
  };

  return (
    <div ref={wrapperRef} className="relative z-50">
      <div className="relative">
        {isLoading ? (
          <Loader2 className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
        ) : (
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Search NSE stock..."
          className="h-8 w-40 md:w-64 rounded-md border border-border bg-muted pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono transition-all"
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-full md:w-[350px] bg-card border border-border rounded-md shadow-lg overflow-hidden py-1">
          {results.map((result) => (
            <button
              key={result.yahoo_symbol}
              onClick={() => handleSelect(result.symbol)}
              className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex flex-col items-start gap-1 border-b border-border/50 last:border-0"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-mono font-bold text-sm text-foreground">
                  {result.symbol}
                </span>
                <span className="text-[10px] bg-secondary text-secondary-foreground px-1.5 rounded uppercase font-mono">
                  {result.exchange}
                </span>
              </div>
              <span className="text-xs text-muted-foreground truncate w-full">
                {result.company_name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
