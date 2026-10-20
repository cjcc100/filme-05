'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import SearchBar from "../../components/SearchBar";
import UserMenu from "../../components/UserMenu";
import { getWatchHistory } from "../../lib/history";
import { createClient } from '@base44/sdk';
import { getMovieDataWithCache } from '../../lib/tmdbCache';

const base44 = createClient({ appId: "6ad60db65ef6337559a9c1dc" });

// CJCCHUB - Plataforma de Streaming
// Autor: juniorclaudinei350-sketch
// Email: juniorclaudinei350@gmail.com

export default function MinhaLista() {
  const [watchedMovies, setWatchedMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthAndLoadHistory();
  }, []);

  const checkAuthAndLoadHistory = async () => {
    setLoading(true);

    // Verificar se está autenticado
    const token = localStorage.getItem('base44_access_token');
    console.log('Token no localStorage:', token ? 'Presente' : 'Ausente');

    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      const user = await base44.auth.me();
      console.log('Usuário autenticado:', user);
      setIsAuthenticated(true);

      // Carregar histórico
      const history = await getWatchHistory();
      console.log('Histórico carregado:', history);

      // Para cada filme, buscar dados do TMDb se não tiver capa
      const enrichedHistory = await Promise.all(
        history.map(async (movie: any) => {
          console.log('Processando filme:', movie.titulo, 'tem capa:', !!movie.capa_url, 'tmdb_id:', movie.tmdb_id);

          if (!movie.capa_url && movie.tmdb_id) {
            try {
              const tmdbData = await getMovieDataWithCache(movie.tmdb_id);
              console.log('Dados TMDb para', movie.tmdb_id, ':', tmdbData?.poster_path);

              if (tmdbData?.poster_path) {
                const capaUrl = `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`;
                console.log('Capa encontrada:', capaUrl);

                // Atualizar o registro no Base44 com a capa
                // Isso evita ter que buscar sempre
                // (opcional - pode comentar se não quiser salvar no banco)
                // await updateMovieCover(movie.id, capaUrl);

                return {
                  ...movie,
                  capa_url: capaUrl
                };
              }
            } catch (error) {
              console.log('Erro ao buscar capa do TMDb:', error);
            }
          }
          return movie;
        })
      );

      console.log('Histórico enriquecido:', enrichedHistory);
      setWatchedMovies(enrichedHistory);
    } catch (error) {
      console.log('Usuário não autenticado:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      <header className="sticky top-0 z-50 bg-zinc-900/30 backdrop-blur-md border-b border-zinc-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-white font-semibold text-lg">CJCCHUB</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-zinc-300 hover:text-white transition-colors">Início</Link>
              <Link href="/" className="text-zinc-300 hover:text-white transition-colors">Filmes</Link>
              <Link href="/series" className="text-zinc-300 hover:text-white transition-colors">Séries</Link>
              <Link href="/minha-lista" className="text-white font-semibold transition-colors">Minha Lista</Link>
            </nav>
            <div className="flex items-center gap-4">
              <SearchBar movies={[]} />
              <UserMenu key="user-menu" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Minha Lista</h1>
          <p className="text-zinc-400">Histórico de filmes que você assistiu</p>
        </div>

        {/* TODO: Implementar filtros (Todos, Filmes, Séries, Assistidos recentemente) */}
        <div className="flex gap-4 mb-8">
          <button className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium">
            Todos
          </button>
          <button className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg font-medium hover:bg-zinc-700 transition-colors">
            Filmes
          </button>
          <button className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg font-medium hover:bg-zinc-700 transition-colors">
            Séries
          </button>
          <button className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg font-medium hover:bg-zinc-700 transition-colors">
            Recentes
          </button>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-zinc-400">Carregando seu histórico...</p>
          </div>
        ) : !isAuthenticated ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-12 h-12 text-zinc-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Faça login para ver seu histórico
            </h3>
            <p className="text-zinc-400 text-center mb-6">
              Você precisa estar logado para ver sua lista de filmes assistidos
            </p>
            <div className="flex gap-4">
              <Link
                href="/planos"
                className="px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                Fazer Login
              </Link>
              <Link
                href="/"
                className="px-6 py-3 bg-zinc-700 text-white rounded-lg font-medium hover:bg-zinc-600 transition-colors"
              >
                Explorar Filmes
              </Link>
            </div>
          </div>
        ) : watchedMovies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-12 h-12 text-zinc-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Sua lista está vazia
            </h3>
            <p className="text-zinc-400 text-center mb-6">
              Comece a assistir filmes e eles aparecerão aqui
            </p>
            <Link
              href="/"
              className="px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              Explorar Filmes
            </Link>
          </div>
        ) : (
          // Grid de filmes assistidos
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {watchedMovies.map((movie: any) => {
              const progresso = movie.duracao_total > 0
                ? (movie.posicao_segundos / movie.duracao_total) * 100
                : 0;

              const statusBadge = movie.status === 'assistido'
                ? 'bg-green-500/20 text-green-400'
                : movie.status === 'assistindo'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-zinc-500/20 text-zinc-400';

              const statusText = movie.status === 'assistido'
                ? 'Concluído'
                : movie.status === 'assistindo'
                ? 'Assistindo'
                : 'Não iniciado';

              const ultimaAcesso = movie.ultimo_acesso
                ? new Date(movie.ultimo_acesso).toLocaleDateString('pt-BR')
                : 'N/A';

              return (
                <Link
                  key={movie.id}
                  href={movie.tmdb_id ? `/movie/${movie.tmdb_id}` : '#'}
                  className="group relative bg-zinc-800 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/20"
                >
                  <div className="relative aspect-[2/3] overflow-hidden">
                    {movie.capa_url ? (
                      <Image
                        src={movie.capa_url}
                        alt={movie.titulo}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-700 flex items-center justify-center">
                        <span className="text-zinc-500 text-sm">Sem imagem</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className={`absolute top-2 right-2 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded ${statusBadge}`}>
                      {statusText}
                    </div>
                    {/* Barra de progresso */}
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
                      {movie.titulo}
                    </h3>
                    <p className="text-zinc-400 text-xs">
                      {progresso >= 90 ? 'Concluído' : `${Math.floor(progresso)}% assistido`}
                    </p>
                    <p className="text-zinc-500 text-xs mt-1">
                      Último acesso: {ultimaAcesso}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <footer className="bg-zinc-900 border-t border-zinc-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <span className="text-white font-semibold text-lg">CJCCHUB</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Sua plataforma de streaming favorita
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Navegação</h4>
              <ul className="space-y-2">
                <li><a href="/" className="text-zinc-400 hover:text-white text-sm transition-colors">Início</a></li>
                <li><a href="/" className="text-zinc-400 hover:text-white text-sm transition-colors">Filmes</a></li>
                <li><a href="/series" className="text-zinc-400 hover:text-white text-sm transition-colors">Séries</a></li>
                <li><a href="/minha-lista" className="text-white text-sm transition-colors">Minha Lista</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Ajuda</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">FAQ</a></li>
                <li><a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">Suporte</a></li>
                <li><a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">Contato</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">Termos</a></li>
                <li><a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">Privacidade</a></li>
                <li><a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">Ajuda</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-zinc-800 mt-8 pt-8 text-center">
            <p className="text-zinc-400 text-sm">
              © 2024 CJCCHUB. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
