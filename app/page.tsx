import Image from "next/image";
import Link from "next/link";
import HeroCarousel from "../components/HeroCarousel";
import { config } from "@/lib/config";
import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// CJCCHUB - Plataforma de Streaming
// Autor: juniorclaudinei350-sketch
// Email: juniorclaudinei350@gmail.com

async function getStreamtapeFiles() {
  try {
    const streamtapeLogin = config.streamtape.login;
    const streamtapeKey = config.streamtape.key;
    
    const res = await fetch(`${config.streamtape.apiUrl}/file/listfolder?login=${streamtapeLogin}&key=${streamtapeKey}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 300 } // Cache de 5 minutos para pegar novos uploads
    });
    if (!res.ok) return null;
    
    const data = await res.json();
    if (data.status !== 200 || !data.result?.files) return null;
    
    console.log('Streamtape files found:', data.result.files.length);
    return data.result;
  } catch (error) {
    console.error('Error fetching Streamtape files:', error);
    return null;
  }
}

// Mapeamento manual para filmes que dão problema na busca automática (backup)
const MANUAL_MAPPING: Record<string, number> = {
  'gigantes de aço': 39254,
  'gigantes de aco': 39254,
  'quarteto fantastico': 617126,
  'quarteto fantastico primeiros passos': 617126,
  'a ultima casa': 1284041,
  'ultima casa': 1284041,
  'avenida brasil': 45815,
};

async function searchTMDBTV(query: string) {
  try {
    const tmdbApiKey = config.tmdb.apiKey;
    
    console.log('Searching TMDb TV for:', query);
    
    const searchRes = await fetch(`${config.tmdb.baseUrl}/search/tv?api_key=${tmdbApiKey}&language=pt-BR&query=${encodeURIComponent(query)}`, {
      next: { revalidate: 600 }
    });
    
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.results && searchData.results.length > 0) {
        console.log('TMDb TV found:', searchData.results[0].name);
        return searchData.results[0];
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error searching TMDb TV:', error);
    return null;
  }
}

async function searchTMDBMovie(query: string) {
  try {
    const tmdbApiKey = config.tmdb.apiKey;
    
    console.log('Original query:', query);
    
    // Função melhorada de limpeza de nome com remoção de acentos
    function cleanFileName(filename: string): string {
      return filename
        .split('.')[0] // Remover extensão (tudo após o primeiro ponto)
        .replace(/\d{4}/g, '') // Remover anos de 4 dígitos
        .replace(/\[.*?\]/g, '') // Remover conteúdo entre colchetes
        .replace(/\(.*?\)/g, '') // Remover conteúdo entre parênteses
        .replace(/[._-]/g, ' ') // Substituir separadores por espaço
        .replace(/\s+/g, ' ') // Remover espaços extras
        .normalize('NFD') // Normalizar caracteres acentuados
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .trim();
    }
    
    // Verificar mapeamento manual primeiro (backup)
    const variations = [
      query.toLowerCase(),
      query.toLowerCase().replace(/\.[^/.]+$/, ''),
      query.toLowerCase().replace(/\d{4}/g, ''),
      query.toLowerCase().replace(/[._-]/g, ' '),
      query.toLowerCase().replace(/\.[^/.]+$/, '').replace(/\d{4}/g, '').replace(/[._-]/g, ' ').replace(/\s+/g, ' ').trim(),
      query.toLowerCase().replace(/\.[^/.]+$/, '').replace(/[._-]/g, ' ').replace(/\s+/g, ' ').trim(),
    ];
    
    for (const variation of variations) {
      const trimmed = variation.trim();
      if (MANUAL_MAPPING[trimmed]) {
        const tmdbId = MANUAL_MAPPING[trimmed];
        console.log('Found manual mapping for:', trimmed, '-> TMDb ID:', tmdbId);
        
        const movieRes = await fetch(`${config.tmdb.baseUrl}/movie/${tmdbId}?api_key=${tmdbApiKey}&language=pt-BR`, {
          next: { revalidate: 3600 }
        });
        
        if (movieRes.ok) {
          const movieData = await movieRes.json();
          console.log('Retrieved movie data from manual mapping:', movieData.title);
          return movieData;
        }
      }
    }
    
    // Primeira tentativa: limpeza completa sem acentos
    let cleanQuery = cleanFileName(query);
    
    console.log('Clean query (attempt 1):', cleanQuery);
    
    if (cleanQuery.length < 3) return null;
    
    console.log('Searching TMDb (attempt 1):', cleanQuery);
    
    let searchRes = await fetch(`${config.tmdb.baseUrl}/search/movie?api_key=${tmdbApiKey}&language=pt-BR&query=${encodeURIComponent(cleanQuery)}`, {
      next: { revalidate: 600 }
    });
    
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.results && searchData.results.length > 0) {
        console.log('TMDb found (attempt 1):', searchData.results[0].title);
        return searchData.results[0];
      }
    }
    
    // Segunda tentativa: busca mais permissiva com acentos originais
    cleanQuery = query
      .replace(/\.[^/.]+$/, '')
      .replace(/[._-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log('Clean query (attempt 2):', cleanQuery);
    
    if (cleanQuery.length < 3) return null;
    
    console.log('Searching TMDb (attempt 2):', cleanQuery);
    
    searchRes = await fetch(`${config.tmdb.baseUrl}/search/movie?api_key=${tmdbApiKey}&language=pt-BR&query=${encodeURIComponent(cleanQuery)}`, {
      next: { revalidate: 600 }
    });
    
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.results && searchData.results.length > 0) {
        console.log('TMDb found (attempt 2):', searchData.results[0].title);
        return searchData.results[0];
      }
    }
    
    // Terceira tentativa: apenas primeiras palavras principais sem acentos
    const words = query.split(/[._-]/).filter(w => w.length > 2);
    if (words.length >= 2) {
      cleanQuery = words.slice(0, 3).join(' ')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
      
      console.log('Clean query (attempt 3):', cleanQuery);
      
      console.log('Searching TMDb (attempt 3):', cleanQuery);
      
      searchRes = await fetch(`${config.tmdb.baseUrl}/search/movie?api_key=${tmdbApiKey}&language=pt-BR&query=${encodeURIComponent(cleanQuery)}`, {
        next: { revalidate: 600 }
      });
      
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.results && searchData.results.length > 0) {
          console.log('TMDb found (attempt 3):', searchData.results[0].title);
          return searchData.results[0];
        }
      }
    }
    
    // Quarta tentativa: remover palavras comuns como "Primeiros Passos"
    const cleanQueryExtra = cleanFileName(query)
      .replace(/primeiros passos/gi, '')
      .replace(/passos/gi, '')
      .replace(/o a/gi, '')
      .replace(/a o/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log('Clean query (attempt 4):', cleanQueryExtra);
    
    if (cleanQueryExtra.length >= 3 && cleanQueryExtra !== cleanFileName(query)) {
      console.log('Searching TMDb (attempt 4):', cleanQueryExtra);
      
      searchRes = await fetch(`${config.tmdb.baseUrl}/search/movie?api_key=${tmdbApiKey}&language=pt-BR&query=${encodeURIComponent(cleanQueryExtra)}`, {
        next: { revalidate: 600 }
      });
      
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.results && searchData.results.length > 0) {
          console.log('TMDb found (attempt 4):', searchData.results[0].title);
          return searchData.results[0];
        }
      }
    }
    
    console.log('TMDb no results for:', query);
    
    // Tentar buscar como série se não encontrou como filme
    console.log('Trying TV search...');
    const tvResult = await searchTMDBTV(cleanQuery);
    if (tvResult) {
      console.log('Found as TV series:', tvResult.name);
      return tvResult;
    }
    
    return null;
  } catch (error) {
    console.error('Error searching TMDb:', error);
    return null;
  }
}

export default async function Home() {
  const streamtapeData = await getStreamtapeFiles();
  
  // Usar arquivos do Streamtape
  const files = streamtapeData?.files || [];
    
  // Enriquecer arquivos com dados TMDb
  const enrichedFiles = await Promise.all(
    files.map(async (file: any) => {
      const fileName = file.name || '';
      console.log('Processing file:', fileName);
      const tmdbData = fileName ? await searchTMDBMovie(fileName) : null;
      console.log('TMDb result for', fileName, ':', tmdbData ? `FOUND (ID: ${tmdbData.id}, Type: ${tmdbData.title ? 'Movie' : 'TV'})` : 'NOT FOUND');
      
      return {
        ...file,
        tmdbData,
        title: tmdbData?.title || tmdbData?.name || file.name || 'Sem título',
        description: tmdbData?.overview || 'Sem descrição',
        linkid: file.linkid
      };
    })
  );
  
  // SEMPRE usar arquivos do Streamtape, mesmo sem dados TMDb
  const movies = enrichedFiles;
  const featuredMovies = movies.slice(0, 5);
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      <header className="sticky top-0 z-50 bg-zinc-900/30 backdrop-blur-md border-b border-zinc-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
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
              <Link href="#" className="text-zinc-300 hover:text-white transition-colors">Minha Lista</Link>
            </nav>
            <Link href="/planos" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors font-medium">
              Assinar - Planos
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <HeroCarousel movies={featuredMovies} />

        <section id="filmes" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-white mb-8">Filmes Populares</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {movies.map((movie: any) => {
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
              const isTV = !!tmdbData?.name; // Se tiver name, é série

              // Priorizar ID do TMDb quando disponível, senão usar linkid do Streamtape
              const movieLink = tmdbData?.id ? `/movie/${tmdbData.id}` : (movie.linkid ? `/movie/${movie.linkid}` : '#');

              return (
                <Link
                  key={movie.linkid || movie.id}
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
                      <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
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
        </section>
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
                <li><a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">Minha Lista</a></li>
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