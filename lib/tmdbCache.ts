import { getMovieData } from './tmdb';

// Cache simples em memória para dados do TMDb
const tmdbCache = new Map<string, any>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas em milissegundos

interface CacheEntry {
  data: any;
  timestamp: number;
}

/**
 * Busca dados do TMDb com cache
 * @param tmdbId ID do filme no TMDb
 */
export async function getMovieDataWithCache(tmdbId: string) {
  const cacheKey = `movie_${tmdbId}`;
  const now = Date.now();

  // Verificar se tem no cache e ainda é válido
  const cached = tmdbCache.get(cacheKey) as CacheEntry;
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    console.log(`Cache hit para ${tmdbId}`);
    return cached.data;
  }

  // Se não tem no cache ou expirou, buscar do TMDb
  console.log(`Cache miss para ${tmdbId}, buscando do TMDb...`);
  const data = await getMovieData(tmdbId);

  // Salvar no cache
  tmdbCache.set(cacheKey, {
    data,
    timestamp: now
  });

  return data;
}

/**
 * Limpa o cache (útil para debug ou quando quiser forçar atualização)
 */
export function clearTmdbCache() {
  tmdbCache.clear();
  console.log('Cache do TMDb limpo');
}

/**
 * Limpa entradas expiradas do cache
 */
export function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, value] of tmdbCache.entries()) {
    const entry = value as CacheEntry;
    if ((now - entry.timestamp) >= CACHE_DURATION) {
      tmdbCache.delete(key);
    }
  }
  console.log('Entradas expiradas do cache limpas');
}
