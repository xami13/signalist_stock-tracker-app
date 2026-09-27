"use client"

import {useEffect, useState} from "react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";
import {Button} from "@/components/ui/button";
import {Loader2, TrendingUp} from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import {searchStocks} from "@/lib/actions/finnhub.actions";
import WatchlistButton from '@/components/WatchlistButton';

export default function SearchCommand({ renderAs = 'button', label = 'Add stock', initialStocks }: SearchCommandProps ) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [stocks, setStocks] = useState<StockWithWatchlistStatus[]>(initialStocks);
  const [watchlistSymbols, setWatchlistSymbols] = useState(() => new Set(initialStocks.filter((stock) => stock.isInWatchlist).map((stock) => stock.symbol)));

  const isSearchMode = !!searchTerm.trim();
  const displayStocks = isSearchMode ? stocks : initialStocks.slice(0, 10).map((stock) => ({ ...stock, isInWatchlist: watchlistSymbols.has(stock.symbol) }));

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const term = searchTerm.trim();
    if (!term) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchStocks(term);
        if (!cancelled) setStocks(results.map((stock) => ({ ...stock, isInWatchlist: watchlistSymbols.has(stock.symbol) })));
      } catch {
        if (!cancelled) setStocks([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [searchTerm, watchlistSymbols]);

  const handleSelectStock = () => {
    setOpen(false);
    setSearchTerm("");
  };

  const handleWatchlistChange = (symbol: string, isAdded: boolean) => {
    setWatchlistSymbols((current) => {
      const next = new Set(current);
      if (isAdded) next.add(symbol); else next.delete(symbol);
      return next;
    });
    setStocks((current) => current.map((stock) => stock.symbol === symbol ? { ...stock, isInWatchlist: isAdded } : stock));
    router.refresh();
  };

  return (
    <>
      {renderAs === "text" ? (
          <span onClick={() => setOpen(true)} className={"search-text"}>
            {label}
          </span>
      ): (
          <Button onClick={() => setOpen(true)} className={"search-btn"}>
            {label}
          </Button>
      )}
      <CommandDialog open={open} onOpenChange={setOpen} className={"search-dialog"}>
        <div className="search-field">
          <CommandInput
              value={searchTerm}
              onValueChange={setSearchTerm}
              placeholder="Search stocks..." className={"search-input"}
          />
          {loading && <Loader2 className={"search-loader"}/>}
        </div>

        <CommandList className="search-list">
          {loading ? (
              <CommandEmpty className={"search-list-empty"}> Loading stocks ... </CommandEmpty>
          ) : displayStocks?.length === 0 ? (
              <div className="search-list-indicator">
                {isSearchMode ? 'No results found' : 'No stocks found.'}
              </div>
          ) : (
              <ul>
                <div className={"search-count"}>
                  {isSearchMode ? 'search results' : 'Popular stocks'}
                  {` `}({displayStocks?.length || 0})
                </div>
                {displayStocks?.map((stock) => (
                    <li key={stock.symbol} className={"search-item"}>

                      <div className="search-item-link">
                      <Link href={`/stocks/${stock.symbol}`} onClick={handleSelectStock} className="flex min-w-0 flex-1 items-center gap-3 py-3">
                        <TrendingUp className={"h-4 w-4 text-gray-500"}/>
                        <div className={"flex-1"}>
                          <div className={"search-item-name"}>
                            {stock.name}
                          </div>
                          <div className={"text-sm text-gray-500"}>
                            {stock.symbol} | {stock.exchange} | {stock.type}
                          </div>
                        </div>
                      </Link>
                      <WatchlistButton symbol={stock.symbol} company={stock.name} isInWatchlist={stock.isInWatchlist} type="icon" onWatchlistChange={handleWatchlistChange} />
                      </div>

                    </li>
                ))}
              </ul>
          ) }
        </CommandList>
      </CommandDialog>

    </>
  );
}
