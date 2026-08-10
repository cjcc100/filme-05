import Image from "next/image";
import Link from "next/link";
import HeroCarousel from "../components/HeroCarousel";

// CJCCHUB - Plataforma de Streaming
// Autor: juniorclaudinei350-sketch
// Email: juniorclaudinei350@gmail.com

async function getTmdbData() {
  try {
    const tmdbApiKey = '07c1396db17afadc024cbb5f0c3701c2';
    const res = await fetch(`https://api.themoviedb.org/3/trending/movie/day?api_key=${tmdbApiKey}&language=pt-BR&page=1`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    return null;
  }
}

async function getBunnyMovies() {
  try {
    const res = await fetch('https://video.bunnycdn.com/library/722927/videos', {
      headers: {
        'Accept': 'application/json',
        'AccessKey': '1b6e3939-400b-40eb-98d3945f90fe-85f3-4570',
      },
      next: { revalidate: 1800 }
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    return null;
  }
}

async function getStreamtapeMovies() {
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
    
    if (!res.ok) return null;
    
    const data = await res.json();
    
    if (data.status !== 200) {
      console.error('Streamtape API error:', data.msg);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching Streamtape movies:', error);
    return null;
  }
}

async function searchTMDBMovie(query: string) {
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

export default async function Home() {
  const tmdbData = await getTmdbData();
  const useStreamtape = process.env.USE_STREAMTAPE === 'true';
  
  let standaloneMovies: any[] = [];
  
  if (useStreamtape) {
    const streamtapeData = await getStreamtapeMovies();
    standaloneMovies = streamtapeData?.result?.files || [];
  } else {
    const bunnyMovies = await getBunnyMovies();
    
    // Filtrar vídeos sem coleção (filmes uploadados)
    standaloneMovies = bunnyMovies?.items?.filter((video: any) => {
      // Verificar se NÃO tem collectionId ou se collectionId é null/undefined/vazio
      return !video.collectionId || video.collectionId === '' || video.collectionId === null || video.collectionId === undefined;
    }) || [];
  }
    
  // Enriquecer filmes com dados TMDb
  const enrichedMovies = await Promise.all(
    standaloneMovies.map(async (movie: any) => {
      const movieName = movie.name || movie.title || movie.originalFilename || '';
      const tmdbData = movieName ? await searchTMDBMovie(movieName) : null;
      
      return {
        ...movie,
        tmdbData,
        title: tmdbData?.title || movie.title || movie.name || movie.originalFilename || 'Sem título',
        description: tmdbData?.overview || movie.description || movie.overview || 'Sem descrição',
        thumbnailUrl: movie.thumbnailUrl,
        guid: useStreamtape ? movie.linkid : movie.guid
      };
    })
  );
  
  // Usar filmes enriquecidos se disponíveis, senão usar TMDb como fallback
  const movies = (enrichedMovies.length > 0) ? enrichedMovies : (tmdbData?.results?.slice(0, 20) || []);
  const featuredMovies = movies.slice(0, 5);
  
  // Debug: mostrar quantos filmes foram encontrados
  console.log('Standalone movies:', standaloneMovies.length);
  console.log('Enriched movies:', enrichedMovies.length);
  console.log('Total movies:', movies.length);
  console.log('Standalone movie GUIDs:', standaloneMovies.map((m: any) => ({ guid: m.guid, title: m.title, collectionId: m.collectionId })));
  
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
              const isBunny = movie.guid;
              const tmdbData = movie.tmdbData;
              
              const imageUrl = tmdbData?.poster_path
                ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`
                : isBunny && (movie.thumbnailUrl || movie.thumbnail || movie.posterUrl)
                ? (movie.thumbnailUrl || movie.thumbnail || movie.posterUrl)
                : isBunny && movie.guid
                ? `https://vz-c3b5c7e8-b89.b-cdn.net/${movie.guid}/thumbnail.jpg`
                : movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : null;
              
              const title = tmdbData?.title || tmdbData?.name || movie.title || movie.name || movie.originalFilename || 'Sem título';
              const year = tmdbData?.release_date?.split('-')[0] || movie.release_date?.split('-')[0] || movie.year || 'N/A';
              const rating = tmdbData?.vote_average?.toFixed(1) || movie.vote_average?.toFixed(1) || (movie.length ? `${Math.floor(movie.length / 60)}:${(movie.length % 60).toString().padStart(2, '0')}` : 'N/A');
              const description = tmdbData?.overview || movie.description || movie.overview || 'Sem descrição';

              const movieLink = movie.guid ? `/movie/${movie.guid}` : (tmdbData?.id ? `/movie/${tmdbData.id}` : '#');

              return (
                <Link
                  key={movie.guid || movie.id}
                  href={movieLink}
                  className="group relative bg-zinc-800 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/20"
                >
                  <div className="relative aspect-[2/3] overflow-hidden">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-700 flex items-center justify-center">
                        <span className="text-zinc-500 text-sm">Sem imagem</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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