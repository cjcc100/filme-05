'use client';

import Image from 'next/image';
import Link from 'next/link';

interface MovieCardProps {
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
  watchHistory?: {
    posicao_segundos: number;
    duracao_total: number;
    status: 'assistindo' | 'assistido' | 'nao_assistido';
  };
}

export default function MovieCard({ fileName, tmdbData, title, watchHistory }: MovieCardProps) {
  const imageUrl = tmdbData?.poster_path
    ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`
    : tmdbData?.backdrop_path
    ? `https://image.tmdb.org/t/p/w500${tmdbData.backdrop_path}`
    : null;

  const movieTitle = tmdbData?.title || tmdbData?.name || title || 'Sem título';
  const year = tmdbData?.release_date?.split('-')[0] || 'N/A';
  const rating = tmdbData?.vote_average?.toFixed(1) || 'N/A';
  const movieLink = tmdbData?.id ? `/movie/${tmdbData.id}` : '#';

  // Calcular progresso se tiver histórico
  const progresso = watchHistory && watchHistory.duracao_total > 0
    ? (watchHistory.posicao_segundos / watchHistory.duracao_total) * 100
    : 0;

  const statusBadge = watchHistory?.status === 'assistido'
    ? 'bg-green-500/20 text-green-400'
    : watchHistory?.status === 'assistindo'
    ? 'bg-yellow-500/20 text-yellow-400'
    : null;

  const statusText = watchHistory?.status === 'assistido'
    ? 'Concluído'
    : watchHistory?.status === 'assistindo'
    ? 'Assistindo'
    : null;

  return (
    <Link
      href={movieLink}
      className="group relative bg-zinc-800 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/20"
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={movieTitle}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-zinc-700 flex items-center justify-center">
            <span className="text-zinc-500 text-sm">Sem imagem</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badge de status se estiver assistindo/concluído */}
        {statusBadge && statusText && (
          <div className={`absolute top-2 left-2 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded ${statusBadge}`}>
            {statusText}
          </div>
        )}

        {/* Rating */}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-sm font-bold px-2 py-1 rounded">
          {rating}
        </div>

        {/* Barra de progresso se estiver assistindo */}
        {progresso > 0 && progresso < 100 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-700">
            <div
              className="h-full bg-red-500 transition-all duration-300"
              style={{ width: `${progresso}%` }}
            />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-white font-semibold text-sm mb-1 line-clamp-1">
          {movieTitle}
        </h3>
        <p className="text-zinc-400 text-xs">{year}</p>
        {progresso > 0 && (
          <p className="text-zinc-500 text-xs mt-1">
            {progresso >= 90 ? 'Concluído' : `${Math.floor(progresso)}% assistido`}
          </p>
        )}
      </div>
    </Link>
  );
}
