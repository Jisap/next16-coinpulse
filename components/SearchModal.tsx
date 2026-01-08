'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, TrendingUp, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { searchCoins, getTrendingCoins } from '@/lib/coingecko.action';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchCoin[]>([]);
  const [trending, setTrending] = useState<TrendingCoin[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Fetch trending coins on mount
  useEffect(() => {
    const fetchTrending = async () => {
      const coins = await getTrendingCoins();
      setTrending(coins);
    };
    fetchTrending();
  }, []);

  // Handle search with debounce para la busqueda de coins
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      try {
        const searchResults = await searchCoins(query);
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSelect = (coinId: string) => {
    router.push(`/coins/${coinId}`);
    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 sm:pt-[15vh]">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Cabezera */}
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Search coins (e.g. bitcoin, eth)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 border-none bg-transparent focus-visible:ring-0 text-lg p-0 h-auto"
          />
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : (
            <button
              onClick={onClose}
              className="p-1 hover:bg-accent rounded-md transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Cuerpo */}
        <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-border">
          {/* Si no hay busqueda se muestra los coins mas populares */}
          {query.trim() === '' ? (
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-3 h-3" />
                TRENDING COINS
              </div>
              <div className="space-y-1">
                {trending.map((coin) => (
                  <SearchItem
                    key={coin.item.id}
                    coin={coin.item}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </div>
          ) : (
            // Si hay busqueda se muestra los resultados de la busqueda (results)
            <div>
              {results.length > 0 ? (
                <div className="space-y-1">
                  {results.slice(0, 8).map((coin) => (
                    <SearchItem
                      key={coin.id}
                      coin={coin}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              ) : !isLoading && (
                <div className="p-8 text-center text-muted-foreground">
                  No results found for "{query}"
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-3 bg-muted/30 border-t border-border flex justify-between items-center text-[10px] text-muted-foreground">
          <div className="flex gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-background border border-border font-sans">ESC</kbd> to close</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-background border border-border font-sans">↵</kbd> to select</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-background border border-border font-sans">Ctrl+K</kbd> to toggle</span>
          </div>
          <p>Powered by CoinGecko</p>
        </div>
      </div>
    </div>
  );
};

const SearchItem: React.FC<{
  coin: SearchItemCoin;
  onSelect: (id: string) => void
}> = ({ coin, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(coin.id)}
      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left group"
    >
      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-muted shrink-0">
        <Image
          src={(coin as SearchCoin).thumb || (coin as TrendingCoin['item']).thumb || '/placeholder-coin.svg'}
          alt={coin.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate flex items-center gap-2">
          {coin.name}
          <span className="text-xs text-muted-foreground font-normal uppercase">{coin.symbol}</span>
        </div>
        {(coin as SearchCoin).market_cap_rank !== undefined && (
          <div className="text-[10px] text-muted-foreground">
            Rank #{(coin as SearchCoin).market_cap_rank}
          </div>
        )}
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium text-primary flex items-center gap-1">
        View Details
        <Search className="w-3 h-3" />
      </div>
    </button>
  );
};

export default SearchModal;
