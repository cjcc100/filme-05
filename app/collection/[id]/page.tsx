import Image from "next/image";
import Link from "next/link";

async function getStreamtapeFolder(folderId: string) {
  try {
    const streamtapeLogin = '4db68bae5deec46b3a4b';
    const streamtapeKey = 'a7azDDb68ACx8dP';
    
    const res = await fetch(`https://api.streamtape.com/file/listfolder?login=${streamtapeLogin}&key=${streamtapeKey}&folder=${folderId}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 1800 }
    });
    if (!res.ok) return null;
    
    const data = await res.json();
    if (data.status !== 200 || !data.result) return null;
    
    return data.result;
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

async function searchTMDBSeries(folderName: string, seasonNumber: number = 1) {
  try {
    const tmdbApiKey = '07c1396db17afadc024cbb5f0c3701c2';
    
    // Função para limpar o nome da pasta
    function cleanFolderName(name: string): string {
      return name
        .replace(/\d{4}/g, '') // Remover anos (2026, etc)
        .replace(/Temporada \d+/gi, '') // Remover "Temporada X"
        .replace(/:.*$/, '') // Remover tudo após dois pontos
        .replace(/\s+/g, ' ') // Remover espaços extras
        .trim();
    }
    
    const cleanName = cleanFolderName(folderName);
    console.log('🔍 Searching TMDb for:', cleanName, 'with season:', seasonNumber);
    
    const searchRes = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${tmdbApiKey}&language=pt-BR&query=${encodeURIComponent(cleanName)}`, {
      next: { revalidate: 600 }
    });
    
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.results && searchData.results.length > 0) {
        const firstResult = searchData.results[0];
        console.log('✅ Found series:', firstResult.name, 'ID:', firstResult.id);
        
        // Buscar dados completos da série com a temporada detectada
        const seriesData = await getTMDBSeriesData(firstResult.id.toString(), seasonNumber.toString());
        return seriesData;
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error searching TMDb series:', error);
    return null;
  }
}

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const folderId = id;
  
  const folderData = await getStreamtapeFolder(folderId);
  
  // Função para detectar temporada automaticamente baseada nos nomes dos arquivos
  function detectSeasonFromFiles(files: any[]): number {
    if (!files || files.length === 0) return 1;
    
    // Analisar os primeiros arquivos para detectar o padrão de temporada
    for (const file of files.slice(0, 5)) {
      const fileName = file.name || '';
      const match = fileName.match(/(\d+)x(\d+)/i);
      if (match) {
        const seasonNumber = parseInt(match[1]);
        console.log('🔍 Detected season from file:', fileName, '-> Season:', seasonNumber);
        return seasonNumber;
      }
    }
    
    return 1; // Padrão: temporada 1 se não conseguir detectar
  }
  
  // Detectar temporada automaticamente
  const detectedSeason = detectSeasonFromFiles(folderData?.files || []);
  console.log('🎯 Auto-detected season:', detectedSeason, 'for folder:', folderId);
  
  // Mapeamento de pastas Streamtape para IDs TMDb (apenas para casos onde precisa de ID específico)
  const folderMappings: Record<string, { seriesId: string; seasonNumber: string }> = {
    'Je_MCGJs5lQ': { seriesId: '4604', seasonNumber: '1' }, // Smallville Temporada 1
    'WAP4-waQ7H8': { seriesId: '45815', seasonNumber: '1' }, // Avenida Brasil Temporada 1
    'R2StpPkKoWs': { seriesId: '331061', seasonNumber: '1' }, // Voepass 2283: A Queda Temporada 1
    'HdsqTHs6H40': { seriesId: '82452', seasonNumber: '2' }, // Avatar: O Último Mestre do Ar Temporada 2
    'ZMQ2HmOkazs': { seriesId: '254071', seasonNumber: '1' }, // O Roubo (2026)
    'WC8gP0Vw2p4': { seriesId: '198102', seasonNumber: '2' }, // Sequestro (2026) - Temporada 2
    'E33-JMq_j1U': { seriesId: '198102', seasonNumber: '1' }, // Sequestro (2023) - Temporada 1
    'eGohvpY6AEM': { seriesId: '252193', seasonNumber: '1' }, // Até o Ultimo Samurai - Temporada 1
  };
  
  const mapping = folderMappings[folderId];
  let tmdbData = null;
  let finalSeason = typeof detectedSeason === 'number' ? detectedSeason : parseInt(detectedSeason);
  
  if (mapping) {
    // Usar mapeamento manual se existir, mas sobrescrever temporada se detectada
    finalSeason = finalSeason !== 1 ? finalSeason : parseInt(mapping.seasonNumber);
    console.log('📋 Using manual mapping with detected season:', finalSeason);
    tmdbData = await getTMDBSeriesData(mapping.seriesId, finalSeason.toString());
  } else {
    // Tentar busca automática pelo nome da pasta com temporada detectada
    const folderName = folderData?.folders?.[0]?.name || '';
    if (folderName) {
      console.log('🔍 Trying automatic search for:', folderName, 'with season:', finalSeason);
      tmdbData = await searchTMDBSeries(folderName, finalSeason);
    }
  }
  
  const seriesData = tmdbData?.series;
  const seasonData = tmdbData?.season;
  
  const title = seriesData?.name || folderData?.folders?.[0]?.name || 'Sem título';
  const overview = seriesData?.overview || 'Sem descrição';
  
  // Usar poster da temporada específica se disponível, senão usar poster da série
  const posterUrl = seasonData?.poster_path
    ? `https://image.tmdb.org/t/p/w500${seasonData.poster_path}`
    : seriesData?.poster_path
    ? `https://image.tmdb.org/t/p/w500${seriesData.poster_path}`
    : null;
    
  // Usar backdrop da temporada específica se disponível, senão usar backdrop da série
  const backdropUrl = seasonData?.poster_path
    ? `https://image.tmdb.org/t/p/original${seasonData.poster_path}`
    : seriesData?.backdrop_path
    ? `https://image.tmdb.org/t/p/original${seriesData.backdrop_path}`
    : null;
  
  const episodes = folderData?.files || [];
  
  // Enriquecer episódios com dados do TMDb
  let enrichedEpisodes: any[] = [];
  
  if (seasonData?.episodes && seasonData.episodes.length > 0) {
    // Se temos dados do TMDb, usar todos os episódios do TMDb e tentar fazer match com arquivos
    enrichedEpisodes = seasonData.episodes.map((tmdbEpisode: any) => {
      // Tentar encontrar arquivo correspondente no Streamtape
      const episodeNumber = tmdbEpisode.episode_number;
      const seasonNumber = tmdbEpisode.season_number;
      
      // Tentar encontrar arquivo pelo número do episódio
      const matchingFile = episodes.find((file: any) => {
        const fileName = file.name || '';
        const match = fileName.match(/(\d+)x(\d+)/i);
        if (match) {
          const fileSeason = parseInt(match[1]);
          const fileEpisode = parseInt(match[2]);
          return fileSeason === seasonNumber && fileEpisode === episodeNumber;
        }
        return false;
      });
      
      return {
        tmdbEpisode,
        file: matchingFile || null,
        title: tmdbEpisode.name || `Episódio ${episodeNumber}`,
        overview: tmdbEpisode.overview || 'Sem descrição',
        stillUrl: tmdbEpisode.still_path
          ? `https://image.tmdb.org/t/p/w500${tmdbEpisode.still_path}`
          : null,
        episodeNumber: tmdbEpisode.episode_number,
        seasonNumber: tmdbEpisode.season_number,
        linkid: matchingFile?.linkid || null,
        hasVideo: !!matchingFile
      };
    });
  } else {
    // Se não temos dados do TMDb, usar apenas arquivos do Streamtape
    enrichedEpisodes = episodes.map((file: any) => {
      const fileName = file.name || '';
      
      // Tentar extrair número do episódio do nome do arquivo (ex: "1x01" -> episodio 1)
      let episodeNumber = 1;
      let seasonNumber = 1;
      const match = fileName.match(/(\d+)x(\d+)/i);
      if (match) {
        seasonNumber = parseInt(match[1]);
        episodeNumber = parseInt(match[2]);
      }
      
      return {
        ...file,
        tmdbEpisode: null,
        title: fileName,
        overview: 'Sem descrição',
        stillUrl: null,
        episodeNumber,
        seasonNumber,
        linkid: file.linkid,
        hasVideo: true
      };
    });
  }
  
  // Ordenar episódios pelo número
  enrichedEpisodes.sort((a: any, b: any) => a.episodeNumber - b.episodeNumber);

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
        {/* Header da Série */}
        <section className="relative h-[50vh] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/70 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-900/50 to-transparent z-10" />
          
          {backdropUrl ? (
            <Image
              src={backdropUrl}
              alt={title}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-zinc-800" />
          )}
          
          <div className="absolute bottom-0 left-0 right-0 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div className="flex gap-8 items-end">
              {posterUrl && (
                <div className="hidden md:block w-32 h-48 rounded-lg overflow-hidden shadow-2xl">
                  <Image
                    src={posterUrl}
                    alt={title}
                    width={128}
                    height={192}
                    sizes="128px"
                    className="object-cover"
                  />
                </div>
              )}
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-4xl md:text-5xl font-bold text-white">
                    {title}
                  </h1>
                  <div className="bg-purple-600 text-white text-sm font-bold px-3 py-1 rounded">
                    Temporada {finalSeason}
                  </div>
                </div>
                <p className="text-zinc-300 text-lg max-w-3xl line-clamp-3">
                  {overview}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Lista de Episódios */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-white mb-8">Episódios</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrichedEpisodes.map((video: any, index: number) => {
              const episodeTitle = video.title;
              const thumbnailUrl = video.stillUrl;
              const episodeNumber = video.episodeNumber;
              const seasonNumber = video.seasonNumber;
              const hasVideo = video.hasVideo;
              const linkid = video.linkid;
              
              return (
                <div
                  key={`${seasonNumber}-${episodeNumber}-${index}`}
                  className={`group relative bg-zinc-800 rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/20 ${!hasVideo ? 'opacity-60' : ''}`}
                >
                  {hasVideo && linkid ? (
                    <Link href={`/episode/${linkid}?series=${encodeURIComponent(seriesData?.name || '')}&seriesId=${seriesData?.id || ''}&season=${seasonNumber}&episode=${episodeNumber}`}>
                      <div className="relative aspect-video overflow-hidden">
                        {thumbnailUrl ? (
                          <Image
                            src={thumbnailUrl}
                            alt={episodeTitle}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-700 flex items-center justify-center">
                            <span className="text-zinc-500 text-sm">Sem imagem</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded">
                          {seasonNumber}x{episodeNumber.toString().padStart(2, '0')}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">
                          {episodeTitle}
                        </h3>
                        <p className="text-zinc-400 text-xs line-clamp-2">
                          {video.overview}
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <div className="relative aspect-video overflow-hidden">
                      {thumbnailUrl ? (
                        <Image
                          src={thumbnailUrl}
                          alt={episodeTitle}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-zinc-700 flex items-center justify-center">
                          <span className="text-zinc-500 text-sm">Sem imagem</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-center">
                          <div className="bg-yellow-600 text-white text-xs font-bold px-3 py-1 rounded mb-2">
                            Em breve
                          </div>
                          <div className="text-white text-sm">Episódio indisponível</div>
                        </div>
                      </div>
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded">
                        {seasonNumber}x{episodeNumber.toString().padStart(2, '0')}
                      </div>
                      <div className="p-4">
                        <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">
                          {episodeTitle}
                        </h3>
                        <p className="text-zinc-400 text-xs line-clamp-2">
                          {video.overview}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {enrichedEpisodes.length === 0 && (
            <div className="bg-zinc-800 rounded-xl p-8 text-center">
              <p className="text-zinc-300 text-lg">
                Nenhum episódio disponível no momento.
              </p>
            </div>
          )}
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
