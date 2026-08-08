import Image from "next/image";
import Link from "next/link";

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
    // Usar endpoint correto da API Bunny para vídeos
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

async function getBunnyCollections() {
  try {
    // Usar endpoint correto da API Bunny para coleções com paginação
    const res = await fetch('https://video.bunnycdn.com/library/722927/collections?page=1&itemsPerPage=100', {
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

async function getTMDBSeriesData(seriesId: string, seasonNumber: string) {
  try {
    const tmdbApiKey = '07c1396db17afadc024cbb5f0c3701c2';
    
    // Buscar detalhes da série
    const seriesRes = await fetch(`https://api.themoviedb.org/3/tv/${seriesId}?api_key=${tmdbApiKey}&language=pt-BR`, {
      next: { revalidate: 3600 }
    });
    
    // Buscar detalhes da temporada
    const seasonRes = await fetch(`https://api.themoviedb.org/3/tv/${seriesId}/season/${seasonNumber}?api_key=${tmdbApiKey}&language=pt-BR`, {
      next: { revalidate: 3600 }
    });
    
    if (!seriesRes.ok || !seasonRes.ok) return null;
    
    const seriesData = await seriesRes.json();
    const seasonData = await seasonRes.json();
    
    return { series: seriesData, season: seasonData };
  } catch (error) {
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

export default async function Home() {
  const tmdbData = await getTmdbData();
  const bunnyMovies = await getBunnyMovies();
  const bunnyCollections = await getBunnyCollections();
  
  // Filtrar vídeos sem coleção (filmes uploadados) dos vídeos com coleção (séries)
  const standaloneMovies = bunnyMovies?.items?.filter((video: any) => !video.collectionId) || [];
  const seriesEpisodes = bunnyMovies?.items?.filter((video: any) => video.collectionId) || [];
    
  // Mapeamento de coleções Bunny para IDs TMDb
  const collectionMappings: Record<string, { seriesId: string; seasonNumber: string }> = {
    'f079e325-68b5-4771-8f0d-15bb8929ab58': { seriesId: '4604', seasonNumber: '1' } // Smallville Temporada 1
  };
  
  // Mapeamento de filmes Bunny para IDs TMDb
  const movieMappings: Record<string, string> = {
    // Adicione aqui os GUIDs dos seus filmes do Bunny e os IDs TMDb correspondentes
    // Exemplo: 'video-guid': 'tmdb-movie-id'
  };
  
  // Enriquecer coleções com dados TMDb
  const enrichedCollections = await Promise.all(
    (bunnyCollections?.items?.slice(0, 8) || []).map(async (collection: any) => {
      const mapping = collectionMappings[collection.guid];
      const tmdbData = mapping ? await getTMDBSeriesData(mapping.seriesId, mapping.seasonNumber) : null;
      return {
        ...collection,
        tmdbData
      };
    })
  );
  
  // Enriquecer filmes com dados TMDb
  const enrichedMovies = await Promise.all(
    standaloneMovies.slice(0, 20).map(async (movie: any) => {
      const tmdbId = movieMappings[movie.guid];
      const tmdbData = tmdbId ? await getTMDBMovieData(tmdbId) : null;
      
      console.log('Movie GUID:', movie.guid, 'Title:', movie.title || movie.name || movie.originalFilename);
      
      return {
        ...movie,
        tmdbData,
        // Garantir que temos pelo menos os dados do Bunny disponíveis
        title: movie.title || movie.name || movie.originalFilename || 'Sem título',
        description: movie.description || movie.overview || 'Sem descrição',
        thumbnailUrl: movie.thumbnailUrl || movie.thumbnail || movie.posterUrl,
        // Garantir que o GUID está presente
        guid: movie.guid
      };
    })
  );
  
  // Usar filmes enriquecidos do Bunny (sem coleção), se disponíveis, senão usar TMDb como fallback
  const movies = (enrichedMovies.length > 0) 
    ? enrichedMovies 
    : (tmdbData?.results?.slice(0, 20) || []);
    
  const featuredMovie = movies[0] || seriesEpisodes[0] || tmdbData?.results?.[0];
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      <header className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800">
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
              <Link href="/#filmes" className="text-zinc-300 hover:text-white transition-colors">Filmes</Link>
              <Link href="/#series" className="text-zinc-300 hover:text-white transition-colors">Séries</Link>
              <Link href="#" className="text-zinc-300 hover:text-white transition-colors">Minha Lista</Link>
            </nav>
            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors font-medium">
              Assinar
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative h-[500px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent z-10" />
          {featuredMovie ? (
            (() => {
              const isBunny = featuredMovie.guid;
              const tmdbData = featuredMovie.tmdbData;
              
              // Prioridade: TMDb data -> Bunny thumbnail -> fallback
              const imageUrl = tmdbData?.backdrop_path || tmdbData?.poster_path
                ? `https://image.tmdb.org/t/p/original${tmdbData.backdrop_path || tmdbData.poster_path}`
                : isBunny && (featuredMovie.thumbnailUrl || featuredMovie.thumbnail || featuredMovie.posterUrl)
                ? (featuredMovie.thumbnailUrl || featuredMovie.thumbnail || featuredMovie.posterUrl)
                : isBunny && featuredMovie.guid
                ? `https://vz-c3b5c7e8-b89.b-cdn.net/${featuredMovie.guid}/thumbnail.jpg`
                : featuredMovie.backdrop_path || featuredMovie.poster_path
                ? `https://image.tmdb.org/t/p/original${featuredMovie.backdrop_path || featuredMovie.poster_path}`
                : null;
              
              const title = tmdbData?.title || tmdbData?.name || featuredMovie.title || featuredMovie.name || featuredMovie.originalFilename || 'Filme em destaque';
              const overview = tmdbData?.overview || featuredMovie.description || featuredMovie.overview || 'Carregando descrição...';
              
              return imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <Image
                  src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&h=1080&fit=crop"
                  alt="Filme em destaque"
                  fill
                  className="object-cover"
                  priority
                />
              );
            })()
          ) : (
            <Image
              src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&h=1080&fit=crop"
              alt="Filme em destaque"
              fill
              className="object-cover"
              priority
            />
          )}
          <div className="absolute bottom-0 left-0 right-0 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            <div className="max-w-2xl">
              <span className="inline-block bg-red-600 text-white text-sm font-medium px-3 py-1 rounded-full mb-4">
                Destaque
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {featuredMovie?.tmdbData?.title || featuredMovie?.tmdbData?.name || featuredMovie?.title || featuredMovie?.name || 'Carregando...'}
              </h1>
              <p className="text-zinc-300 text-lg mb-6">
                {featuredMovie?.tmdbData?.overview || featuredMovie?.overview || featuredMovie?.description || 'Carregando descrição...'}
              </p>
              <div className="flex gap-4">
                <button className="bg-white text-zinc-900 px-6 py-3 rounded-lg font-semibold hover:bg-zinc-100 transition-colors flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  Assistir
                </button>
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

        <section id="filmes" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-white mb-8">Filmes Populares</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {movies.map((movie: any) => {
              // Verificar se é do Bunny (tem guid) ou do TMDb (tem id)
              const isBunny = movie.guid;
              const tmdbData = movie.tmdbData;
              
              // Prioridade: TMDb data -> Bunny thumbnail -> TMDb fallback
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

              return (
                <Link
                  key={movie.guid || movie.id}
                  href={isBunny ? `/movie/${movie.guid}` : `#`}
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
                    <h3 className="text-white font-semibold text-sm mb-1 truncate">{title}</h3>
                    <p className="text-zinc-400 text-xs mb-2">
                      {year} • {isBunny ? 'Bunny' : 'TMDb'}
                    </p>
                    <p className="text-zinc-500 text-xs line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {enrichedCollections.length > 0 && (
          <section id="series" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h2 className="text-2xl font-bold text-white mb-8">Séries e Coleções</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {enrichedCollections.map((collection: any) => (
                <Link
                  key={collection.guid}
                  href={`/collection/${collection.guid}`}
                  className="group relative bg-zinc-800 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/20"
                >
                  <div className="relative aspect-[2/3] overflow-hidden">
                    {collection.tmdbData?.series?.poster_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w500${collection.tmdbData.series.poster_path}`}
                        alt={collection.tmdbData.series.name || collection.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : collection.thumbnail ? (
                      <Image
                        src={`https://${process.env.BUNNY_CDN_HOSTNAME || 'vz-c3b5c7e8-b89.b-cdn.net'}/${collection.guid}/${collection.thumbnail}`}
                        alt={collection.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-700 flex items-center justify-center">
                        <span className="text-zinc-500 text-sm">Sem imagem</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                      {collection.tmdbData?.season?.name || 'Coleção'}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-semibold text-sm mb-1 truncate">
                      {collection.tmdbData?.series?.name || collection.name}
                    </h3>
                    <p className="text-zinc-400 text-xs mb-2">
                      {collection.tmdbData?.season?.name || collection.name} • {collection?.videoCount || 0} vídeos
                    </p>
                    <p className="text-zinc-500 text-xs line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {collection.tmdbData?.season?.overview || collection.description || 'Coleção de vídeos'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}


      </main>

      <footer className="bg-zinc-900 border-t border-zinc-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-orange-500 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">C</span>
              </div>
              <span className="text-zinc-400 text-sm">© 2024 CJCCHUB</span>
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">Termos</a>
              <a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">Privacidade</a>
              <a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">Ajuda</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
