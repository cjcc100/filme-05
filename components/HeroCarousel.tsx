'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Movie {
  id?: number;
  guid?: string;
  title?: string;
  name?: string;
  originalFilename?: string;
  overview?: string;
  description?: string;
  backdrop_path?: string;
  poster_path?: string;
  thumbnailUrl?: string;
  thumbnail?: string;
  posterUrl?: string;
  tmdbData?: {
    id?: number;
    title?: string;
    name?: string;
    overview?: string;
    backdrop_path?: string;
    poster_path?: string;
  };
}

interface HeroCarouselProps {
  movies: Movie[];
}

export default function HeroCarousel({ movies }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [movies.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % movies.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (!movies || movies.length === 0) {
    return null;
  }

  const currentMovie = movies[currentIndex];
  const tmdbData = currentMovie?.tmdbData;
  
  // Prioridade: TMDb backdrop -> TMDb poster -> Cor sólida se não tiver
  const imageUrl = tmdbData?.backdrop_path
    ? `https://image.tmdb.org/t/p/original${tmdbData.backdrop_path}`
    : tmdbData?.poster_path
    ? `https://image.tmdb.org/t/p/original${tmdbData.poster_path}`
    : null;

  const title = tmdbData?.title || tmdbData?.name || currentMovie?.title || currentMovie?.name || currentMovie?.originalFilename || 'Sem título';
  const overview = tmdbData?.overview || currentMovie?.description || currentMovie?.overview || 'Filme disponível para assistir';

  return (
    <section className="relative h-[600px] md:h-[700px] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent z-10" />
      
      {/* Carousel Slides */}
      <div className="relative h-full">
        {movies.map((movie, index) => {
          const isActive = index === currentIndex;
          const movieTmdbData = movie.tmdbData;
          
          const movieImageUrl = movieTmdbData?.backdrop_path
            ? `https://image.tmdb.org/t/p/original${movieTmdbData.backdrop_path}`
            : movieTmdbData?.poster_path
            ? `https://image.tmdb.org/t/p/original${movieTmdbData.poster_path}`
            : null;

          return (
            <div
              key={movie.guid || movie.id}
              className={`absolute inset-0 transition-opacity duration-500 ${
                isActive ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {movieImageUrl ? (
                <Image
                  src={movieImageUrl}
                  alt={movieTmdbData?.title || movieTmdbData?.name || movie.title || movie.name || movie.originalFilename || 'Filme'}
                  fill
                  className="object-cover object-center"
                  priority={isActive}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-red-900 via-zinc-800 to-zinc-900" />
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dots Navigation */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {movies.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentIndex ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Movie Info */}
      <div className="absolute bottom-0 left-0 right-0 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-2xl">
          <span className="inline-block bg-red-600 text-white text-sm font-medium px-3 py-1 rounded-full mb-4">
            Destaque
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {title}
          </h1>
          <p className="text-zinc-300 text-lg mb-6 line-clamp-3">
            {overview}
          </p>
          <div className="flex gap-4">
            {tmdbData?.id ? (
              <Link 
                href={`/movie/${tmdbData.id}`}
                className="bg-white text-zinc-900 px-6 py-3 rounded-lg font-semibold hover:bg-zinc-100 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                Assistir
              </Link>
            ) : (
              <button className="bg-white text-zinc-900 px-6 py-3 rounded-lg font-semibold hover:bg-zinc-100 transition-colors flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                Assistir
              </button>
            )}
            <button className="bg-zinc-600/80 text-white px-6 py-3 rounded-lg font-semibold hover:bg-zinc-600 transition-colors flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Minha Lista
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}