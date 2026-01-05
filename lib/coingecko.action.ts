"use server"

import qs from "query-string"


const BASE_URL = process.env.COINGECKO_BASE_URL;
const API_KEY = process.env.COINGECKO_API_KEY;

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
  // Construye la URL completa incluyendo los parámetros de consulta.
  const url = qs.stringifyUrl(
    {
      url: `${BASE_URL}/${endpoint}`,
      query: params,
    },
    { skipEmptyString: true, skipNull: true },
  );

  // Realiza la petición fetch a la API.
  const response = await fetch(url, {
    headers: {
      'x-cg-pro-api-key': API_KEY,
      'Content-Type': 'application/json',
    } as Record<string, string>,
    next: { revalidate },
  });

  // Si la respuesta no es exitosa, maneja el error.
  if (!response.ok) {
    // Intenta obtener el cuerpo del error de la respuesta.
    const errorBody: CoinGeckoErrorBody = await response.json().catch(() => ({}));

    // Lanza un error con detalles sobre el fallo.
    throw new Error(`API Error: ${response.status}: ${errorBody.error || response.statusText} `);
  }

  // Si la respuesta es exitosa, la convierte a JSON y la devuelve.
  return response.json();
}