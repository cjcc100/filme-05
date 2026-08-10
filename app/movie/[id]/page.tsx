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

async function getBunnyVideo(videoGuid: string): Promise<any | null> {
  try {
    const bunnyApiKey = '1b6e3939-400b-40eb-98d3945f90fe-85f3-4570';
    const libraryId = '722927';
    
    const res = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${videoGuid}`, {
      headers: {
        'Accept': 'application/json',
        'AccessKey': bunnyApiKey,
      },
      next: { revalidate: 1800 }
    });
    
    if (!res.ok) {
      console.error('Bunny API error:', res.status);
      return null;
    }
    
    return res.json();
  } catch (error) {
    console.error('Error fetching Bunny video:', error);
    return null;
  }
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

async function getTMDBSeriesData(seriesId: string, seasonNumber: string) {
  try {
    const tmdbApiKey = '07c1396db17afadc024cbb5f0c3701c2';
    
    const seriesRes = await fetch(`https://api.themoviedb.org/3/tv/${seriesId}?api_key=${tmdbApiKey}&language=pt-BR`, {
      next: { revalidate: 3600 }
    });
    
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

async function getBunnyCollection(collectionId: string) {
  try {
    const res = await fetch(`https://video.bunnycdn.com/library/722927/collections/${collectionId}`, {
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

async function getBunnyVideoId(movieTitle: string): Promise<string | null> {
  try {
    const bunnyApiKey = '1b6e3939-400b-40eb-98d3945f90fe-85f3-4570';
    const libraryId = '722927';
    
    const res = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
      headers: {
        'Accept': 'application/json',
        'AccessKey': bunnyApiKey,
      },
      next: { revalidate: 1800 }
    });
    
    if (!res.ok) {
      console.error('Bunny API error:', res.status);
      return null;
    }
    
    const data = await res.json();
    
    // Buscar vídeo correspondente pelo título
    const video = data.items?.find((v: any) => {
      const bunnyTitle = (v.title || v.name || v.originalFilename || '').toLowerCase();
      const searchTerm = movieTitle.toLowerCase();
      return bunnyTitle.includes(searchTerm) || searchTerm.includes(bunnyTitle);
    });
    
    return video?.guid || null;
  } catch (error) {
    console.error('Error fetching Bunny video ID:', error);
    return null;
  }
}

// Video ID de teste para você poder testar
const TEST_VIDEO_ID = '0ff90959-d053-463f-9e92-a61e43e52ae1';

// Mapeamento de coleções Bunny para IDs TMDb
const collectionMappings: Record<string, { seriesId: string; seasonNumber: string }> = {
  'f079e325-68b5-4771-8f0d-15bb8929ab58': { seriesId: '4604', seasonNumber: '1' } // Smallville Temporada 1
};

export default async function MoviePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movieId = id;
  
  // Verificar se é um GUID do Bunny (contém hífens) ou ID do TMDb (número)
  const isBunnyGuid = movieId.includes('-');
  
  let movieData: MovieData | null = null;
  let bunnyVideoData: any | null = null;
  let finalVideoId: string | null = null;
  
  if (isBunnyGuid) {
    // Se for GUID do Bunny, buscar dados do vídeo direto
    bunnyVideoData = await getBunnyVideo(movieId);
    finalVideoId = movieId;
    
    // Tentar buscar dados do TMDb baseado no título do vídeo Bunny
    if (bunnyVideoData) {
      const videoTitle = bunnyVideoData.title || bunnyVideoData.name || bunnyVideoData.originalFilename || '';
      const isEpisode = /\d+x\d+/i.test(videoTitle) || bunnyVideoData.collectionId;
      
      if (isEpisode && bunnyVideoData.collectionId) {
        // Se for episódio, buscar dados da coleção/serie
        const collectionData = await getBunnyCollection(bunnyVideoData.collectionId);
        const mapping = collectionMappings[bunnyVideoData.collectionId];
        
        if (mapping) {
          const tmdbSeriesData = await getTMDBSeriesData(mapping.seriesId, mapping.seasonNumber);
          if (tmdbSeriesData) {
            // Extrair número do episódio do nome do arquivo
            let episodeNumber = 1;
            const match = videoTitle.match(/(\d+)x(\d+)/i);
            if (match) {
              episodeNumber = parseInt(match[2]);
            }
            
            // Buscar dados do episódio específico
            const episodeData = tmdbSeriesData.season?.episodes?.find((ep: any) => ep.episode_number === episodeNumber);
            
            if (episodeData) {
              // Criar um objeto movieData simplificado com dados do episódio
              movieData = {
                id: 0,
                title: episodeData.name,
                original_title: episodeData.name,
                overview: episodeData.overview,
                poster_path: tmdbSeriesData.series?.poster_path,
                backdrop_path: episodeData.still_path || tmdbSeriesData.series?.backdrop_path,
                release_date: tmdbSeriesData.series?.first_air_date,
                vote_average: tmdbSeriesData.series?.vote_average,
                vote_count: tmdbSeriesData.series?.vote_count,
                genres: tmdbSeriesData.series?.genres || [],
                runtime: episodeData.runtime,
                tagline: tmdbSeriesData.series?.tagline,
                budget: 0,
                revenue: 0,
                production_companies: tmdbSeriesData.series?.production_companies || [],
                production_countries: tmdbSeriesData.series?.production_countries || [],
                spoken_languages: tmdbSeriesData.series?.spoken_languages || []
              };
            }
          }
        }
      } else if (!isEpisode) {
        // Se não for episódio, tentar buscar dados do TMDb como filme
        const tmdbData = await searchTMDBMovie(videoTitle);
        if (tmdbData) {
          movieData = await getMovieData(tmdbData.id.toString());
        }
      }
    }
  } else {
    // Se for ID do TMDb, buscar dados do filme
    movieData = await getMovieData(movieId);
    
    // Buscar videoId do Bunny CDN baseado no título do filme
    const movieTitle = movieData?.title || movieData?.original_title || '';
    const bunnyVideoId = await getBunnyVideoId(movieTitle);
    finalVideoId = bunnyVideoId;
  }
  
  // Para teste, usar videoId fixo se não encontrar
  if (!finalVideoId) {
    finalVideoId = TEST_VIDEO_ID;
  }
  
  // Se for GUID do Bunny e não tiver movieData do TMDb, continuar mesmo assim (pode ser episódio)
  if (!movieData && !bunnyVideoData) {
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
            <h1 className="text-2xl text-white mb-4">Vídeo não encontrado</h1>
            <p className="text-zinc-300 mb-4">ID do vídeo: {movieId}</p>
            <Link href="/" className="text-red-500 hover:text-red-400 transition-colors">
              Voltar para a página inicial
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Limpar o título removendo extensões e formatando
  let rawTitle = movieData?.title || movieData?.original_title || bunnyVideoData?.title || bunnyVideoData?.name || bunnyVideoData?.originalFilename || 'Sem título';
  const title = rawTitle
    .replace(/\.(mp4|mkv|avi|mov|wmv|flv|webm)$/i, '')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const year = movieData?.release_date?.split('-')[0] || bunnyVideoData?.metaData?.year || 'N/A';
  const rating = movieData?.vote_average?.toFixed(1) || 'N/A';
  const duration = movieData?.runtime ? `${Math.floor(movieData.runtime / 60)}h ${movieData.runtime % 60}m` : (bunnyVideoData?.length ? `${Math.floor(bunnyVideoData.length / 60)}:${(bunnyVideoData.length % 60).toString().padStart(2, '0')}` : 'N/A');
  const genres = movieData?.genres?.map(g => g.name).join(', ') || 'N/A';
  const voteCount = movieData?.vote_count?.toLocaleString() || '0';
  const overview = movieData?.overview || bunnyVideoData?.description || bunnyVideoData?.overview || 'Sem descrição';
  
  // Detectar se é episódio
  const isEpisode = bunnyVideoData && (/\d+x\d+/i.test(bunnyVideoData.title || bunnyVideoData.name || bunnyVideoData.originalFilename || '') || bunnyVideoData.collectionId);
  
  const backdropUrl = movieData?.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movieData.backdrop_path}`
    : bunnyVideoData?.thumbnailUrl
    ? bunnyVideoData.thumbnailUrl
    : bunnyVideoData?.guid
    ? `https://vz-c3b5c7e8-b89.b-cdn.net/${bunnyVideoData.guid}/thumbnail.jpg`
    : null;
    
  const posterUrl = movieData?.poster_path
    ? `https://image.tmdb.org/t/p/w500${movieData.poster_path}`
    : bunnyVideoData?.thumbnailUrl
    ? bunnyVideoData.thumbnailUrl
    : bunnyVideoData?.guid
    ? `https://vz-c3b5c7e8-b89.b-cdn.net/${bunnyVideoData.guid}/thumbnail.jpg`
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
                
                {isEpisode && (
                  <p className="text-zinc-400 text-lg mb-4">
                    Episódio de Série
                  </p>
                )}
                
                {!isEpisode && movieData?.tagline && (
                  <p className="text-zinc-400 text-lg mb-4 italic">
                    {movieData.tagline}
                  </p>
                )}
                
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
          </div>
        </section>

        {/* Sinopse */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-zinc-800/50 rounded-xl p-8 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-white mb-4">Sinopse</h2>
            <p className="text-zinc-300 text-lg leading-relaxed">
              {overview || 'Sinopse não disponível.'}
            </p>
          </div>
        </section>

        {/* Informações Adicionais */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-zinc-800/50 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-white mb-4">Gêneros</h3>
              <div className="flex flex-wrap gap-2">
                {!isEpisode && movieData?.genres?.map((genre) => (
                  <span
                    key={genre.id}
                    className="bg-red-600/20 text-red-400 px-3 py-1 rounded-full text-sm"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="bg-zinc-800/50 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-white mb-4">Avaliação</h3>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-green-400">
                  {rating}
                </div>
                <div>
                  <p className="text-zinc-400">Baseado em</p>
                  <p className="text-white font-semibold">
                    {voteCount} avaliações
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-800/50 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-white mb-4">Informações</h3>
              <div className="space-y-2">
                <p className="text-zinc-400">
                  <span className="text-white">Duração:</span> {duration}
                </p>
                <p className="text-zinc-400">
                  <span className="text-white">Lançamento:</span> {year}
                </p>
                <p className="text-zinc-400">
                  <span className="text-white">Título Original:</span> {movieData?.original_title || bunnyVideoData?.originalFilename || 'N/A'}
                </p>
              </div>
            </div>

            {!isEpisode && movieData?.production_companies && movieData.production_companies.length > 0 && (
              <div className="bg-zinc-800/50 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-white mb-4">Produção</h3>
                <div className="space-y-2">
                  {movieData.production_companies.map((company) => (
                    <p key={company.id} className="text-zinc-300">
                      {company.name}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {!isEpisode && movieData?.production_countries && movieData.production_countries.length > 0 && (
              <div className="bg-zinc-800/50 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-white mb-4">Países</h3>
                <div className="flex flex-wrap gap-2">
                  {movieData.production_countries.map((country) => (
                    <span
                      key={country.iso_3166_1}
                      className="bg-zinc-700 text-zinc-300 px-3 py-1 rounded-full text-sm"
                    >
                      {country.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {!isEpisode && movieData?.spoken_languages && movieData.spoken_languages.length > 0 && (
              <div className="bg-zinc-800/50 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-white mb-4">Idiomas</h3>
                <div className="flex flex-wrap gap-2">
                  {movieData.spoken_languages.map((lang) => (
                    <span
                      key={lang.iso_639_1}
                      className="bg-zinc-700 text-zinc-300 px-3 py-1 rounded-full text-sm"
                    >
                      {lang.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Informações Financeiras */}
        {!isEpisode && movieData && (movieData.budget || movieData.revenue) && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {movieData.budget && (
                <div className="bg-zinc-800/50 rounded-xl p-6 backdrop-blur-sm">
                  <h3 className="text-xl font-bold text-white mb-4">Orçamento</h3>
                  <p className="text-3xl font-bold text-green-400">{budget}</p>
                </div>
              )}
              
              {movieData.revenue && (
                <div className="bg-zinc-800/50 rounded-xl p-6 backdrop-blur-sm">
                  <h3 className="text-xl font-bold text-white mb-4">Receita</h3>
                  <p className="text-3xl font-bold text-green-400">{revenue}</p>
                </div>
              )}
            </div>
          </section>
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