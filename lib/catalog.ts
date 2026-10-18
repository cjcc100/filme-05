import fs from 'fs';
import path from 'path';
import { searchTMDBMovie } from './tmdb';

export function getCatalogFileNames(): string[] {
  const filePath = path.join(process.cwd(), 'data', 'filmes.txt');
  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
}

export async function getCatalogMovies() {
  const fileNames = getCatalogFileNames();

  return Promise.all(
    fileNames.map(async (fileName) => {
      const tmdbData = await searchTMDBMovie(fileName);

      return {
        fileName,
        tmdbData,
        id: tmdbData?.id,
        title: tmdbData?.title || fileName.replace(/\.[^/.]+$/, ''),
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
