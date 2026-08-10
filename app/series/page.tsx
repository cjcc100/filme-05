import Image from "next/image";
import Link from "next/link";

async function getStreamtapeFolders() {
  try {
    const streamtapeLogin = '4db68bae5deec46b3a4b';
    const streamtapeKey = 'a7azDDb68ACx8dP';
    
    const res = await fetch(`https://api.streamtape.com/file/listfolder?login=${streamtapeLogin}&key=${streamtapeKey}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 1800 }
    });
    if (!res.ok) return null;
    
    const data = await res.json();
    if (data.status !== 200 || !data.result?.folders) return null;
    
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

export default async function SeriesPage() {
  const streamtapeData = await getStreamtapeFolders();
  
  // Mapeamento de pastas Streamtape para IDs TMDb
  const folderMappings: Record<string, { seriesId: string; seasonNumber: string }> = {
    // Adicione aqui o mapeamento das suas pastas Streamtape para IDs TMDb
    // Exemplo: 'folder-id': { seriesId: '4604', seasonNumber: '1' }
  };
  
  // Enriquecer pastas com dados TMDb
  const enrichedFolders = await Promise.all(
    (streamtapeData?.folders?.slice(0, 8) || []).map(async (folder: any) => {
      const mapping = folderMappings[folder.id];
      const tmdbData = mapping ? await getTMDBSeriesData(mapping.seriesId, mapping.seasonNumber) : null;
      return {
        ...folder,
        tmdbData
      };
    })
  );
  
  const series = enrichedFolders;

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-white mb-8">Séries Populares</h1>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {series.map((folder: any) => {
              const tmdbData = folder.tmdbData;
              const seriesData = tmdbData?.series;
              
              const imageUrl = seriesData?.poster_path
                ? `https://image.tmdb.org/t/p/w500${seriesData.poster_path}`
                : seriesData?.backdrop_path
                ? `https://image.tmdb.org/t/p/w500${seriesData.backdrop_path}`
                : null;
              
              const title = seriesData?.name || folder.name || 'Sem título';
              const year = seriesData?.first_air_date?.split('-')[0] || 'N/A';
              const rating = seriesData?.vote_average?.toFixed(1) || 'N/A';
              const overview = seriesData?.overview || 'Sem descrição';

              return (
                <Link
                  key={folder.id}
                  href={`/collection/${folder.id}`}
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
          
          {series.length === 0 && (
            <div className="bg-zinc-800 rounded-xl p-8 text-center">
              <p className="text-zinc-300 text-lg">
                Nenhuma série disponível no momento.
              </p>
            </div>
          )}
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
