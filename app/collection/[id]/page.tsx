import Image from "next/image";
import Link from "next/link";

async function getCollectionData(collectionId: string) {
  try {
    // Usar endpoint correto da API Bunny para vídeos
    const bunnyApiUrl = 'https://video.bunnycdn.com/library/722927/videos';
    
    const videosRes = await fetch(bunnyApiUrl, {
      headers: {
        'Accept': 'application/json',
        'AccessKey': '1b6e3939-400b-40eb-98d3945f90fe-85f3-4570',
      },
      next: { revalidate: 1800 }
    });
    
    if (!videosRes.ok) {
      return null;
    }
    
    const videosData = await videosRes.json();
    
    // Filtrar vídeos que pertencem a esta coleção
    const collectionVideos = videosData.items?.filter((video: any) => video.collectionId === collectionId) || [];
    
    // Buscar informações da coleção usando endpoint correto
    const collectionUrl = 'https://video.bunnycdn.com/library/722927/collections?page=1&itemsPerPage=100';
    const collectionRes = await fetch(collectionUrl, {
      headers: {
        'Accept': 'application/json',
        'AccessKey': '1b6e3939-400b-40eb-98d3945f90fe-85f3-4570',
      },
      next: { revalidate: 1800 }
    });
    
    let collectionInfo = {};
    if (collectionRes.ok) {
      const collectionsData = await collectionRes.json();
      // Encontrar a coleção específica
      collectionInfo = collectionsData.items?.find((c: any) => c.guid === collectionId) || {};
    }
    
    return {
      ...collectionInfo,
      name: collectionInfo?.name || '',
      items: collectionVideos,
      totalItems: collectionVideos.length
    };
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
    
    // Buscar episódios da temporada
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

export default async function CollectionPage({ params }: { params: { id: string } }) {
  const collectionData = await getCollectionData(params.id);
  
  // Mapeamento de coleções Bunny para IDs TMDb (pode ser expandido)
  const collectionMappings: Record<string, { seriesId: string; seasonNumber: string }> = {
    'f079e325-68b5-4771-8f0d-15bb8929ab58': { seriesId: '4604', seasonNumber: '1' } // Smallville Temporada 1
  };
  
  const mapping = collectionMappings[params.id];
  const tmdbData = mapping ? await getTMDBSeriesData(mapping.seriesId, mapping.seasonNumber) : null;
  
  const episodes = collectionData?.items || [];
  const tmdbEpisodes = tmdbData?.season?.episodes || [];
  
  // Combinar dados do Bunny com TMDb quando possível
  const combinedEpisodes = episodes.map((bunnyEp: any, index: number) => {
    const tmdbEp = tmdbEpisodes[index] || {};
    return {
      ...bunnyEp,
      tmdbData: tmdbEp
    };
  });

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
        {/* Header da Série */}
        <section className="relative h-[400px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent z-10" />
          {tmdbData?.series?.backdrop_path ? (
            <Image
              src={`https://image.tmdb.org/t/p/original${tmdbData.series.backdrop_path}`}
              alt={tmdbData.series.name || 'Série'}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-zinc-800" />
          )}
          <div className="absolute bottom-0 left-0 right-0 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div className="flex gap-8 items-end">
              {tmdbData?.series?.poster_path && (
                <div className="hidden md:block w-48 h-72 rounded-lg overflow-hidden shadow-2xl">
                  <Image
                    src={`https://image.tmdb.org/t/p/w500${tmdbData.series.poster_path}`}
                    alt={tmdbData.series.name}
                    width={192}
                    height={288}
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  {tmdbData?.series?.name || collectionData?.name || 'Coleção'}
                </h1>
                <p className="text-zinc-300 text-lg mb-4">
                  {tmdbData?.season?.name || collectionData?.name || 'Temporada'}
                </p>
                <p className="text-zinc-400 text-sm max-w-2xl line-clamp-3">
                  {tmdbData?.season?.overview || tmdbData?.series?.overview || collectionData?.description || 'Sem descrição'}
                </p>
                <div className="flex gap-4 mt-6">
                  <span className="bg-zinc-700 text-white px-3 py-1 rounded text-sm">
                    {tmdbData?.season?.episode_count || episodes.length} Episódios
                  </span>
                  <span className="bg-zinc-700 text-white px-3 py-1 rounded text-sm">
                    {tmdbData?.series?.first_air_date?.split('-')[0] || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Lista de Episódios */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-white mb-8">Episódios</h2>
          <div className="space-y-4">
            {combinedEpisodes.map((episode: any, index: number) => (
              <div
                key={episode.guid || index}
                className="group bg-zinc-800 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-red-500/20"
              >
                <div className="flex gap-4 p-4">
                  <div className="relative w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-700">
                    {episode.tmdbData?.still_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w300${episode.tmdbData.still_path}`}
                        alt={episode.tmdbData.name || episode.title}
                        fill
                        className="object-cover"
                      />
                    ) : episode.thumbnailUrl ? (
                      <Image
                        src={episode.thumbnailUrl}
                        alt={episode.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-zinc-500 text-xs">Sem imagem</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold mb-1">
                          {episode.tmdbData?.name || episode.title}
                        </h3>
                        <p className="text-zinc-400 text-sm mb-2">
                          Episódio {episode.tmdbData?.episode_number || index + 1} • {episode.length ? `${Math.floor(episode.length / 60)}:${(episode.length % 60).toString().padStart(2, '0')}` : 'N/A'}
                        </p>
                        <p className="text-zinc-500 text-sm line-clamp-2">
                          {episode.tmdbData?.overview || episode.description || 'Sem descrição'}
                        </p>
                      </div>
                      <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 flex-shrink-0">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                        Assistir
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
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
          </div>
        </div>
      </footer>
    </div>
  );
}