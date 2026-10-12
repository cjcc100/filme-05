import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

// Simples armazenamento em memória (para desenvolvimento)
// Em produção, use Vercel KV, Redis, ou banco de dados
let snapshots: any[] = [];

async function getStreamtapeFiles() {
  try {
    const streamtapeLogin = config.streamtape.login;
    const streamtapeKey = config.streamtape.key;
    
    const res = await fetch(`${config.streamtape.apiUrl}/file/listfolder?login=${streamtapeLogin}&key=${streamtapeKey}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    if (data.status !== 200 || !data.result) return null;
    
    // Arquivos na raiz
    const rootFiles = data.result.files || [];
    
    // Buscar arquivos dentro de cada pasta
    const folders = data.result.folders || [];
    const allFiles = [...rootFiles];
    
    // Para cada pasta, buscar seus arquivos
    for (const folder of folders) {
      if (folder.name === 'Subtitles' || folder.name === 'Thumbnails') continue;
      
      try {
        const folderRes = await fetch(`${config.streamtape.apiUrl}/file/listfolder?login=${streamtapeLogin}&key=${streamtapeKey}&folder=${folder.id}`, {
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (folderRes.ok) {
          const folderData = await folderRes.json();
          if (folderData.status === 200 && folderData.result?.files) {
            const folderFiles = folderData.result.files.map((file: any) => ({
              ...file,
              name: `${folder.name}/${file.name}`,
              folderName: folder.name,
              folderId: folder.id
            }));
            allFiles.push(...folderFiles);
          }
        }
      } catch (error) {
        console.error('Error fetching folder files:', folder.name, error);
      }
    }
    
    return allFiles;
  } catch (error) {
    console.error('Error fetching Streamtape files:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const files = await getStreamtapeFiles();
    
    if (!files) {
      return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
    }
    
    // Criar snapshot
    const snapshot = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      totalFiles: files.length,
      files: files.map((f: any) => ({
        name: f.name,
        linkid: f.linkid,
        size: f.size,
        folderName: f.folderName || 'Raiz',
        folderId: f.folderId || null
      }))
    };
    
    // Salvar snapshot (em memória para desenvolvimento)
    snapshots.push(snapshot);
    
    // Manter apenas os últimos 10 snapshots
    if (snapshots.length > 10) {
      snapshots = snapshots.slice(-10);
    }
    
    return NextResponse.json({ 
      success: true, 
      snapshot,
      message: 'Snapshot salvo com sucesso'
    });
  } catch (error) {
    console.error('Error creating snapshot:', error);
    return NextResponse.json({ error: 'Failed to create snapshot' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const compareId = searchParams.get('compare');
    
    if (compareId) {
      // Comparar snapshot específico com o mais recente
      const targetSnapshot = snapshots.find((s: any) => s.id === parseInt(compareId));
      const latestSnapshot = snapshots[snapshots.length - 1];
      
      if (!targetSnapshot || !latestSnapshot) {
        return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
      }
      
      // Detectar arquivos removidos
      const targetFileIds = new Set(targetSnapshot.files.map((f: any) => f.linkid));
      const latestFileIds = new Set(latestSnapshot.files.map((f: any) => f.linkid));
      
      const removedFiles = targetSnapshot.files.filter((f: any) => 
        !latestFileIds.has(f.linkid)
      );
      
      // Detectar arquivos adicionados
      const addedFiles = latestSnapshot.files.filter((f: any) => 
        !targetFileIds.has(f.linkid)
      );
      
      return NextResponse.json({
        success: true,
        comparison: {
          target: {
            id: targetSnapshot.id,
            timestamp: targetSnapshot.timestamp,
            totalFiles: targetSnapshot.totalFiles
          },
          latest: {
            id: latestSnapshot.id,
            timestamp: latestSnapshot.timestamp,
            totalFiles: latestSnapshot.totalFiles
          },
          removed: {
            count: removedFiles.length,
            files: removedFiles
          },
          added: {
            count: addedFiles.length,
            files: addedFiles
          }
        }
      });
    }
    
    // Retornar todos os snapshots
    return NextResponse.json({ 
      success: true, 
      snapshots: snapshots.reverse() // Mais recentes primeiro
    });
  } catch (error) {
    console.error('Error fetching snapshots:', error);
    return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 });
  }
}
