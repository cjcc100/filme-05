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
    console.log('Fetching movie data for GUID:', movieId);
    
    // Buscar todos os vídeos e filtrar pelo GUID
    const bunnyApiUrl = 'https://video.bunnycdn.com/library/722927/videos';
    
    const videosRes = await fetch(bunnyApiUrl, {
      headers: {
        'Accept': 'application/json',
        'AccessKey': '1b6e3939-400b-40eb-98d3945f90fe-85f3-4570',
      },
      next: { revalidate: 1800 }
    });
    
    if (!videosRes.ok) {
      console.error('Bunny API error:', videosRes.status);
      // Se falhar, retorna objeto mínimo com o GUID
      return { guid: movieId };
    }
    
    const videosData = await videosRes.json();
    console.log('Total videos from Bunny:', videosData.items?.length);
    
    // Encontrar o vídeo específico pelo GUID
    const movie = videosData.items?.find((video: any) => video.guid === movieId);
    
    if (!movie) {
      console.error('Movie not found with GUID:', movieId);
      console.log('Available GUIDs:', videosData.items?.map((v: any) => v.guid));
      // Se não encontrar, retorna objeto mínimo com o GUID
      return { guid: movieId };
    }
    
    console.log('Found movie:', movie.title || movie.name || movie.originalFilename);
    return movie;
  } catch (error) {
    console.error('Error fetching movie data:', error);
    // Se der erro, retorna objeto mínimo com o GUID
    return { guid: movieId };
  }
}

async function searchTMDBMovie(query: string) {
  try {
    const tmdbApiKey = '07c1396db17afadc024cbb5f0c3701c2';
    
    // Limpar a query: remover extensões, números, caracteres especiais
    let cleanQuery = query
      .replace(/\.[^/.]+$/, '') // Remover extensão
      .replace(/\d+/g, '') // Remover números
      .replace(/[._-]/g, ' ') // Substituir separadores por espaço
      .replace(/\s+/g, ' ') // Remover espaços extras
      .trim();
    
    if (cleanQuery.length < 3) return null;
    
    console.log(`Searching TMDb for: "${cleanQuery}" (original: "${query}")`);
    
    const searchRes = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&language=pt-BR&query=${encodeURIComponent(cleanQuery)}`, {
      next: { revalidate: 3600 }
    });
    
    if (!searchRes.ok) {
      console.error('TMDb search error:', searchRes.status);
      return null;
    }
    
    const searchData = await searchRes.json();
    
    // Retornar o primeiro resultado se houver
    if (searchData.results && searchData.results.length > 0) {
      console.log(`Found TMDb match for "${query}":`, searchData.results[0].title);
      return searchData.results[0];
    }
    
    console.log(`No TMDb match found for "${query}"`);
    return null;
  } catch (error) {
    console.error('Error searching TMDb:', error);
    return null;
  }
}

export default async function MoviePage({ params }: { params: { id: string } }) {
  console.log('MoviePage called with GUID:', params.id);
  const movieData = await getMovieData(params.id);
  
  // Se não tiver dados do Bunny, usa o GUID da URL
  const movieGuid = movieData?.guid || params.id;
  
  // Buscar automaticamente no TMDb pelo nome do arquivo
  const movieName = movieData?.title || movieData?.name || movieData?.originalFilename || '';
  const tmdbData = movieName ? await searchTMDBMovie(movieName) : null;
  
  const title = tmdbData?.title || tmdbData?.name || movieData?.title || movieData?.name || movieData?.originalFilename || `Filme (${movieGuid.substring(0, 8)}...)`;
  const description = tmdbData?.overview || movieData?.description || movieData?.overview || 'Sem descrição disponível';
  const year = tmdbData?.release_date?.split('-')[0] || movieData?.year || 'N/A';
  const duration = movieData?.length ? `${Math.floor(movieData.length / 60)}:${(movieData.length % 60).toString().padStart(2, '0')}` : 'N/A';
  const rating = tmdbData?.vote_average?.toFixed(1) || 'N/A';
  
  // Prioridade: TMDb backdrop -> TMDb poster -> Bunny thumbnail -> fallback
  const imageUrl = tmdbData?.backdrop_path
    ? `https://image.tmdb.org/t/p/original${tmdbData.backdrop_path}`
    : tmdbData?.poster_path
    ? `https://image.tmdb.org/t/p/original${tmdbData.poster_path}`
    : movieData?.thumbnailUrl || movieData?.thumbnail || movieData?.posterUrl
    ? (movieData.thumbnailUrl || movieData.thumbnail || movieData.posterUrl)
    : `https://vz-c3b5c7e8-b89.b-cdn.net/${movieGuid}/thumbnail.jpg`;
    
  const posterUrl = tmdbData?.poster_path
    ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`
    : movieData?.thumbnailUrl || movieData?.thumbnail || movieData?.posterUrl
    ? (movieData.thumbnailUrl || movieData.thumbnail || movieData.posterUrl)
    : null;

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
        <section className="relative h-[500px] overflow-hidden">
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
                <div className="flex gap-4 mb-4">
                  <span className="bg-zinc-700 text-white px-3 py-1 rounded text-sm">
                    {year}
                  </span>
                  <span className="bg-zinc-700 text-white px-3 py-1 rounded text-sm">
                    {duration}
                  </span>
                  {rating !== 'N/A' && (
                    <span className="bg-zinc-700 text-white px-3 py-1 rounded text-sm">
                      ⭐ {rating}
                    </span>
                  )}
                </div>
                <p className="text-zinc-300 text-lg line-clamp-3 max-w-2xl">
                  {description}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Player de Vídeo */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-zinc-800 rounded-xl overflow-hidden">
            <div style={{ position: "relative", paddingTop: "56.25%" }}>
              <iframe
                src={`https://player.mediadelivery.net/embed/722927/${movieGuid}?autoplay=true`}
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
            <p className="text-zinc-300 text-lg leading-relaxed">
              {description}
            </p>
            
            {tmdbData && (
              <div className="mt-8 space-y-6">
                {/* Gêneros */}
                {tmdbData.genres && tmdbData.genres.length > 0 && (
                  <div>
                    <h3 className="text-zinc-400 text-sm font-semibold mb-2">Gêneros</h3>
                    <div className="flex flex-wrap gap-2">
                      {tmdbData.genres.map((g: any) => (
                        <span key={g.id} className="bg-zinc-700 text-white px-3 py-1 rounded-full text-sm">
                          {g.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Metadados */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {tmdbData.vote_average && (
                    <div>
                      <h3 className="text-zinc-400 text-sm font-semibold mb-2">Avaliação</h3>
                      <p className="text-white text-lg">
                        ⭐ {tmdbData.vote_average.toFixed(1)}/10
                      </p>
                      {tmdbData.vote_count && (
                        <p className="text-zinc-500 text-xs mt-1">
                          {tmdbData.vote_count.toLocaleString()} votos
                        </p>
                      )}
                    </div>
                  )}
                  
                  {tmdbData.release_date && (
                    <div>
                      <h3 className="text-zinc-400 text-sm font-semibold mb-2">Lançamento</h3>
                      <p className="text-white">
                        {new Date(tmdbData.release_date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  
                  {tmdbData.runtime && (
                    <div>
                      <h3 className="text-zinc-400 text-sm font-semibold mb-2">Duração</h3>
                      <p className="text-white">
                        {Math.floor(tmdbData.runtime / 60)}h {tmdbData.runtime % 60}m
                      </p>
                    </div>
                  )}
                  
                  {tmdbData.original_language && (
                    <div>
                      <h3 className="text-zinc-400 text-sm font-semibold mb-2">Idioma Original</h3>
                      <p className="text-white uppercase">
                        {tmdbData.original_language}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Diretores e Elenco (se disponível) */}
                {tmdbData.production_companies && tmdbData.production_companies.length > 0 && (
                  <div>
                    <h3 className="text-zinc-400 text-sm font-semibold mb-2">Produção</h3>
                    <p className="text-white">
                      {tmdbData.production_companies.map((c: any) => c.name).join(', ')}
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
