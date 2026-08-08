import Image from "next/image";
import Link from "next/link";

interface MovieData {
  guid: string;
  title?: string;
  name?: string;
  originalFilename?: string;
  description?: string;
  overview?: string;
  thumbnailUrl?: string;
  thumbnail?: string;
  posterUrl?: string;
  length?: number;
  year?: number;
  tmdbData?: any;
}

async function getMovieData(movieId: string): Promise<MovieData | null> {
  try {
    console.log('Fetching movie data for ID:', movieId);
    
    // Buscar diretamente o vídeo específico pelo GUID
    const bunnyApiUrl = `https://video.bunnycdn.com/library/722927/videos/${movieId}`;
    
    const videoRes = await fetch(bunnyApiUrl, {
      headers: {
        'Accept': 'application/json',
        'AccessKey': '1b6e3939-400b-40eb-98d3945f90fe-85f3-4570',
      },
      next: { revalidate: 1800 }
    });
    
    if (!videoRes.ok) {
      console.error('Bunny API error:', videoRes.status);
      // Se falhar buscar direto, tenta buscar todos e filtrar
      return await getMovieDataFallback(movieId);
    }
    
    const movie = await videoRes.json();
    console.log('Found movie:', movie.title || movie.name || movie.originalFilename);
    return movie;
  } catch (error) {
    console.error('Error fetching movie data:', error);
    return await getMovieDataFallback(movieId);
  }
}

async function getMovieDataFallback(movieId: string): Promise<MovieData | null> {
  try {
    console.log('Using fallback method for ID:', movieId);
    
    const bunnyApiUrl = 'https://video.bunnycdn.com/library/722927/videos';
    
    const videosRes = await fetch(bunnyApiUrl, {
      headers: {
        'Accept': 'application/json',
        'AccessKey': '1b6e3939-400b-40eb-98d3945f90fe-85f3-4570',
      },
      next: { revalidate: 1800 }
    });
    
    if (!videosRes.ok) {
      console.error('Bunny API error in fallback:', videosRes.status);
      return null;
    }
    
    const videosData = await videosRes.json();
    console.log('Total videos from Bunny:', videosData.items?.length);
    
    // Encontrar o vídeo específico pelo GUID
    const movie = videosData.items?.find((video: any) => video.guid === movieId);
    
    if (!movie) {
      console.error('Movie not found with GUID:', movieId);
      return null;
    }
    
    console.log('Found movie via fallback:', movie.title || movie.name || movie.originalFilename);
    return movie;
  } catch (error) {
    console.error('Error in fallback:', error);
    return null;
  }
}

async function getTMDBMovieData(movieId: string) {
  try {
    const tmdbApiKey = '07c1396db17afadc024cbb5f0c3701c2';
    
    const movieRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${tmdbApiKey}&language=pt-BR`, {
      next: { revalidate: 3600 }
    });
    
    if (!movieRes.ok) return null;
    
    return movieRes.json();
  } catch (error) {
    return null;
  }
}

async function searchTMDBMovie(query: string) {
  try {
    const tmdbApiKey = '07c1396db17afadc024cbb5f0c3701c2';
    
    // Limpar a query: remover extensões, números, caracteres especiais
    const cleanQuery = query
      .replace(/\.[^/.]+$/, '') // Remover extensão
      .replace(/\d+/g, '') // Remover números
      .replace(/[._-]/g, ' ') // Substituir separadores por espaço
      .replace(/\s+/g, ' ') // Remover espaços extras
      .trim();
    
    if (cleanQuery.length < 3) return null;
    
    const searchRes = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&language=pt-BR&query=${encodeURIComponent(cleanQuery)}`, {
      next: { revalidate: 3600 }
    });
    
    if (!searchRes.ok) return null;
    
    const searchData = await searchRes.json();
    
    // Retornar o primeiro resultado se houver
    if (searchData.results && searchData.results.length > 0) {
      console.log(`Found TMDb match for "${query}":`, searchData.results[0].title);
      return searchData.results[0];
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

export default async function MoviePage({ params }: { params: { id: string } }) {
  console.log('MoviePage called with params:', params);
  const movieData = await getMovieData(params.id);
  
  // Buscar automaticamente no TMDb pelo nome do arquivo
  const movieName = movieData?.title || movieData?.name || movieData?.originalFilename || '';
  const tmdbData = movieName ? await searchTMDBMovie(movieName) : null;
  
  if (!movieData) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
        <header className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800">
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
            <h1 className="text-4xl font-bold text-white mb-4">Filme não encontrado</h1>
            <Link href="/" className="text-red-500 hover:text-red-400">
              Voltar para o início
            </Link>
          </div>
        </main>
      </div>
    );
  }
  
  const title = tmdbData?.title || tmdbData?.name || movieData.title || movieData.name || movieData.originalFilename || 'Sem título';
  const description = tmdbData?.overview || movieData.description || movieData.overview || 'Sem descrição';
  const year = tmdbData?.release_date?.split('-')[0] || movieData.year || 'N/A';
  const duration = movieData.length ? `${Math.floor(movieData.length / 60)}:${(movieData.length % 60).toString().padStart(2, '0')}` : 'N/A';
  
  // Prioridade: TMDb data -> Bunny thumbnail -> fallback
  const imageUrl = tmdbData?.backdrop_path || tmdbData?.poster_path
    ? `https://image.tmdb.org/t/p/original${tmdbData.backdrop_path || tmdbData.poster_path}`
    : movieData.thumbnailUrl || movieData.thumbnail || movieData.posterUrl
    ? (movieData.thumbnailUrl || movieData.thumbnail || movieData.posterUrl)
    : `https://vz-c3b5c7e8-b89.b-cdn.net/${movieData.guid}/thumbnail.jpg`;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      <header className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800">
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
        {/* Header do Filme */}
        <section className="relative h-[400px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent z-10" />
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-zinc-800" />
          )}
          <div className="absolute bottom-0 left-0 right-0 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {title}
              </h1>
              <div className="flex gap-4 mb-4">
                <span className="bg-zinc-700 text-white px-3 py-1 rounded text-sm">
                  {year}
                </span>
                <span className="bg-zinc-700 text-white px-3 py-1 rounded text-sm">
                  {duration}
                </span>
              </div>
              <p className="text-zinc-300 text-lg line-clamp-3">
                {description}
              </p>
            </div>
          </div>
        </section>

        {/* Player de Vídeo */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-zinc-800 rounded-xl overflow-hidden">
            <div style={{ position: "relative", paddingTop: "56.25%" }}>
              <iframe
                src={`https://player.mediadelivery.net/embed/722927/${movieData.guid}?autoplay=true`}
                loading="lazy"
                style={{
                  border: "none",
                  position: "absolute",
                  top: "0",
                  height: "100%",
                  width: "100%",
                }}
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen={true}
              ></iframe>
            </div>
          </div>
        </section>

        {/* Informações Adicionais */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-zinc-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Sobre o filme</h2>
            <p className="text-zinc-300">
              {description}
            </p>
            {tmdbData && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {tmdbData.genres && tmdbData.genres.length > 0 && (
                  <div>
                    <h3 className="text-zinc-400 text-sm mb-2">Gêneros</h3>
                    <p className="text-white">
                      {tmdbData.genres.map((g: any) => g.name).join(', ')}
                    </p>
                  </div>
                )}
                {tmdbData.vote_average && (
                  <div>
                    <h3 className="text-zinc-400 text-sm mb-2">Avaliação</h3>
                    <p className="text-white">
                      {tmdbData.vote_average.toFixed(1)}/10
                    </p>
                  </div>
                )}
                {tmdbData.release_date && (
                  <div>
                    <h3 className="text-zinc-400 text-sm mb-2">Lançamento</h3>
                    <p className="text-white">
                      {new Date(tmdbData.release_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
                {tmdbData.runtime && (
                  <div>
                    <h3 className="text-zinc-400 text-sm mb-2">Duração</h3>
                    <p className="text-white">
                      {Math.floor(tmdbData.runtime / 60)}h {tmdbData.runtime % 60}m
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-zinc-900 border-t border-zinc-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-white font-semibold">CJCCHUB</span>
            </div>
            <p className="text-zinc-400 text-sm">
              © 2026 CJCCHUB. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
