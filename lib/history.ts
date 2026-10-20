import { createClient } from '@base44/sdk';

const base44 = createClient({ appId: "6ad60db65ef6337559a9c1dc" });

export interface WatchHistory {
  titulo: string;
  capa_url: string;
  duracao_total: number;
  posicao_segundos: number;
  status: 'assistindo' | 'assistido' | 'nao_assistido';
  ultimo_acesso: string;
  tmdb_id?: string;
}

/**
 * Salva o histórico de visualização no Base44
 * @param history Dados do histórico para salvar
 */
export async function saveWatchHistory(history: WatchHistory) {
  try {
    console.log('Salvando histórico:', history);

    // Primeiro verificar se já existe um registro para este filme
    const existingPage = await base44.entities.HistoricoFilme.filter({
      titulo: history.titulo
    }, { limit: 1 });

    if (existingPage.items && existingPage.items.length > 0) {
      // Se já existe, atualizar o registro
      const existingRecord = existingPage.items[0];
      const recordId = existingRecord.id;

      console.log('Registro já existe, atualizando...');
      console.log('Capa sendo salva:', history.capa_url);

      // Se o registro existente não tem capa mas o novo tem, atualizar a capa
      const updateData: any = {
        duracao_total: history.duracao_total,
        posicao_segundos: history.posicao_segundos,
        status: history.status,
        ultimo_acesso: history.ultimo_acesso,
        tmdb_id: history.tmdb_id,
      };

      // Só atualiza a capa se:
      // 1. O novo registro tem capa E o antigo não tem, OU
      // 2. O novo registro tem capa E é diferente da antiga
      if (history.capa_url && (!existingRecord.capa_url || existingRecord.capa_url !== history.capa_url)) {
        updateData.capa_url = history.capa_url;
      }

      await base44.entities.HistoricoFilme.update(recordId, updateData);

      console.log('Histórico atualizado com sucesso');
      return true;
    } else {
      // Se não existe, criar novo registro
      console.log('Criando novo registro...');
      await base44.entities.HistoricoFilme.create({
        titulo: history.titulo,
        capa_url: history.capa_url,
        duracao_total: history.duracao_total,
        posicao_segundos: history.posicao_segundos,
        status: history.status,
        ultimo_acesso: history.ultimo_acesso,
        tmdb_id: history.tmdb_id,
      });

      console.log('Histórico salvo com sucesso');
      return true;
    }
  } catch (error) {
    console.error('Erro ao salvar histórico:', error);
    return false;
  }
}

/**
 * Busca o histórico de visualização do usuário
 */
export async function getWatchHistory() {
  try {
    console.log('Buscando histórico...');

    const page = await base44.entities.HistoricoFilme.filter({}, {
      sort: "-ultimo_acesso",
      limit: 50
    });

    const history = page.items || [];

    // Para registros sem tmdb_id, tentar buscar pelo título usando TMDb
    const enrichedHistory = await Promise.all(
      history.map(async (item: any) => {
        if (!item.tmdb_id && item.titulo) {
          try {
            // Buscar no TMDb pelo título
            const searchResponse = await fetch(
              `https://api.themoviedb.org/3/search/movie?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&query=${encodeURIComponent(item.titulo)}&language=pt-BR`
            );
            const searchData = await searchResponse.json();

            if (searchData.results && searchData.results.length > 0) {
              const tmdbId = searchData.results[0].id;
              const posterPath = searchData.results[0].poster_path;

              // Atualizar o registro com tmdb_id e capa
              await base44.entities.HistoricoFilme.update(item.id, {
                tmdb_id: String(tmdbId),
                capa_url: posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : item.capa_url
              });

              console.log(`Atualizado registro ${item.titulo} com tmdb_id: ${tmdbId}`);

              return {
                ...item,
                tmdb_id: String(tmdbId),
                capa_url: posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : item.capa_url
              };
            }
          } catch (error) {
            console.log('Erro ao buscar tmdb_id para', item.titulo, error);
          }
        }
        return item;
      })
    );

    return enrichedHistory;
  } catch (error: any) {
    console.error('Erro ao buscar histórico:', error);

    // Se o erro for 401 (não autenticado), retorna array vazio
    if (error?.message?.includes('401') || error?.message?.includes('Authentication')) {
      console.log('Usuário não está logado');
      return [];
    }

    return [];
  }
}

/**
 * Atualiza a posição atual de um filme no histórico
 */
export async function updateWatchPosition(
  titulo: string,
  posicao_segundos: number,
  duracao_total: number,
  tmdbId?: string
) {
  try {
    console.log('Atualizando posição:', { titulo, posicao_segundos, duracao_total, tmdbId });

    // Calcular status baseado na posição
    const progresso = posicao_segundos / duracao_total;
    const status: WatchHistory['status'] =
      progresso >= 0.9 ? 'assistido' : 'assistindo';

    // Primeiro buscar o registro pelo tmdb_id (mais preciso) ou título
    let filter: any = { titulo };

    if (tmdbId) {
      filter = { tmdb_id: tmdbId };
    }

    const page = await base44.entities.HistoricoFilme.filter(filter, { limit: 1 });

    if (page.items && page.items.length > 0) {
      const existingRecord = page.items[0];
      const recordId = existingRecord.id;

      // Atualizar o registro existente
      await base44.entities.HistoricoFilme.update(recordId, {
        posicao_segundos,
        status,
        ultimo_acesso: new Date().toISOString(),
      });

      console.log('Posição atualizada com sucesso');
      return true;
    } else {
      console.log('Registro não encontrado, criando novo...');
      // Se não existir, criar novo registro
      await saveWatchHistory({
        titulo,
        capa_url: '',
        duracao_total,
        posicao_segundos,
        status,
        ultimo_acesso: new Date().toISOString(),
        tmdb_id: tmdbId,
      });
      return true;
    }
  } catch (error) {
    console.error('Erro ao atualizar posição:', error);
    return false;
  }
}
