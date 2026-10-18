import fs from 'fs';
import path from 'path';
import { searchTMDBMovie, getMovieData } from './tmdb';

export interface CatalogEntry {
  fileName: string;
  tmdbId?: string;
}

export function getCatalogFileNames(): CatalogEntry[] {
  const filePath = path.join(process.cwd(), 'data', 'filmes.txt');
  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((line) => {
      const parts = line.split('#');
      const fileName = parts[0];
      const tmdbId = parts[1];
      return { fileName, tmdbId };
    });
}

export async function getCatalogMovies() {
  const entries = getCatalogFileNames();

  return Promise.all(
    entries.map(async (entry) => {
      let tmdbData = null;

      // Se tiver ID do TMDb, buscar diretamente pelo ID
      if (entry.tmdbId) {
        tmdbData = await getMovieData(entry.tmdbId);
      }

      // Se não encontrar pelo ID ou não tiver ID, buscar pelo nome do arquivo
      if (!tmdbData) {
        tmdbData = await searchTMDBMovie(entry.fileName);
      }

      return {
        fileName: entry.fileName,
        tmdbData,
        id: tmdbData?.id,
        title: tmdbData?.title || entry.fileName.replace(/\.[^/.]+$/, ''),
        description: tmdbData?.overview || 'Filme disponível para assistir',
      };
    })
  );
}

export function findCatalogFileByTmdbId(
  movies: Awaited<ReturnType<typeof getCatalogMovies>>,
  tmdbId: string
) {
  return movies.find((movie) => String(movie.tmdbData?.id) === tmdbId)?.fileName ?? null;
}
