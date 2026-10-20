'use client';

import { useState, useEffect } from 'react';
import MovieCard from './MovieCard';
import { getWatchHistory } from '../lib/history';

interface Movie {
  fileName: string;
  tmdbData?: {
    id?: number;
    title?: string;
    name?: string;
    poster_path?: string;
    backdrop_path?: string;
    release_date?: string;
    vote_average?: number;
  };
  title?: string;
}

interface MoviesGridProps {
  movies: Movie[];
}

export default function MoviesGrid({ movies }: MoviesGridProps) {
  const [watchHistory, setWatchHistory] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWatchHistory();
  }, []);

  const loadWatchHistory = async () => {
    try {
      const history = await getWatchHistory();

      // Criar um mapa por tmdb_id para busca rápida
      const historyMap = new Map();
      history.forEach((item: any) => {
        if (item.tmdb_id) {
          historyMap.set(String(item.tmdb_id), item);
        }
      });

      setWatchHistory(historyMap);
    } catch (error) {
      console.log('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {movies.map((movie) => {
        const tmdbId = movie.tmdbData?.id ? String(movie.tmdbData.id) : null;
        const history = tmdbId ? watchHistory.get(tmdbId) : null;

        if (history) {
          console.log(`Filme com histórico: ${movie.tmdbData?.title}, tmdbId: ${tmdbId}`);
        }

        return (
          <MovieCard
            key={movie.fileName}
            fileName={movie.fileName}
            tmdbData={movie.tmdbData}
            title={movie.title}
            watchHistory={history}
          />
        );
      })}
    </div>
  );
}
