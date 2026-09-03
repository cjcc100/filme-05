import Link from "next/link";
import MovieClient from "@/components/MovieClient";
import VideoPlayer from "@/components/VideoPlayer";
import { config } from "@/lib/config";

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

async function getMovieData(movieId: string, isTV: boolean = false): Promise<MovieData | null> {
  try {
    const tmdbApiKey = config.tmdb.apiKey;
    
    const endpoint = isTV ? 'tv' : 'movie';
    const res = await fetch(`${config.tmdb.baseUrl}/${endpoint}/${movieId}?api_key=${tmdbApiKey}&language=pt-BR`, {
      next: { revalidate: 3600 }
    });
    
    if (!res.ok) {
      console.error('TMDb API error:', res.status);
      return null;
    }
    
    return res.json();
  } catch (error) {
    console.error('Error fetching movie data:', error);
    return null;
  }
}

async function searchTMDBTV(query: string): Promise<any | null> {
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

async function searchTMDBMovie(query: string): Promise<any | null> {
  try {
    const tmdbApiKey = config.tmdb.apiKey;
    
    console.log('Original query:', query);
    
    // Verificar mapeamento manual primeiro - tentar várias normalizações
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
        
        // Buscar dados completos do filme usando o ID
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
    
    console.log('No manual mapping found for:', query);
    
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

async function getStreamtapeFileId(movieTitle: string): Promise<string | null> {
  try {
    const streamtapeLogin = config.streamtape.login;
    const streamtapeKey = config.streamtape.key;
    
    const res = await fetch(`${config.streamtape.apiUrl}/file/listfolder?login=${streamtapeLogin}&key=${streamtapeKey}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 300 } // Reduzido para 5 minutos para pegar novos uploads mais rápido
    });
    
    if (!res.ok) {
      console.error('Streamtape API error:', res.status);
      return null;
    }
    
    const data = await res.json();
    
    if (data.status !== 200 || !data.result?.files) {
      console.error('Streamtape API - Invalid response');
      return null;
    }
    
    // Função de normalização de texto para matching com remoção de acentos
    function normalizeText(text: string): string {
      return text
        .toLowerCase()
        .replace(/[._-]/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\d{4}/g, '') // Remover anos
        .replace(/\[.*?\]/g, '') // Remover colchetes
        .replace(/\(.*?\)/g, '') // Remover parênteses
        .normalize('NFD') // Normalizar caracteres acentuados
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .trim();
    }
    
    const normalizedTitle = normalizeText(movieTitle);
    const titleWords = normalizedTitle.split(' ').filter(w => w.length > 2);
    
    // Buscar arquivo correspondente pelo título com matching melhorado
    let bestMatch: any = null;
    let bestMatchScore = 0;
    
    for (const file of data.result.files) {
      const fileName = file.name || '';
      const normalizedFileName = normalizeText(fileName);
      
      // Matching exato
      if (normalizedFileName === normalizedTitle) {
        console.log('Exact match found:', fileName);
        return file.linkid;
      }
      
      // Matching por palavras-chave
      const fileWords = normalizedFileName.split(' ').filter(w => w.length > 2);
      let matchScore = 0;
      
      for (const titleWord of titleWords) {
        if (fileWords.some(fw => fw.includes(titleWord) || titleWord.includes(fw))) {
          matchScore++;
        }
      }
      
      // Matching por inclusão
      if (normalizedFileName.includes(normalizedTitle) || normalizedTitle.includes(normalizedFileName)) {
        matchScore += 2;
      }
      
      if (matchScore > bestMatchScore) {
        bestMatch = file;
        bestMatchScore = matchScore;
      }
    }
    
    if (bestMatch && bestMatchScore >= 2) {
      console.log('Best match found:', bestMatch.name, 'with score:', bestMatchScore);
      return bestMatch.linkid;
    }
    
    console.log('No suitable match found for:', movieTitle);
    return null;
  } catch (error) {
    console.error('Error fetching Streamtape file ID:', error);
    return null;
  }
}

// File ID de teste para você poder testar
const TEST_FILE_ID = 'rbAarvRPXdYbaxY';

export default async function MoviePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movieId = id;
  
  // Verificar se é um ID do TMDb (número) ou file ID do Streamtape (string)
  const isTmdbId = /^\d+$/.test(movieId);
  
  let movieData: MovieData | null = null;
  let finalFileId: string | null = null;
  let fileName: string = '';
  
  if (isTmdbId) {
    // Se for ID do TMDb, tentar buscar como filme primeiro
    movieData = await getMovieData(movieId, false);
    
    // Se não encontrar como filme, tentar como série
    if (!movieData) {
      movieData = await getMovieData(movieId, true);
    }
    
    // Buscar file ID do Streamtape baseado no título do filme/série
    const movieTitle = movieData?.title || movieData?.name || movieData?.original_title || movieData?.original_name || '';
    const streamtapeFileId = await getStreamtapeFileId(movieTitle);
    finalFileId = streamtapeFileId;
  } else {
    // Se for file ID do Streamtape, tentar buscar dados do TMDb pelo nome do arquivo
    const streamtapeLogin = config.streamtape.login;
    const streamtapeKey = config.streamtape.key;
    
    const res = await fetch(`${config.streamtape.apiUrl}/file/info?login=${streamtapeLogin}&key=${streamtapeKey}&file=${movieId}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 300 }
    });
    
    if (res.ok) {
      const data = await res.json();
      const fileData = data.result?.[movieId];
      
      if (fileData) {
        fileName = fileData.name || '';
        const tmdbData = await searchTMDBMovie(fileName);
        if (tmdbData) {
          // Verificar se é série (tem name) ou filme (tem title)
          const isTV = !!tmdbData.name;
          movieData = await getMovieData(tmdbData.id.toString(), isTV);
        }
      }
    }
    
    finalFileId = movieId;
  }
  
  // Para teste, usar file ID fixo se não encontrar
  if (!finalFileId) {
    finalFileId = TEST_FILE_ID;
  }
  
  // Se for file ID do Streamtape sem dados do TMDb (episódio), mostrar player direto
  if (!isTmdbId && !movieData) {
    return (
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
                <Link href="/series" className="text-zinc-300 hover:text-white transition-colors">Séries</Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-white mb-4">{fileName || 'Episódio'}</h1>
            <p className="text-zinc-400 mb-8">Assista ao episódio diretamente</p>
            
            <VideoPlayer fileId={finalFileId} onClose={() => window.location.href = '/'} />
          </div>
        </main>
      </div>
    );
  }
  
  // Se não tiver dados do TMDb, mostrar mensagem de erro ou página simplificada
  if (!movieData) {
    return (
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
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl text-white mb-4">Filme não encontrado no TMDb</h1>
            <p className="text-zinc-300 mb-2">ID do filme: {movieId}</p>
            {fileName && <p className="text-zinc-400 mb-4">Arquivo: {fileName}</p>}
            <p className="text-zinc-400 mb-4">Não foi possível encontrar informações deste filme na base de dados do TMDb.</p>
            {finalFileId && finalFileId !== TEST_FILE_ID && (
              <div className="mb-4">
                <p className="text-zinc-300 mb-2">Você pode assistir diretamente:</p>
                <VideoPlayer fileId={finalFileId} onClose={() => {}} />
              </div>
            )}
            <Link href="/" className="text-red-500 hover:text-red-400 transition-colors">
              Voltar para a página inicial
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <MovieClient movieData={movieData} fileId={finalFileId} />
  );
}