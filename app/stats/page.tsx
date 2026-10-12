import { config } from "@/lib/config";
import { redirect } from "next/navigation";

// Senha para acessar a página de estatísticas
const STATS_PASSWORD = process.env.STATS_PASSWORD || "admin123";

async function getStreamtapeFiles() {
  try {
    const streamtapeLogin = config.streamtape.login;
    const streamtapeKey = config.streamtape.key;
    
    const res = await fetch(`${config.streamtape.apiUrl}/file/listfolder?login=${streamtapeLogin}&key=${streamtapeKey}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 0 } // Sem cache para dados em tempo real
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    if (data.status !== 200 || !data.result?.files) return null;
    
    return data.result.files;
  } catch (error) {
    console.error('Error fetching Streamtape files:', error);
    return null;
  }
}

async function getStreamtapeFolders() {
  try {
    const streamtapeLogin = config.streamtape.login;
    const streamtapeKey = config.streamtape.key;
    
    const res = await fetch(`${config.streamtape.apiUrl}/file/listfolder?login=${streamtapeLogin}&key=${streamtapeKey}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 0 }
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    if (data.status !== 200 || !data.result?.folders) return null;
    
    return data.result.folders;
  } catch (error) {
    console.error('Error fetching Streamtape folders:', error);
    return null;
  }
}

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ password?: string }> }) {
  const params = await searchParams;
  const password = params.password || '';
  
  // Verificar senha
  if (password !== STATS_PASSWORD) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
        <div className="bg-zinc-800 p-8 rounded-xl shadow-2xl max-w-md w-full">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">Acesso Restrito</h1>
          <p className="text-zinc-400 mb-6 text-center">Digite a senha para acessar as estatísticas</p>
          <form className="space-y-4">
            <input
              type="password"
              name="password"
              placeholder="Senha"
              className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-red-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Acessar
            </button>
          </form>
        </div>
      </div>
    );
  }
  
  // Buscar dados do Streamtape
  const files = await getStreamtapeFiles();
  const folders = await getStreamtapeFolders();
  
  const totalFiles = files?.length || 0;
  const totalFolders = folders?.length || 0;
  
  // Calcular tamanho total dos arquivos
  const totalSize = files?.reduce((acc: number, file: any) => acc + (file.size || 0), 0) || 0;
  const totalSizeGB = (totalSize / (1024 * 1024 * 1024)).toFixed(2);
  
  // Filtrar pastas de sistema
  const systemFolders = folders?.filter((f: any) => 
    f.name === 'Subtitles' || f.name === 'Thumbnails'
  ).length || 0;
  const contentFolders = totalFolders - systemFolders;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Estatísticas do Streamtape</h1>
          <p className="text-zinc-400">Monitoramento de arquivos e séries</p>
        </div>
        
        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
            <div className="text-3xl font-bold text-red-500 mb-2">{totalFiles}</div>
            <div className="text-zinc-400">Total de Arquivos</div>
          </div>
          
          <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
            <div className="text-3xl font-bold text-blue-500 mb-2">{contentFolders}</div>
            <div className="text-zinc-400">Séries/Novelas</div>
          </div>
          
          <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
            <div className="text-3xl font-bold text-green-500 mb-2">{totalSizeGB} GB</div>
            <div className="text-zinc-400">Espaço Total</div>
          </div>
          
          <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
            <div className="text-3xl font-bold text-yellow-500 mb-2">{systemFolders}</div>
            <div className="text-zinc-400">Pastas de Sistema</div>
          </div>
        </div>
        
        {/* Lista de arquivos */}
        <div className="bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden">
          <div className="p-6 border-b border-zinc-700">
            <h2 className="text-xl font-bold text-white">Arquivos Recentes</h2>
            <p className="text-zinc-400 text-sm mt-1">Últimos 20 arquivos adicionados</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Tamanho</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Link ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-700">
                {files?.slice(0, 20).map((file: any, index: number) => (
                  <tr key={index} className="hover:bg-zinc-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {file.name || 'Sem nome'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                      {file.size ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400 font-mono">
                      {file.linkid || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Lista de séries */}
        <div className="bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden mt-8">
          <div className="p-6 border-b border-zinc-700">
            <h2 className="text-xl font-bold text-white">Séries e Novelas</h2>
            <p className="text-zinc-400 text-sm mt-1">Todas as pastas de conteúdo</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Folder ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Arquivos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-700">
                {folders?.filter((f: any) => f.name !== 'Subtitles' && f.name !== 'Thumbnails').map((folder: any, index: number) => (
                  <tr key={index} className="hover:bg-zinc-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {folder.name || 'Sem nome'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400 font-mono">
                      {folder.id || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                      {folder.file_count || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Informação sobre detecção de exclusões */}
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-xl p-6 mt-8">
          <h3 className="text-yellow-500 font-bold mb-2">⚠️ Funcionalidade em Desenvolvimento</h3>
          <p className="text-zinc-300 text-sm">
            A detecção automática de arquivos excluídos está sendo desenvolvida. 
            Em breve você poderá receber alertas quando o Streamtape remover arquivos.
            Para o backup em S3, precisaremos configurar o AWS SDK e criar um sistema de upload automático.
          </p>
        </div>
      </div>
    </div>
  );
}
