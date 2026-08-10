export async function GET() {
  try {
    // Buscar arquivos do Streamtape
    const streamtapeLogin = '4db68bae5deec46b3a4b';
    const streamtapeKey = 'a7azDDb68ACx8dP';
    
    const streamtapeRes = await fetch(`https://api.streamtape.com/file/listfolder?login=${streamtapeLogin}&key=${streamtapeKey}&folder=`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!streamtapeRes.ok) {
      throw new Error('Failed to fetch Streamtape files');
    }

    const streamtapeData = await streamtapeRes.json();
    
    if (streamtapeData.status !== 200 || !streamtapeData.result?.files) {
      throw new Error('Invalid Streamtape response');
    }
    
    const files = streamtapeData.result.files || [];

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

    // Buscar no TMDb para cada arquivo
    const tmdbApiKey = '07c1396db17afadc024cbb5f0c3701c2';
    const mapping: Record<string, string> = {};

    for (const file of files) {
      const fileName = file.name || '';
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
            mapping[tmdbId] = file.linkid;
            console.log(`Mapped: ${fileName} -> TMDb ID: ${tmdbId}, Streamtape File ID: ${file.linkid}`);
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