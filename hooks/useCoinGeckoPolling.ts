'use client';

import { useState, useEffect, useRef } from 'react';
import { getLiveCoinData, getLiveTrades, getLiveOHLC } from '@/lib/coingecko.action';

/**
 * Hook para obtener datos de CoinGecko mediante polling.
 */
export const useCoinGeckoPolling = ({ coinId, poolId, liveInterval }: UseCoinGeckoPollingProps): UseCoinGeckoPollingReturn => {
  const [price, setPrice] = useState<ExtendedPriceData | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [ohlcv, setOhlcv] = useState<OHLCData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = async () => {
    try {
      const [newPrice, newTrades, newOhlcv] = await Promise.all([
        getLiveCoinData(coinId),
        getLiveTrades(poolId),
        getLiveOHLC(coinId),
      ]);

      if (newPrice) {
        setPrice((prev) => ({
          ...prev,
          ...newPrice,
          coin: coinId,
        }));
      }

      if (newTrades.length > 0) {
        setTrades(newTrades);
      }

      if (newOhlcv) {
        setOhlcv(newOhlcv);
      }

      setError(null);
    } catch (err) {
      console.error('Polling error:', err);
      setError('Failed to fetch live data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Primera carga inmediata
    fetchData();

    // Configurar polling: 30 segundos si es '1s' (para evitar bloqueos de API) o 1 minuto.
    const ms = liveInterval === '1s' ? 30000 : 60000;

    const interval = setInterval(fetchData, ms);

    return () => clearInterval(interval);
  }, [coinId, poolId, liveInterval]);

  return {
    price,
    trades,
    ohlcv,
    isLoading,
    error,
  };
};