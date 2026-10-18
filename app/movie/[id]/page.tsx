import Link from "next/link";
import MovieClient from "@/components/MovieClient";
import { config } from "@/lib/config";

interface MovieData {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date?: string;
  first_air_date?: string;
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

export default async function MoviePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movieId = id;

  // Buscar dados do TMDb como filme
  let movieData = await getMovieData(movieId, false);

  // Se não encontrar como filme, tentar como série
  if (!movieData) {
    movieData = await getMovieData(movieId, true);
  }

  // Se não tiver dados do TMDb, mostrar mensagem de erro
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
            <p className="text-zinc-400 mb-4">Não foi possível encontrar informações deste filme na base de dados do TMDb.</p>
            <Link href="/" className="text-red-500 hover:text-red-400 transition-colors">
              Voltar para a página inicial
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <MovieClient movieData={movieData} />
  );
}
