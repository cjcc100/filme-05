"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface Series {
  id: string;
  name: string;
  tmdbData?: any;
  detectedSeason?: number;
}

interface SeriesGridProps {
  series: Series[];
  seriesPerPage?: number;
}

export default function SeriesGrid({ series, seriesPerPage = 20 }: SeriesGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedSeries, setDisplayedSeries] = useState<Series[]>([]);

  const totalPages = Math.ceil(series.length / seriesPerPage);
  const startIndex = (currentPage - 1) * seriesPerPage;
  const endIndex = startIndex + seriesPerPage;
  const paginatedSeries = series.slice(startIndex, endIndex);

  useEffect(() => {
    setIsTransitioning(true);
    
    // Timeout para a animação de saída
    setTimeout(() => {
      setDisplayedSeries(paginatedSeries);
      setIsTransitioning(false);
    }, 300);
  }, [currentPage, paginatedSeries]);

  useEffect(() => {
    setDisplayedSeries(paginatedSeries);
  }, [series]);

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
      <div 
        className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 transition-all duration-300 ${
          isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}
      >
        {displayedSeries.map((folder: any, index: number) => {
          const tmdbData = folder.tmdbData;
          const seriesData = tmdbData?.series;
          const seasonData = tmdbData?.season;
          const detectedSeason = folder.detectedSeason || 1;
          
          // Usar poster da temporada específica se disponível, senão usar poster da série
          const imageUrl = seasonData?.poster_path
            ? `https://image.tmdb.org/t/p/w500${seasonData.poster_path}`
            : seriesData?.poster_path
            ? `https://image.tmdb.org/t/p/w500${seriesData.poster_path}`
            : seriesData?.backdrop_path
            ? `https://image.tmdb.org/t/p/w500${seriesData.backdrop_path}`
            : null;
          
          const title = seriesData?.name || folder.name || 'Sem título';
          const year = seriesData?.first_air_date?.split('-')[0] || 'N/A';
          const rating = seriesData?.vote_average?.toFixed(1) || 'N/A';
          const overview = seriesData?.overview || 'Sem descrição';

          return (
            <Link
              key={folder.id}
              href={`/collection/${folder.id}`}
              className="group relative bg-zinc-800 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/20"
              style={{
                animationDelay: `${index * 50}ms`,
              }}
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
                <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">
                  Temporada {detectedSeason}
                </div>
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