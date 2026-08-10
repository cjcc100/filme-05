export async function GET() {
  try {
    const useStreamtape = process.env.USE_STREAMTAPE === 'true';
    
    let videos: any[] = [];
    
    if (useStreamtape) {
      // Buscar arquivos do Streamtape
      const login = process.env.STREAMTAPE_LOGIN || '';
      const key = process.env.STREAMTAPE_KEY || '';
      
      if (!login || !key) {
        throw new Error('Streamtape credentials not configured');
      }
      
      const streamtapeRes = await fetch(`https://api.streamtape.com/file/listfolder?login=${login}&key=${key}`);

      if (!streamtapeRes.ok) {
        throw new Error('Failed to fetch Streamtape files');
      }

      const streamtapeData = await streamtapeRes.json();
      
      if (streamtapeData.status !== 200) {
        throw new Error(`Streamtape API error: ${streamtapeData.msg}`);
      }
      
      videos = streamtapeData.result?.files || [];
    } else {
      // Buscar vídeos do Bunny CDN
      const bunnyRes = await fetch('https://video.bunnycdn.com/library/722927/videos', {
        headers: {
          'Accept': 'application/json',
          'AccessKey': '1b6e3939-400b-40eb-98d3945f90fe-85f3-4570',
        },
      });

      if (!bunnyRes.ok) {
        throw new Error('Failed to fetch Bunny videos');
      }

      const bunnyData = await bunnyRes.json();
      videos = bunnyData.items || [];
    }

    // Função para limpar nome do arquivo
    function cleanFileName(filename: string): string {
      return filename
        .replace(/\.[^/.]+$/, '') // Remover extensão
        .replace(/\d+/g, '') // Remover números
        .replace(/[._-]/g, ' ') // Substituir separadores por espaço
        .replace(/\s+/g, ' ') // Remover espaços extras
        .trim()
        .toLowerCase();
    }

    // Buscar no TMDb para cada vídeo
    const tmdbApiKey = '07c1396db17afadc024cbb5f0c3701c2';
    const mapping: Record<string, string> = {};

    for (const video of videos) {
      // Pular vídeos que são parte de coleções (séries) no Bunny
      if (!useStreamtape && video.collectionId) continue;

      const fileName = video.name || video.title || video.originalFilename || '';
      if (!fileName) continue;

      const cleanName = cleanFileName(fileName);
      if (cleanName.length < 3) continue;

      try {
        // Buscar no TMDb
        const searchRes = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&language=pt-BR&query=${encodeURIComponent(cleanName)}`
        );

        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData.results && searchData.results.length > 0) {
            const tmdbId = searchData.results[0].id.toString();
            // Usar linkid do Streamtape ou guid do Bunny
            const videoId = useStreamtape ? video.linkid : video.guid;
            mapping[tmdbId] = videoId;
            console.log(`Mapped: ${fileName} -> TMDb ID: ${tmdbId}, Video ID: ${videoId}`);
          }
        }
      } catch (error) {
        console.error(`Error searching TMDb for ${fileName}:`, error);
      }
    }

    return Response.json({ mapping, useStreamtape });
  } catch (error) {
    console.error('Error creating mapping:', error);
    return Response.json({ error: 'Failed to create mapping' }, { status: 500 });
  }
}