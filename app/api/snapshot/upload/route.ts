import { NextRequest, NextResponse } from 'next/server';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'cjcc100/filme-05';
const GITHUB_BRANCH = 'main';

async function readSnapshotsFromGitHub(): Promise<any[]> {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/snapshots.json?ref=${GITHUB_BRANCH}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!res.ok) {
      if (res.status === 404) {
        return [];
      }
      throw new Error('Failed to fetch from GitHub');
    }
    
    const data = await res.json();
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading from GitHub:', error);
    return [];
  }
}

async function writeSnapshotsToGitHub(snapshots: any[]): Promise<void> {
  try {
    const getRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/snapshots.json?ref=${GITHUB_BRANCH}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    let sha = '';
    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
    }
    
    const content = Buffer.from(JSON.stringify(snapshots, null, 2)).toString('base64');
    
    const putRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/snapshots.json`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: sha ? 'Update snapshots (upload)' : 'Create snapshots file (upload)',
        content: content,
        sha: sha || undefined,
        branch: GITHUB_BRANCH
      })
    });
    
    if (!putRes.ok) {
      throw new Error('Failed to write to GitHub');
    }
  } catch (error) {
    console.error('Error writing to GitHub:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verificar se é um snapshot válido
    if (!body.id || !body.timestamp || !body.files) {
      return NextResponse.json({ error: 'Arquivo inválido. Formato de snapshot incorreto.' }, { status: 400 });
    }
    
    const snapshots = await readSnapshotsFromGitHub();
    
    // Verificar se já existe snapshot com esse ID
    if (snapshots.some((s: any) => s.id === body.id)) {
      return NextResponse.json({ error: 'Snapshot com este ID já existe no sistema' }, { status: 400 });
    }
    
    // Adicionar snapshot carregado
    snapshots.push(body);
    
    // Manter apenas os últimos 20 snapshots
    if (snapshots.length > 20) {
      snapshots.splice(0, snapshots.length - 20);
    }
    
    await writeSnapshotsToGitHub(snapshots);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Snapshot carregado com sucesso'
    });
  } catch (error) {
    console.error('Error uploading snapshot:', error);
    return NextResponse.json({ error: 'Failed to upload snapshot: ' + (error as Error).message }, { status: 500 });
  }
}
