'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Movie {
  fileName: string;
  tmdbData: any;
  id: number | undefined;
  title: string;
  description: string;
}

interface SearchBarProps {
  movies: Movie[];
}

export default function SearchBar({ movies }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setFilteredMovies([]);
      setIsSearching(false);
      return;
    }

    const filtered = movies.filter((movie) => {
      const title = movie.tmdbData?.title || movie.title || '';
      const originalTitle = movie.tmdbData?.original_title || '';
      const fileName = movie.fileName;
      
      const searchLower = query.toLowerCase();
      return (
        title.toLowerCase().includes(searchLower) ||
        originalTitle.toLowerCase().includes(searchLower) ||
        fileName.toLowerCase().includes(searchLower)
      );
    });

    setFilteredMovies(filtered);
    setIsSearching(true);
  };

  const closeSearch = () => {
    setSearchQuery('');
    setFilteredMovies([]);
    setIsSearching(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar filmes..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full md:w-96 bg-zinc-800/50 border border-zinc-700 text-white placeholder-zinc-400 px-4 py-2 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {searchQuery && (
          <button
            onClick={closeSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isSearching && filteredMovies.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50">
          {filteredMovies.map((movie) => {
            const tmdbData = movie.tmdbData;
            const imageUrl = tmdbData?.poster_path
              ? `https://image.tmdb.org/t/p/w200${tmdbData.poster_path}`
              : null;
            const title = tmdbData?.title || tmdbData?.name || movie.title || 'Sem título';
            const year = tmdbData?.release_date?.split('-')[0] || 'N/A';
            const movieLink = tmdbData?.id ? `/movie/${tmdbData.id}` : '#';

            return (
              <Link
                key={movie.fileName}
                href={movieLink}
                onClick={closeSearch}
                className="flex items-center gap-4 p-3 hover:bg-zinc-700/50 transition-colors border-b border-zinc-700 last:border-0"
              >
                {imageUrl ? (
                  <div className="relative w-12 h-16 flex-shrink-0">
                    <Image
                      src={imageUrl}
                      alt={title}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-16 bg-zinc-700 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-zinc-500 text-xs">Sem img</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium text-sm truncate">{title}</h4>
                  <p className="text-zinc-400 text-xs">{year}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {isSearching && filteredMovies.length === 0 && searchQuery.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl p-4 z-50">
          <p className="text-zinc-400 text-sm text-center">Nenhum filme encontrado</p>
        </div>
      )}
    </div>
  );
}
