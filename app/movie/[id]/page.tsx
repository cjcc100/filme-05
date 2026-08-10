import Image from "next/image";
import Link from "next/link";
import WatchButton from "@/components/WatchButton";

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
    
    let cleanQuery = query
      .replace(/\.[^/.]+$/, '')
      .replace(/\d+/g, '')
      .replace(/[._-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (cleanQuery.length < 3) return null;
    
    const searchRes = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&language=pt-BR&query=${encodeURIComponent(cleanQuery)}`, {
      next: { revalidate: 3600 }
    });
    
    if (!searchRes.ok) return null;
    
    const searchData = await searchRes.json();
    
    if (searchData.results && searchData.results.length > 0) {
      return searchData.results[0];
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

async function getStreamtapeFiles(): Promise<any[] | null> {
  try {
    const login = process.env.STREAMTAPE_LOGIN || '';
    const key = process.env.STREAMTAPE_KEY || '';
    
    if (!login || !key) {
      console.error('Streamtape credentials not configured');
      return null;
    }
    
    const res = await fetch(`https://api.streamtape.com/file/listfolder?login=${login}&key=${key}`, {
      next: { revalidate: 1800 }
    });
    
    if (!res.ok) {
      console.error('Streamtape API error:', res.status);
      return null;
    }
    
    const data = await res.json();
    
    if (data.status !== 200) {
      console.error('Streamtape API error:', data.msg);
      return null;
    }
    
    return data.result?.files || [];
  } catch (error) {
    console.error('Error fetching Streamtape files:', error);
    return null;
  }
}

async function getStreamtapeFileId(movieTitle: string): Promise<string | null> {
  try {
    const files = await getStreamtapeFiles();
    
    if (!files || files.length === 0) {
      return null;
    }
    
    const file = files.find((f: any) => {
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

export default async function MoviePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movieId = id;
  
  const isTmdbId = /^\d+$/.test(movieId);
  
  let movieData: MovieData | null = null;
  let finalVideoId: string | null = null;
  
  if (isTmdbId) {
    movieData = await getMovieData(movieId);
    
    const movieTitle = movieData?.title || movieData?.original_title || '';
    const streamtapeFileId = await getStreamtapeFileId(movieTitle);
    finalVideoId = streamtapeFileId;
  } else {
    const streamtapeFiles = await getStreamtapeFiles();
    const video = streamtapeFiles?.find((f: any) => f.linkid === movieId);
    
    if (video) {
      finalVideoId = movieId;
      const videoTitle = video.name || '';
      const tmdbData = await searchTMDBMovie(videoTitle);
      if (tmdbData) {
        movieData = await getMovieData(tmdbData.id.toString());
      }
    }
  }
  
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

  const title = movieData?.title || movieData?.original_title || 'Sem título';
  const year = movieData?.release_date?.split('-')[0] || 'N/A';
  const rating = movieData?.vote_average?.toFixed(1) || 'N/A';
  const duration = movieData?.runtime ? `${Math.floor(movieData.runtime / 60)}h ${movieData.runtime % 60}m` : 'N/A';
  const genres = movieData?.genres?.map(g => g.name).join(', ') || 'N/A';
  const voteCount = movieData?.vote_count?.toLocaleString() || '0';
  const overview = movieData?.overview || 'Sem descrição';
  
  const backdropUrl = movieData?.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movieData.backdrop_path}`
    : null;
    
  const posterUrl = movieData?.poster_path
    ? `https://image.tmdb.org/t/p/w500${movieData.poster_path}`
    : null;

  const budget = movieData?.budget ? `$${movieData.budget.toLocaleString()}` : 'N/A';
  const revenue = movieData?.revenue ? `$${movieData.revenue.toLocaleString()}` : 'N/A';

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
              <Link href="/" className="text-zinc-300 hover:text-white transition-colors">Filmes</Link>
              <Link href="/series" className="text-zinc-300 hover:text-white transition-colors">Séries</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
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
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  {title}
                </h1>
                <p className="text-zinc-300 text-lg max-w-3xl line-clamp-3">
                  {overview}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex gap-8">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-green-400 font-bold">{rating}</span>
                  <span className="text-zinc-400">Avaliação</span>
                </div>
                
                <span className="text-zinc-400">•</span>
                
                <span className="text-zinc-300">{year}</span>
                
                <span className="text-zinc-400">•</span>
                
                <span className="text-zinc-300">{duration}</span>
                
                <span className="text-zinc-400">•</span>
                
                <span className="text-zinc-300">{genres}</span>
              </div>
              
              <div className="flex gap-4">
                <WatchButton videoId={finalVideoId} />
                
                <button className="bg-zinc-600/80 text-white px-8 py-3 rounded-lg font-semibold hover:bg-zinc-600 transition-colors flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                  </svg>
                  Minha Lista
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-zinc-800/50 rounded-xl p-8 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-white mb-4">Sinopse</h2>
            <p className="text-zinc-300 text-lg leading-relaxed">
              {overview}
            </p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-zinc-800/50 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-2">Avaliação</h3>
              <p className="text-zinc-300">{rating} ({voteCount} votos)</p>
            </div>
            
            <div className="bg-zinc-800/50 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-2">Orçamento</h3>
              <p className="text-zinc-300">{budget}</p>
            </div>
            
            <div className="bg-zinc-800/50 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-2">Receita</h3>
              <p className="text-zinc-300">{revenue}</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-zinc-900 border-t border-zinc-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="text-white font-semibold text-lg">CJCCHUB</span>
          </div>
          <p className="text-zinc-400 text-sm">
            © 2024 CJCCHUB. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
