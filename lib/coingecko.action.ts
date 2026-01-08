"use server"

import qs from "query-string"


const BASE_URL = process.env.COINGECKO_BASE_URL;
const API_KEY = process.env.COINGECKO_API_KEY;

// Debugging temporal - ELIMINAR después de verificar
console.log('BASE_URL:', BASE_URL);
console.log('API_KEY exists:', !!API_KEY);
console.log('API_KEY length:', API_KEY?.length);

if (!BASE_URL) throw new Error('Could not get base url');
if (!API_KEY) throw new Error('Could not get api key');

/**
 * Realiza una petición a la API de CoinGecko de forma genérica y cacheada.
 * @template T El tipo de dato esperado en la respuesta.
 * @param {string} endpoint El endpoint específico de la API de CoinGecko a consultar.
 * @param {QueryParams} [params] Parámetros de consulta opcionales para la petición.
 * @param {number} [revalidate=60] El tiempo en segundos para la revalidación del caché de Next.js.
 * @returns {Promise<T>} Una promesa que resuelve con los datos de la API.
 * @throws {Error} Lanza un error si la respuesta de la API no es exitosa (no-ok).
 */
export async function fetcher<T>(
  endpoint: string,
  params?: QueryParams,
  revalidate = 60,
): Promise<T> {

  const url = qs.stringifyUrl(                                                                   // Construye la URL completa incluyendo los parámetros de consulta.
    {
      url: `${BASE_URL}/${endpoint}`,
      query: params,
    },
    { skipEmptyString: true, skipNull: true },
  );


  const response = await fetch(url, {                                                            // Realiza la petición fetch a la API.
    headers: {
      'x-cg-demo-api-key': API_KEY,
      'Content-Type': 'application/json',
    } as Record<string, string>,
    next: { revalidate },                                                                        // Usa la opción next: { revalidate } para controlar el comportamiento del caché de datos de Next.js.
  });


  if (!response.ok) {                                                                            // Si la respuesta no es exitosa, maneja el error.

    const errorBody: CoinGeckoErrorBody = await response.json().catch(() => ({}));               // Intenta obtener el cuerpo del error de la respuesta.

    const errorMessage = typeof errorBody.error === 'object'
      ? JSON.stringify(errorBody.error)
      : errorBody.error || response.statusText;

    throw new Error(                                                                             // Lanza un error con detalles sobre el fallo.
      `API Error: ${response.status}: ${errorMessage} `
    );
  }


  return response.json();                                                                         // Si la respuesta es exitosa, la convierte a JSON y la devuelve.
}

// getPools sirve para buscar y obtener información sobre un pool de liquidez
// asociado a una criptomoneda específica. La función opera con una lógica de 2 intentos para
// encontrar el mejor pool posible.
// Si se proporciona una red y un contrato, se prioriza la búsqueda específica on-chain.
// Si no se proporciona una red y un contrato, se realiza una búsqueda general por ID.
export async function getPools(
  id: string,
  network?: string | null,
  contractAddress?: string | null,
): Promise<PoolData> {
  const fallback: PoolData = {                                                                    // Define un objeto vacío por defecto para evitar errores si no hay datos
    id: '',
    address: '',
    name: '',
    network: '',
  };

  if (network && contractAddress) {                                                               // Si existen red y contrato, prioriza la búsqueda específica on-chain
    try {
      const poolData = await fetcher<{ data: PoolData[] }>(                                       // Realiza la petición a la API usando la dirección del contrato
        `/onchain/networks/${network}/tokens/${contractAddress}/pools`,
      );

      return poolData.data?.[0] ?? fallback;                                                      // Retorna el primer pool encontrado o el objeto fallback si no hay datos
    } catch (error) {
      console.log(error);
      return fallback;
    }
  }

  try {
    const poolData = await fetcher<{ data: PoolData[] }>('/onchain/search/pools', { query: id }); // Búsqueda general por ID si faltan datos de red/contrato

    return poolData.data?.[0] ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Obtiene datos en tiempo real de una moneda específica.
 */
export async function getLiveCoinData(coinId: string) {
  try {
    const data = await fetcher<CoinDetailsData>(`/coins/${coinId}`, {
      localization: false,
      tickers: false,
      market_data: true,
      community_data: false,
      developer_data: false,
      sparkline: false,
    }, 0); // Revalidate 0 for live data

    return {
      usd: data.market_data.current_price.usd,
      change24h: data.market_data.price_change_percentage_24h_in_currency.usd,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Error fetching live coin data:', error);
    return null;
  }
}

/**
 * Obtiene los trades más recientes de un pool específico en GeckoTerminal.
 */
export async function getLiveTrades(poolId: string) {
  try {
    const [network, address] = poolId.split('_');
    if (!network || !address) return [];

    const response = await fetcher<{ data: any[] }>(
      `/onchain/networks/${network}/pools/${address}/trades`,
      {},
      0
    );

    return response.data.map((trade: any) => ({
      price: parseFloat(trade.attributes.price_in_usd),
      timestamp: new Date(trade.attributes.block_timestamp).getTime(),
      type: trade.attributes.kind === 'buy' ? 'b' : 's',
      amount: parseFloat(trade.attributes.from_token_amount),
      value: parseFloat(trade.attributes.volume_in_usd),
    }));
  } catch (error) {
    console.error('Error fetching live trades:', error);
    return [];
  }
}

/**
 * Obtiene los datos OHLC más recientes de un pool.
 */
export async function getLiveOHLC(coinId: string) {
  try {
    const data = await fetcher<OHLCData[]>(`/coins/${coinId}/ohlc`, {
      vs_currency: 'usd',
      days: 1,
      precision: 'full',
    }, 0);

    return data[data.length - 1] ?? null;
  } catch (error) {
    console.error('Error fetching live OHLC:', error);
    return null;
  }
}

/**
 * Busca monedas, exchanges y más en CoinGecko.
 */
export async function searchCoins(query: string): Promise<SearchCoin[]> {
  if (!query) return [];
  try {
    const data = await fetcher<{ coins: SearchCoin[] }>('/search', { query });
    return data.coins;
  } catch (error) {
    console.error('Error searching coins:', error);
    return [];
  }
}

/**
 * Obtiene las monedas en tendencia de CoinGecko.
 */
export async function getTrendingCoins(): Promise<TrendingCoin[]> {
  try {
    const data = await fetcher<{ coins: TrendingCoin[] }>('/search/trending');
    return data.coins;
  } catch (error) {
    console.error('Error fetching trending coins:', error);
    return [];
  }
}
