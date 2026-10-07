"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  movies?: any[];
  series?: any[];
}

export default function SearchBar({ movies = [], series = [] }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.length > 0) {
      // Combinar filmes e séries para sugestões
      const allItems = [...movies, ...series];
      const filtered = allItems.filter((item: any) => {
        const title = item.title || item.name || item.tmdbData?.title || item.tmdbData?.name || item.tmdbData?.series?.name || '';
        return title.toLowerCase().includes(value.toLowerCase());
      }).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (item: any) => {
    const tmdbId = item.tmdbData?.id || item.id;
    const linkid = item.id || item.linkid || item.folder?.id;
    const mediaType = item.tmdbData?.media_type || item.media_type;
    const title = item.title || item.name || item.tmdbData?.title || item.tmdbData?.name || item.tmdbData?.series?.name || '';
    
    // Se tiver linkid (é uma série no site), vai para collection
    if (linkid) {
      router.push(`/collection/${linkid}`);
    }
    // Se tiver ID do TMDb e for filme, vai para movie
    else if (tmdbId && mediaType !== 'tv' && !item.tmdbData?.series) {
      router.push(`/movie/${tmdbId}`);
    }
    // Se não tiver linkid nem ID, vai para busca
    else {
      router.push(`/search?q=${encodeURIComponent(title)}`);
    }
    
    setShowSuggestions(false);
    setQuery("");
  };

  return (
    <div className="relative w-full max-w-2xl">
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
          placeholder="Buscar filmes e séries..."
          className="w-full px-4 py-3 pl-12 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
        />
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400"
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
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          Buscar
        </button>
      </form>

      {/* Sugestões de busca */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          {suggestions.map((item: any, index: number) => {
            const title = item.title || item.name || item.tmdbData?.title || item.tmdbData?.name || item.tmdbData?.series?.name || 'Sem título';
            const imageUrl = item.tmdbData?.poster_path || item.tmdbData?.series?.poster_path
              ? `https://image.tmdb.org/t/p/w92${item.tmdbData.poster_path || item.tmdbData.series?.poster_path}`
              : item.tmdbData?.backdrop_path || item.tmdbData?.series?.backdrop_path
              ? `https://image.tmdb.org/t/p/w92${item.tmdbData.backdrop_path || item.tmdbData.series?.backdrop_path}`
              : null;
            
            return (
              <button
                key={index}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleSuggestionClick(item);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSuggestionClick(item);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-700 transition-colors text-left"
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={title}
                    className="w-12 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-16 bg-zinc-700 rounded flex items-center justify-center">
                    <span className="text-zinc-500 text-xs">Sem img</span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-white font-medium">{title}</p>
                  <p className="text-zinc-400 text-sm">
                    {item.tmdbData?.release_date?.split('-')[0] || item.tmdbData?.first_air_date?.split('-')[0] || item.tmdbData?.series?.first_air_date?.split('-')[0] || 'N/A'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}