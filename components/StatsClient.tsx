"use client";

import { useState, useRef } from "react";

interface Snapshot {
  id: number;
  timestamp: string;
  totalFiles: number;
}

interface ComparisonResult {
  removed: {
    count: number;
    files: Array<{
      name: string;
      linkid: string;
      size: number;
      folderName: string;
      folderId: string | null;
    }>;
  };
  added: {
    count: number;
    files: any[];
  };
}

interface StatsClientProps {
  snapshots: Snapshot[];
}

export default function StatsClient({ snapshots: initialSnapshots }: StatsClientProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>(initialSnapshots);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleSaveSnapshot = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/snapshot', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('Snapshot salvo com sucesso!');
        window.location.reload();
      } else {
        alert('Erro ao salvar snapshot');
      }
    } catch (error) {
      alert('Erro ao salvar snapshot');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCompareSnapshot = async (snapshotId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/snapshot?compare=${snapshotId}`);
      const data = await res.json();
      if (data.success) {
        setComparison(data.comparison);
      } else {
        alert('Erro ao comparar snapshots');
      }
    } catch (error) {
      alert('Erro ao comparar snapshots');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteSnapshot = async (snapshotId: number) => {
    if (!confirm('Tem certeza que deseja excluir este snapshot?')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/snapshot/upload?id=${snapshotId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert('Snapshot excluído com sucesso!');
        window.location.reload();
      } else {
        alert('Erro ao excluir snapshot');
      }
    } catch (error) {
      alert('Erro ao excluir snapshot');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownloadSnapshot = async (snapshotId: number) => {
    try {
      const res = await fetch(`/api/snapshot`);
      const data = await res.json();
      if (data.success) {
        const snapshot = data.snapshots.find((s: any) => s.id === snapshotId);
        if (snapshot) {
          const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `snapshot-${snapshot.id}-${new Date(snapshot.timestamp).toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }
    } catch (error) {
      alert('Erro ao baixar snapshot');
    }
  };
  
  const handleUploadSnapshot = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    try {
      const text = await file.text();
      const snapshot = JSON.parse(text);
      
      // Verificar se é um snapshot válido
      if (!snapshot.id || !snapshot.timestamp || !snapshot.files) {
        alert('Arquivo inválido. Por favor, selecione um snapshot válido.');
        return;
      }
      
      // Adicionar snapshot via API
      const res = await fetch('/api/snapshot/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(snapshot)
      });
      
      const data = await res.json();
      if (data.success) {
        alert('Snapshot carregado com sucesso!');
        window.location.reload();
      } else {
        alert('Erro ao carregar snapshot: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error) {
      alert('Erro ao ler arquivo ou fazer upload');
    } finally {
      setLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const formatSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };
  
  return (
    <div className="p-6">
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleSaveSnapshot}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          💾 {loading ? 'Salvando...' : 'Salvar Snapshot Atual'}
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          📤 {loading ? 'Carregando...' : 'Carregar Snapshot'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleUploadSnapshot}
          className="hidden"
        />
      </div>
      
      {comparison && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 mb-6">
          <h3 className="text-red-500 font-bold text-lg mb-4">
            📊 Resultado da Comparação
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-zinc-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-500">{comparison.removed.count}</div>
              <div className="text-zinc-400 text-sm">Arquivos Removidos</div>
            </div>
            <div className="bg-zinc-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-500">{comparison.added.count}</div>
              <div className="text-zinc-400 text-sm">Arquivos Adicionados</div>
            </div>
          </div>
          
          {comparison.removed.count > 0 && (
            <div className="mt-4">
              <h4 className="text-white font-semibold mb-3">Arquivos que foram removidos:</h4>
              <div className="bg-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-zinc-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-zinc-300 uppercase">Nome</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-zinc-300 uppercase">Pasta</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-zinc-300 uppercase">Tamanho</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-zinc-300 uppercase">Link ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-700">
                    {comparison.removed.files.map((file, index) => (
                      <tr key={index} className="hover:bg-zinc-700">
                        <td className="px-4 py-2 text-sm text-white">{file.name}</td>
                        <td className="px-4 py-2 text-sm text-zinc-400">{file.folderName}</td>
                        <td className="px-4 py-2 text-sm text-zinc-400">{formatSize(file.size)}</td>
                        <td className="px-4 py-2 text-sm text-zinc-400 font-mono">{file.linkid}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                <h5 className="text-yellow-500 font-semibold mb-2">📋 Lista para Re-upload Manual:</h5>
                <p className="text-zinc-300 text-sm mb-2">
                  Para refazer o upload desses arquivos, você precisará:
                </p>
                <ul className="text-zinc-400 text-sm list-disc list-inside space-y-1">
                  <li>Ter os arquivos originais em backup local</li>
                  <li>Fazer upload manual para o Streamtape</li>
                  <li>Ou configurar backup automático em S3 (futuro)</li>
                </ul>
              </div>
            </div>
          )}
          
          <button
            onClick={() => setComparison(null)}
            className="mt-4 bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Fechar Comparação
          </button>
        </div>
      )}
      
      {snapshots.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-white font-semibold">Snapshots Anteriores:</h3>
          {snapshots.map((snapshot) => (
            <div key={snapshot.id} className="bg-zinc-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-white font-medium">
                    {new Date(snapshot.timestamp).toLocaleString('pt-BR')}
                  </div>
                  <div className="text-zinc-400 text-sm">
                    {snapshot.totalFiles} arquivos
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCompareSnapshot(snapshot.id)}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    🔍 Comparar
                  </button>
                  <button
                    onClick={() => handleDownloadSnapshot(snapshot.id)}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    ⬇️ Baixar
                  </button>
                  <button
                    onClick={() => handleDeleteSnapshot(snapshot.id)}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    🗑️ Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-zinc-400 text-center py-8">
          Nenhum snapshot salvo ainda. Clique em "Salvar Snapshot Atual" para começar.
        </div>
      )}
    </div>
  );
}
