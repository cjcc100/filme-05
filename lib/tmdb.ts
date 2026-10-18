import { config } from './config';

export type TmdbMovieSearchResult = {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  vote_average?: number;
};

function parseFileName(fileName: string) {
  const withoutExt = fileName.replace(/\.[^/.]+$/, '');
  const yearMatch = withoutExt.match(/(?:^|[(\s])(\d{4})(?:[)\s]|$)/);
  const year = yearMatch?.[1];
  const query = withoutExt
    .replace(/[()[\]]/g, ' ')
    .replace(/\(\d{4}\)/g, ' ') // Remove ano entre parênteses
    .replace(/[._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return { query, year, title: withoutExt };
}

async function searchByQuery(query: string, year?: string, language: string = 'pt-BR') {
  const url = new URL(`${config.tmdb.baseUrl}/search/movie`);
  url.searchParams.set('api_key', config.tmdb.apiKey);
  url.searchParams.set('language', language);
  url.searchParams.set('query', query);
  if (year) {
    url.searchParams.set('year', year);
  }

  const searchRes = await fetch(url.toString(), {
    next: { revalidate: 600 },
  });

  if (!searchRes.ok) return null;
  const searchData = await searchRes.json();
  return (searchData.results?.[0] as TmdbMovieSearchResult | undefined) ?? null;
}

export async function searchTMDBMovie(fileName: string): Promise<TmdbMovieSearchResult | null> {
  try {
    const { query, year } = parseFileName(fileName);
    if (query.length < 2) return null;

    const withYear = await searchByQuery(query, year);
    if (withYear) return withYear;

    if (year) {
      const withoutYear = await searchByQuery(query);
      if (withoutYear) return withoutYear;
    }

    const words = query.split(' ');
    for (let size = Math.min(words.length - 1, 5); size >= 2; size--) {
      const shorter = words.slice(0, size).join(' ');
      const result = await searchByQuery(shorter, year);
      if (result) return result;
    }

    return null;
  } catch (error) {
    console.error('Error searching TMDb:', error);
    return null;
  }
}

export async function getMovieData(movieId: string): Promise<TmdbMovieSearchResult | null> {
  try {
    const res = await fetch(
      `${config.tmdb.baseUrl}/movie/${movieId}?api_key=${config.tmdb.apiKey}&language=pt-BR`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Error fetching movie data:', error);
    return null;
  }
}
