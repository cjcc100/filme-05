import { config } from '@/lib/config';

// Mapeamento manual para filmes que dão problema na busca automática (backup)
const MANUAL_MAPPING: Record<string, number> = {
  'gigantes de aço': 39254,
  'gigantes de aco': 39254,
  'quarteto fantastico': 617126,
  'quarteto fantastico primeiros passos': 617126,
  'a ultima casa': 1284041,
  'ultima casa': 1284041,
  'avenida brasil': 45815,
};

export async function GET() {
  try {
    // Buscar arquivos do Streamtape
    const streamtapeLogin = config.streamtape.login;
    const streamtapeKey = config.streamtape.key;
    
    const streamtapeRes = await fetch(`${config.streamtape.apiUrl}/file/listfolder?login=${streamtapeLogin}&key=${streamtapeKey}&folder=`, {
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

    // Função melhorada para limpar nome do arquivo com remoção de acentos
    function cleanFileName(filename: string): string {
      return filename
        .split('.')[0] // Remover extensão (tudo após o primeiro ponto)
        .replace(/\d{4}/g, '') // Remover anos de 4 dígitos
        .replace(/\[.*?\]/g, '') // Remover conteúdo entre colchetes
        .replace(/\(.*?\)/g, '') // Remover conteúdo entre parênteses
        .replace(/[._-]/g, ' ') // Substituir separadores por espaço
        .replace(/\s+/g, ' ') // Remover espaços extras
        .normalize('NFD') // Normalizar caracteres acentuados
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .trim()
        .toLowerCase();
    }

    // Buscar no TMDb para cada arquivo
    const tmdbApiKey = config.tmdb.apiKey;
    const mapping: Record<string, string> = {};

    for (const file of files) {
      const fileName = file.name || '';
      if (!fileName) continue;

      const cleanName = cleanFileName(fileName);
      if (cleanName.length < 3) continue;

      try {
        // Verificar mapeamento manual primeiro
        const normalizedName = cleanName.toLowerCase();
        let tmdbId: string | null = null;
        
        if (MANUAL_MAPPING[normalizedName]) {
          tmdbId = MANUAL_MAPPING[normalizedName].toString();
          console.log(`Using manual mapping for: ${fileName} -> TMDb ID: ${tmdbId}`);
        } else {
          // Buscar no TMDb como filme primeiro
          const searchRes = await fetch(
            `${config.tmdb.baseUrl}/search/movie?api_key=${tmdbApiKey}&language=pt-BR&query=${encodeURIComponent(cleanName)}`
          );

          if (searchRes.ok) {
            const searchData = await searchRes.json();
            if (searchData.results && searchData.results.length > 0) {
              tmdbId = searchData.results[0].id.toString();
            }
          }
          
          // Se não encontrou como filme, buscar como série (TV)
          if (!tmdbId) {
            const tvSearchRes = await fetch(
              `${config.tmdb.baseUrl}/search/tv?api_key=${tmdbApiKey}&language=pt-BR&query=${encodeURIComponent(cleanName)}`
            );

            if (tvSearchRes.ok) {
              const tvSearchData = await tvSearchRes.json();
              if (tvSearchData.results && tvSearchData.results.length > 0) {
                tmdbId = tvSearchData.results[0].id.toString();
                console.log(`Found as TV series: ${fileName} -> TMDb ID: ${tmdbId}`);
              }
            }
          }
        }
        
        if (tmdbId) {
          mapping[tmdbId] = file.linkid;
          console.log(`Mapped: ${fileName} -> TMDb ID: ${tmdbId}, Streamtape File ID: ${file.linkid}`);
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