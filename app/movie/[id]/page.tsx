import Link from "next/link";
import MovieClient from "@/components/MovieClient";
import VideoPlayer from "@/components/VideoPlayer";

interface MovieData {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genres: Array<{
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

async function getMovieData(movieId: string): Promise<MovieData | null> {
  try {
    const tmdbApiKey = '07c1396db17afadc024cbb5f0c3701c2';
    
    const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${tmdbApiKey}&language=pt-BR`, {
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

async function searchTMDBMovie(query: string): Promise<any | null> {
  try {
    const tmdbApiKey = '07c1396db17afadc024cbb5f0c3701c2';
    
    // Limpar o nome do arquivo de forma mais inteligente
    let cleanQuery = query
      .replace(/\.[^/.]+$/, '') // Remover extensão apenas
      .replace(/\s*\(\d{4}\)\s*/g, '') // Remover anos entre parênteses
      .replace(/[._-]/g, ' ') // Substituir separadores por espaço
      .replace(/\s+/g, ' ') // Remover espaços extras
      .trim()
      .toLowerCase();
    
    if (cleanQuery.length < 3) return null;
    
    console.log('Searching TMDb for:', cleanQuery, 'from original:', query);
    
    const searchRes = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&language=pt-BR&query=${encodeURIComponent(cleanQuery)}`, {
      next: { revalidate: 600 } // Reduzir cache para 10 minutos
    });
    
    if (!searchRes.ok) {
      console.error('TMDb search failed:', searchRes.status);
      return null;
    }
    
    const searchData = await searchRes.json();
    
    if (searchData.results && searchData.results.length > 0) {
      console.log('TMDb found:', searchData.results[0].title);
      return searchData.results[0];
    }
    
    console.log('TMDb no results for:', cleanQuery);
    return null;
  } catch (error) {
    console.error('Error searching TMDb:', error);
    return null;
  }
}

async function getStreamtapeFileId(movieTitle: string): Promise<string | null> {
  try {
    const streamtapeLogin = '4db68bae5deec46b3a4b';
    const streamtapeKey = 'a7azDDb68ACx8dP';
    
    const res = await fetch(`https://api.streamtape.com/file/listfolder?login=${streamtapeLogin}&key=${streamtapeKey}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 1800 }
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
    
    // Buscar arquivo correspondente pelo título
    const file = data.result.files.find((f: any) => {
      const fileName = (f.name || '').toLowerCase();
      const searchTerm = movieTitle.toLowerCase();
      return fileName.includes(searchTerm) || searchTerm.includes(fileName);
    });
    
    return file?.linkid || null;
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
    // Se for ID do TMDb, buscar dados do filme
    movieData = await getMovieData(movieId);
    
    // Buscar file ID do Streamtape baseado no título do filme
    const movieTitle = movieData?.title || movieData?.original_title || '';
    const streamtapeFileId = await getStreamtapeFileId(movieTitle);
    finalFileId = streamtapeFileId;
  } else {
    // Se for file ID do Streamtape, tentar buscar dados do TMDb pelo nome do arquivo
    const streamtapeLogin = '4db68bae5deec46b3a4b';
    const streamtapeKey = 'a7azDDb68ACx8dP';
    
    const res = await fetch(`https://api.streamtape.com/file/info?login=${streamtapeLogin}&key=${streamtapeKey}&file=${movieId}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 1800 }
    });
    
    if (res.ok) {
      const data = await res.json();
      const fileData = data.result?.[movieId];
      
      if (fileData) {
        fileName = fileData.name || '';
        const tmdbData = await searchTMDBMovie(fileName);
        if (tmdbData) {
          movieData = await getMovieData(tmdbData.id.toString());
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
  
  // Se for ID do TMDb mas não encontrar dados, mostrar erro
  if (isTmdbId && !movieData) {
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
            <h1 className="text-2xl text-white mb-4">Filme não encontrado</h1>
            <p className="text-zinc-300 mb-4">ID do filme: {movieId}</p>
            <Link href="/" className="text-red-500 hover:text-red-400 transition-colors">
              Voltar para a página inicial
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <MovieClient movieData={movieData!} fileId={finalFileId} />
  );
}