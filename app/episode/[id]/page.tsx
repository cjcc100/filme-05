import Link from "next/link";
import VideoPlayer from "@/components/VideoPlayer";
import Image from "next/image";
import { config } from "@/lib/config";

async function getStreamtapeFileInfo(fileId: string) {
  try {
    const streamtapeLogin = config.streamtape.login;
    const streamtapeKey = config.streamtape.key;
    
    const res = await fetch(`${config.streamtape.apiUrl}/file/info?login=${streamtapeLogin}&key=${streamtapeKey}&file=${fileId}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 300 }
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const fileData = data.result?.[fileId];
    
    return fileData;
  } catch (error) {
    console.error('Error fetching Streamtape file info:', error);
    return null;
  }
}

async function searchTMDBSeries(query: string) {
  try {
    const tmdbApiKey = config.tmdb.apiKey;
    
    // Limpar nome para busca
    const cleanQuery = query
      .replace(/\d{4}/g, '') // Remover anos
      .replace(/Temporada \d+/gi, '') // Remover "Temporada X"
      .replace(/:.*$/, '') // Remover tudo após dois pontos
      .replace(/\s+/g, ' ') // Remover espaços extras
      .trim();
    
    console.log('Searching TMDb series for:', cleanQuery);
    
    const searchRes = await fetch(`${config.tmdb.baseUrl}/search/tv?api_key=${tmdbApiKey}&language=pt-BR&query=${encodeURIComponent(cleanQuery)}`, {
      next: { revalidate: 600 }
    });
    
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.results && searchData.results.length > 0) {
        return searchData.results[0];
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error searching TMDb series:', error);
    return null;
  }
}

async function getTMDBSeriesDetails(seriesId: string) {
  try {
    const tmdbApiKey = config.tmdb.apiKey;
    
    const res = await fetch(`${config.tmdb.baseUrl}/tv/${seriesId}?api_key=${tmdbApiKey}&language=pt-BR`, {
      next: { revalidate: 3600 }
    });
    
    if (!res.ok) return null;
    
    return res.json();
  } catch (error) {
    console.error('Error fetching TMDb series details:', error);
    return null;
  }
}

async function getTMDBEpisodeDetails(seriesId: string, seasonNumber: number, episodeNumber: number) {
  try {
    const tmdbApiKey = config.tmdb.apiKey;
    
    const res = await fetch(`${config.tmdb.baseUrl}/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}?api_key=${tmdbApiKey}&language=pt-BR`, {
      next: { revalidate: 3600 }
    });
    
    if (!res.ok) return null;
    
    return res.json();
  } catch (error) {
    console.error('Error fetching TMDb episode details:', error);
    return null;
  }
}

// Mapeamento manual de séries para IDs TMDb
const SERIES_MAPPING: Record<string, string> = {
  'avenida brasil': '45815',
  'smallville': '4604',
  'voepass 2283': '331061',
  'avatar': '82452',
};

export default async function EpisodePage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ series?: string; seriesId?: string; season?: string; episode?: string }> }) {
  const { id } = await params;
  const fileId = id;
  const { series, seriesId, season, episode } = await searchParams;
  
  const fileData = await getStreamtapeFileInfo(fileId);
  const fileName = fileData?.name || 'Episódio';
  const fileSize = fileData?.size ? `${(fileData.size / (1024 * 1024)).toFixed(2)} MB` : 'N/A';
  
  // Tentar extrair informações do episódio do nome do arquivo
  let episodeNumber = 1;
  let seasonNumber = 1;
  const match = fileName.match(/(\d+)x(\d+)/i);
  if (match) {
    seasonNumber = parseInt(match[1]);
    episodeNumber = parseInt(match[2]);
  }
  
  // Buscar dados do TMDb
  let tmdbSeriesData = null;
  let tmdbEpisodeData = null;
  let seriesName = '';
  
  console.log('=== EPISODE PAGE DEBUG ===');
  console.log('File ID:', fileId);
  console.log('File Name:', fileName);
  console.log('URL Params - series:', series, 'seriesId:', seriesId, 'season:', season, 'episode:', episode);
  console.log('Extracted - Season:', seasonNumber, 'Episode:', episodeNumber);
  
  // Prioridade 1: Usar parâmetros da URL se disponíveis
  if (seriesId && season && episode) {
    console.log('Using URL parameters...');
    const urlSeason = parseInt(season);
    const urlEpisode = parseInt(episode);
    
    // Atualizar temporada e episódio com os valores da URL
    seasonNumber = urlSeason;
    episodeNumber = urlEpisode;
    
    tmdbSeriesData = await getTMDBSeriesDetails(seriesId);
    if (tmdbSeriesData) {
      seriesName = tmdbSeriesData.name || series || '';
      console.log('✓ Got series data from URL:', seriesName);
      tmdbEpisodeData = await getTMDBEpisodeDetails(seriesId, seasonNumber, episodeNumber);
      console.log('✓ Episode data from URL:', tmdbEpisodeData ? 'FOUND' : 'NOT FOUND');
    }
  }
  
  // Prioridade 2: Tentar identificar pelo nome do arquivo se não tem parâmetros
  if (!tmdbSeriesData) {
    console.log('No URL params, trying file name identification...');
    const fileNameLower = fileName.toLowerCase();
    
    // Verificar mapeamento manual primeiro
    console.log('Checking manual mapping...');
    for (const [seriesKey, mappingSeriesId] of Object.entries(SERIES_MAPPING)) {
      if (fileNameLower.includes(seriesKey)) {
        console.log('✓ Found series in manual mapping:', seriesKey, '->', mappingSeriesId);
        tmdbSeriesData = await getTMDBSeriesDetails(mappingSeriesId);
        if (tmdbSeriesData) {
          seriesName = tmdbSeriesData.name || '';
          console.log('✓ Got series data:', seriesName);
          tmdbEpisodeData = await getTMDBEpisodeDetails(mappingSeriesId, seasonNumber, episodeNumber);
          console.log('✓ Episode data:', tmdbEpisodeData ? 'FOUND' : 'NOT FOUND');
        }
        break;
      }
    }
    
    // Se não encontrou no mapeamento manual, tentar busca automática
    if (!tmdbSeriesData) {
      console.log('Manual mapping failed, trying automatic search...');
      // Extrair possível nome da série do nome do arquivo
      const possibleSeriesName = fileName
        .replace(/\d+x\d+/gi, '') // Remover formato de episódio
        .replace(/\d{4}/g, '') // Remover anos
        .replace(/Temporada \d+/gi, '') // Remover "Temporada X"
        .replace(/\[.*?\]/g, '') // Remover colchetes
        .replace(/\(.*?\)/g, '') // Remover parênteses
        .replace(/[._-]/g, ' ') // Substituir separadores
        .replace(/\s+/g, ' ') // Remover espaços extras
        .trim();
      
      console.log('Possible series name:', possibleSeriesName);
      
      if (possibleSeriesName.length > 2) {
        const searchResult = await searchTMDBSeries(possibleSeriesName);
        if (searchResult) {
          console.log('✓ Found series via search:', searchResult.name, 'ID:', searchResult.id);
          tmdbSeriesData = await getTMDBSeriesDetails(searchResult.id.toString());
          if (tmdbSeriesData) {
            seriesName = tmdbSeriesData.name || '';
            console.log('✓ Got series data:', seriesName);
            tmdbEpisodeData = await getTMDBEpisodeDetails(searchResult.id.toString(), seasonNumber, episodeNumber);
            console.log('✓ Episode data:', tmdbEpisodeData ? 'FOUND' : 'NOT FOUND');
          }
        } else {
          console.log('✗ Series search failed');
        }
      }
    }
  }
  
  console.log('Final results - Series:', tmdbSeriesData ? 'FOUND' : 'NOT FOUND', 'Episode:', tmdbEpisodeData ? 'FOUND' : 'NOT FOUND');
  console.log('=========================');
  
  // Dados para exibição
  const episodeTitle = tmdbEpisodeData?.name || fileName;
  const episodeOverview = tmdbEpisodeData?.overview || 'Sinopse não disponível.';
  const episodeStillUrl = tmdbEpisodeData?.still_path
    ? `https://image.tmdb.org/t/p/w780${tmdbEpisodeData.still_path}`
    : null;
  const seriesPosterUrl = tmdbSeriesData?.poster_path
    ? `https://image.tmdb.org/t/p/w500${tmdbSeriesData.poster_path}`
    : null;
  const seriesBackdropUrl = tmdbSeriesData?.backdrop_path
    ? `https://image.tmdb.org/t/p/original${tmdbSeriesData.backdrop_path}`
    : null;
  const seriesRating = tmdbSeriesData?.vote_average?.toFixed(1) || 'N/A';
  const seriesYear = tmdbSeriesData?.first_air_date?.split('-')[0] || 'N/A';
  const episodeAirDate = tmdbEpisodeData?.air_date || 'N/A';
  const episodeRuntime = tmdbEpisodeData?.runtime ? `${tmdbEpisodeData.runtime} min` : 'N/A';

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
        {/* Header com Backdrop */}
        {seriesBackdropUrl && (
          <div className="relative h-[40vh] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/70 to-transparent z-10" />
            <Image
              src={seriesBackdropUrl}
              alt={seriesName}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <Link 
              href="/series" 
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar para Séries
            </Link>
            
            <div className="flex items-start gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {seriesName || fileName}
                </h1>
                <div className="flex items-center gap-4 text-zinc-400">
                  <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded">
                    Episódio {seasonNumber}x{episodeNumber.toString().padStart(2, '0')}
                  </span>
                  {seriesRating !== 'N/A' && (
                    <span className="flex items-center gap-1">
                      <span className="text-green-400 font-bold">{seriesRating}</span>
                      <span>Avaliação</span>
                    </span>
                  )}
                  {seriesYear !== 'N/A' && <span>{seriesYear}</span>}
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Player e Info Principal */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-zinc-800 rounded-xl overflow-hidden">
                <VideoPlayer fileId={fileId} isModal={false} />
              </div>
              
              {/* Informações do Episódio */}
              <div className="bg-zinc-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">{episodeTitle}</h2>
                <p className="text-zinc-300 text-lg leading-relaxed mb-6">
                  {episodeOverview}
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <h3 className="text-zinc-400 text-sm mb-1">Série</h3>
                    <p className="text-white font-medium">{seriesName || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="text-zinc-400 text-sm mb-1">Temporada</h3>
                    <p className="text-white font-medium">{seasonNumber}</p>
                  </div>
                  <div>
                    <h3 className="text-zinc-400 text-sm mb-1">Episódio</h3>
                    <p className="text-white font-medium">{episodeNumber}</p>
                  </div>
                  <div>
                    <h3 className="text-zinc-400 text-sm mb-1">Duração</h3>
                    <p className="text-white font-medium">{episodeRuntime}</p>
                  </div>
                  <div>
                    <h3 className="text-zinc-400 text-sm mb-1">Data de Exibição</h3>
                    <p className="text-white font-medium">{episodeAirDate}</p>
                  </div>
                  <div>
                    <h3 className="text-zinc-400 text-sm mb-1">Tamanho do Arquivo</h3>
                    <p className="text-white font-medium">{fileSize}</p>
                  </div>
                </div>
              </div>
              
              {/* Imagem do Episódio */}
              {episodeStillUrl && (
                <div className="bg-zinc-800 rounded-xl overflow-hidden">
                  <div className="relative aspect-video">
                    <Image
                      src={episodeStillUrl}
                      alt={episodeTitle}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Poster da Série */}
              {seriesPosterUrl && (
                <div className="bg-zinc-800 rounded-xl overflow-hidden">
                  <div className="relative aspect-[2/3]">
                    <Image
                      src={seriesPosterUrl}
                      alt={seriesName}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
              
              {/* Informações Técnicas do Arquivo */}
              <div className="bg-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Informações do Arquivo</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-zinc-400 text-sm mb-1">Nome do Arquivo</h4>
                    <p className="text-white text-sm break-all">{fileName}</p>
                  </div>
                  <div>
                    <h4 className="text-zinc-400 text-sm mb-1">Tamanho</h4>
                    <p className="text-white font-medium">{fileSize}</p>
                  </div>
                  <div>
                    <h4 className="text-zinc-400 text-sm mb-1">ID do Arquivo</h4>
                    <p className="text-white text-sm font-mono">{fileId}</p>
                  </div>
                </div>
              </div>
              
              {/* Informações da Série */}
              {tmdbSeriesData && (
                <div className="bg-zinc-800 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Sobre a Série</h3>
                  <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                    {tmdbSeriesData.overview || 'Descrição não disponível.'}
                  </p>
                  {tmdbSeriesData.genres && tmdbSeriesData.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tmdbSeriesData.genres.map((genre: any) => (
                        <span key={genre.id} className="bg-zinc-700 text-zinc-300 text-xs px-2 py-1 rounded">
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
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
                <li><Link href="/" className="text-zinc-400 hover:text-white text-sm transition-colors">Início</Link></li>
                <li><Link href="/series" className="text-zinc-400 hover:text-white text-sm transition-colors">Séries</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Ajuda</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">FAQ</a></li>
                <li><a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">Suporte</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">Termos</a></li>
                <li><a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">Privacidade</a></li>
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