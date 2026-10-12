"use client";

import { useState } from "react";

interface Snapshot {
  id: number;
  timestamp: string;
  totalFiles: number;
}

interface StatsClientProps {
  snapshots: Snapshot[];
}

export default function StatsClient({ snapshots: initialSnapshots }: StatsClientProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>(initialSnapshots);
  
  const handleSaveSnapshot = async () => {
    const res = await fetch('/api/snapshot', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert('Snapshot salvo com sucesso!');
      window.location.reload();
    } else {
      alert('Erro ao salvar snapshot');
    }
  };
  
  const handleCompareSnapshot = async (snapshotId: number) => {
    const res = await fetch(`/api/snapshot?compare=${snapshotId}`);
    const data = await res.json();
    if (data.success && data.comparison.removed.count > 0) {
      alert(`Arquivos removidos desde este snapshot: ${data.comparison.removed.count}\n\n${data.comparison.removed.files.map((f: any) => f.name).join('\n')}`);
    } else if (data.success) {
      alert('Nenhum arquivo removido desde este snapshot');
    } else {
      alert('Erro ao comparar snapshots');
    }
  };
  
  return (
    <div className="p-6">
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleSaveSnapshot}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          💾 Salvar Snapshot Atual
        </button>
      </div>
      
      {snapshots.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-white font-semibold">Snapshots Anteriores:</h3>
          {snapshots.map((snapshot) => (
            <div key={snapshot.id} className="bg-zinc-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="text-white font-medium">
                  {new Date(snapshot.timestamp).toLocaleString('pt-BR')}
                </div>
                <div className="text-zinc-400 text-sm">
                  {snapshot.totalFiles} arquivos
                </div>
              </div>
              <button
                onClick={() => handleCompareSnapshot(snapshot.id)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                🔍 Comparar com Atual
              </button>
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
