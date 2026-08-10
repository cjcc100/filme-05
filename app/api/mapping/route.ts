export async function GET() {
  try {
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
    const videos = bunnyData.items || [];

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
      if (video.collectionId) continue; // Pular vídeos que são parte de coleções (séries)

      const fileName = video.title || video.name || video.originalFilename || '';
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
            mapping[tmdbId] = video.guid;
            console.log(`Mapped: ${fileName} -> TMDb ID: ${tmdbId}, Bunny GUID: ${video.guid}`);
          }
        }
      } catch (error) {
        console.error(`Error searching TMDb for ${fileName}:`, error);
      }
    }

    return Response.json({ mapping });
  } catch (error) {
    console.error('Error creating mapping:', error);
    return Response.json({ error: 'Failed to create mapping' }, { status: 500 });
  }
}