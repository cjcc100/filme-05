'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import VideoPlayer from './VideoPlayer';

interface MovieData {
  id: number;
  title?: string;
  name?: string; // Para séries
  original_title?: string;
  original_name?: string; // Para séries
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date?: string;
  first_air_date?: string; // Para séries
  vote_average: number;
  vote_count: number;
  genres?: Array<{
    id: number;
    name: string;
  }>;
  runtime?: number;
  tagline?: string;
  budget?: number;
  revenue?: number;
  production_companies?: Array<{
    id: number;
    name: string;
    logo_path?: string;
  }>;
  production_countries?: Array<{
    iso_3166_1: string;
    name: string;
  }>;
  spoken_languages?: Array<{
    english_name: string;
    iso_639_1: string;
    name: string;
  }>;
}

interface MovieClientProps {
  movieData: MovieData;
  fileId: string | null;
}

export default function MovieClient({ movieData, fileId }: MovieClientProps) {
  const [showPlayer, setShowPlayer] = useState(false);

  if (!movieData) return null;

  const title = movieData.title || movieData.name || movieData.original_title || movieData.original_name || 'Sem título';
  const year = movieData.release_date?.split('-')[0] || movieData.first_air_date?.split('-')[0] || 'N/A';
  const rating = movieData.vote_average?.toFixed(1) || 'N/A';
  const duration = movieData.runtime ? `${Math.floor(movieData.runtime / 60)}h ${movieData.runtime % 60}m` : 'N/A';
  const genres = movieData.genres?.map(g => g.name).join(', ') || 'N/A';
  const voteCount = movieData.vote_count?.toLocaleString() || '0';
  
  // Verificar se é série (tem name) ou filme (tem title)
  const isTV = !!movieData.name;
  
  const backdropUrl = movieData.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movieData.backdrop_path}`
    : null;
    
  const posterUrl = movieData.poster_path
    ? `https://image.tmdb.org/t/p/w500${movieData.poster_path}`
    : null;

  const budget = movieData.budget ? `$${movieData.budget.toLocaleString()}` : 'N/A';
  const revenue = movieData.revenue ? `$${movieData.revenue.toLocaleString()}` : 'N/A';

  return (
    <>
      {showPlayer && fileId && (
        <VideoPlayer 
          fileId={fileId} 
          onClose={() => setShowPlayer(false)} 
        />
      )}
      
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
        <header className="sticky top-0 z-50 bg-zinc-900/30 backdrop-blur-md border-b border-zinc-800/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <span className="text-white font-semibold text-lg">CJCCHUB</span>
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/" className="text-zinc-300 hover:text-white transition-colors">Início</Link>
                <Link href="/#filmes" className="text-zinc-300 hover:text-white transition-colors">Filmes</Link>
                <Link href="/#series" className="text-zinc-300 hover:text-white transition-colors">Séries</Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {/* Header do Filme - Netflix Style */}
          <section className="relative h-[70vh] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/70 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-900/50 to-transparent z-10" />
            
            {backdropUrl ? (
              <Image
                src={backdropUrl}
                alt={title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-zinc-800" />
            )}
            
            <div className="absolute bottom-0 left-0 right-0 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
              <div className="flex gap-8 items-end">
                {posterUrl && (
                  <div className="hidden md:block w-48 h-72 rounded-lg overflow-hidden shadow-2xl">
                    <Image
                      src={posterUrl}
                      alt={title}
                      width={192}
                      height={288}
                      className="object-cover"
                    />
                  </div>
                )}
                
                <div className="flex-1">
                  <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                    {title}
                  </h1>
                  
                  {movieData.tagline && (
                    <p className="text-zinc-400 text-lg mb-4 italic">
                      {movieData.tagline}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    {isTV && (
                      <div className="bg-purple-600 text-white text-xs px-2 py-1 rounded">
                        Série
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 font-bold">{rating}</span>
                      <span className="text-zinc-400">Avaliação</span>
                    </div>
                    
                    <span className="text-zinc-400">•</span>
                    
                    <span className="text-zinc-300">{year}</span>
                    
                    {duration !== 'N/A' && (
                      <>
                        <span className="text-zinc-400">•</span>
                        <span className="text-zinc-300">{duration}</span>
                      </>
                    )}
                    
                    <span className="text-zinc-400">•</span>
                    
                    <span className="text-zinc-300">{genres}</span>
                  </div>
                  
                  <div className="flex gap-4">
                    {fileId ? (
                      <button 
                        onClick={() => setShowPlayer(true)}
                        className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-red-700 hover:to-orange-600 transition-all duration-300 flex items-center gap-2 hover:scale-105 hover:shadow-lg hover:shadow-red-500/50"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        Assistir
                      </button>
                    ) : (
                      <button 
                        disabled
                        className="bg-zinc-600 text-zinc-400 px-8 py-3 rounded-lg font-semibold cursor-not-allowed flex items-center gap-2"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        Indisponível
                      </button>
                    )}
                    
                    <button className="bg-zinc-600/80 text-white px-8 py-3 rounded-lg font-semibold hover:bg-zinc-600 transition-colors flex items-center gap-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                      </svg>
                      Minha Lista
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Sinopse */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <h2 className="text-2xl font-bold text-white mb-4">Sinopse</h2>
                <p className="text-zinc-300 text-lg leading-relaxed">
                  {movieData.overview || 'Sinopse não disponível.'}
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-zinc-400 text-sm mb-1">Avaliação</h3>
                  <p className="text-white font-semibold">{rating} / 10</p>
                  <p className="text-zinc-400 text-sm">{voteCount} votos</p>
                </div>
                
                <div>
                  <h3 className="text-zinc-400 text-sm mb-1">Duração</h3>
                  <p className="text-white font-semibold">{duration}</p>
                </div>
                
                <div>
                  <h3 className="text-zinc-400 text-sm mb-1">Gêneros</h3>
                  <p className="text-white font-semibold">{genres}</p>
                </div>
                
                <div>
                  <h3 className="text-zinc-400 text-sm mb-1">Lançamento</h3>
                  <p className="text-white font-semibold">{year}</p>
                </div>
                
                {movieData.budget && (
                  <div>
                    <h3 className="text-zinc-400 text-sm mb-1">Orçamento</h3>
                    <p className="text-white font-semibold">{budget}</p>
                  </div>
                )}
                
                {movieData.revenue && (
                  <div>
                    <h3 className="text-zinc-400 text-sm mb-1">Receita</h3>
                    <p className="text-white font-semibold">{revenue}</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Empresas de Produção */}
          {movieData.production_companies && movieData.production_companies.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <h2 className="text-2xl font-bold text-white mb-6">Empresas de Produção</h2>
              <div className="flex flex-wrap gap-4">
                {movieData.production_companies.map((company) => (
                  <div key={company.id} className="bg-zinc-800/50 rounded-lg p-4 flex items-center gap-4">
                    {company.logo_path && (
                      <Image
                        src={`https://image.tmdb.org/t/p/w200${company.logo_path}`}
                        alt={company.name}
                        width={50}
                        height={50}
                        className="object-contain"
                      />
                    )}
                    <span className="text-white font-medium">{company.name}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Países de Produção */}
          {movieData.production_countries && movieData.production_countries.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <h2 className="text-2xl font-bold text-white mb-6">Países de Produção</h2>
              <div className="flex flex-wrap gap-2">
                {movieData.production_countries.map((country, index) => (
                  <span key={index} className="bg-zinc-800/50 text-zinc-300 px-3 py-1 rounded-full text-sm">
                    {country.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Idiomas */}
          {movieData.spoken_languages && movieData.spoken_languages.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <h2 className="text-2xl font-bold text-white mb-6">Idiomas</h2>
              <div className="flex flex-wrap gap-2">
                {movieData.spoken_languages.map((lang, index) => (
                  <span key={index} className="bg-zinc-800/50 text-zinc-300 px-3 py-1 rounded-full text-sm">
                    {lang.english_name}
                  </span>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  );
}