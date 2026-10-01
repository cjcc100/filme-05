"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface Movie {
  linkid?: string;
  id?: string;
  tmdbData?: any;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  year?: string;
  vote_average?: number;
  description?: string;
  overview?: string;
}

interface MovieGridProps {
  movies: Movie[];
  moviesPerPage?: number;
}

export default function MovieGrid({ movies, moviesPerPage = 20 }: MovieGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [displayedMovies, setDisplayedMovies] = useState<Movie[]>([]);

  const totalPages = Math.ceil(movies.length / moviesPerPage);
  const startIndex = (currentPage - 1) * moviesPerPage;
  const endIndex = startIndex + moviesPerPage;
  const paginatedMovies = movies.slice(startIndex, endIndex);

  useEffect(() => {
    setDisplayedMovies(paginatedMovies);
  }, [movies, currentPage, paginatedMovies]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      // Salvar posição do scroll
      const scrollPosition = window.scrollY;
      
      setCurrentPage(newPage);
      
      // Restaurar posição do scroll após a mudança de página
      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 100);
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {displayedMovies.map((movie: any, index: number) => {
          const isStreamtape = movie.linkid;
          const tmdbData = movie.tmdbData;
          
          const imageUrl = tmdbData?.poster_path
            ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`
            : tmdbData?.backdrop_path
            ? `https://image.tmdb.org/t/p/w500${tmdbData.backdrop_path}`
            : null;
          
          const title = tmdbData?.title || tmdbData?.name || movie.title || movie.name || 'Sem título';
          const year = tmdbData?.release_date?.split('-')[0] || tmdbData?.first_air_date?.split('-')[0] || movie.release_date?.split('-')[0] || movie.year || 'N/A';
          const rating = tmdbData?.vote_average?.toFixed(1) || movie.vote_average?.toFixed(1) || 'N/A';
          const description = tmdbData?.overview || movie.description || movie.overview || 'Filme disponível para assistir';
          const isTV = !!tmdbData?.name;

          const movieLink = tmdbData?.id ? `/movie/${tmdbData.id}` : (movie.linkid ? `/movie/${movie.linkid}` : '#');

          return (
            <Link
              key={movie.linkid || movie.id || index}
              href={movieLink}
              className="group relative bg-zinc-800 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/20"
            >
              <div className="relative aspect-[2/3] overflow-hidden">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-700 flex items-center justify-center">
                    <span className="text-zinc-500 text-sm">Sem imagem</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {isTV && (
                  <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">
                    Série
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-sm font-bold px-2 py-1 rounded">
                  {rating}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-white font-semibold text-sm mb-1 line-clamp-1">
                  {title}
                </h3>
                <p className="text-zinc-400 text-xs">{year}</p>
              </div>
            </Link>
          );
        })}
      </div>
      
      {/* Controles de Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          {currentPage > 1 ? (
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              className="px-4 py-2 rounded-lg font-medium transition-colors bg-red-600 hover:bg-red-700 text-white"
            >
              Anterior
            </button>
          ) : (
            <span className="px-4 py-2 rounded-lg font-medium bg-zinc-700 text-zinc-400 cursor-not-allowed">
              Anterior
            </span>
          )}
          
          <span className="text-white font-medium">
            Página {currentPage} de {totalPages}
          </span>
          
          {currentPage < totalPages ? (
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              className="px-4 py-2 rounded-lg font-medium transition-colors bg-red-600 hover:bg-red-700 text-white"
            >
              Próxima
            </button>
          ) : (
            <span className="px-4 py-2 rounded-lg font-medium bg-zinc-700 text-zinc-400 cursor-not-allowed">
              Próxima
            </span>
          )}
        </div>
      )}
    </div>
  );
}