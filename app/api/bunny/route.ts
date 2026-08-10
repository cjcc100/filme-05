import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fileId = searchParams.get('fileId');
  const folderId = searchParams.get('folderId');
  const action = searchParams.get('action') || 'list';

  try {
    let url: URL;
    
    if (action === 'list') {
      // Listar todos os arquivos da pasta (usando root folder)
      url = new URL(`${config.streamtape.apiUrl}/file/listfolder`);
      url.searchParams.append('login', config.streamtape.login);
      url.searchParams.append('key', config.streamtape.key);
      if (folderId) {
        url.searchParams.append('folder', folderId);
      }
      console.log('Streamtape API - Fetching files:', url.toString());
    } else if (action === 'file' && fileId) {
      // Obter detalhes de um arquivo específico
      url = new URL(`${config.streamtape.apiUrl}/file/info`);
      url.searchParams.append('login', config.streamtape.login);
      url.searchParams.append('key', config.streamtape.key);
      url.searchParams.append('file', fileId);
      console.log('Streamtape API - Fetching file:', url.toString());
    } else if (action === 'folder' && folderId) {
      // Listar arquivos de uma pasta específica
      url = new URL(`${config.streamtape.apiUrl}/file/listfolder`);
      url.searchParams.append('login', config.streamtape.login);
      url.searchParams.append('key', config.streamtape.key);
      url.searchParams.append('folder', folderId);
      console.log('Streamtape API - Fetching folder:', url.toString());
    } else {
      url = new URL(`${config.streamtape.apiUrl}/account/info`);
      url.searchParams.append('login', config.streamtape.login);
      url.searchParams.append('key', config.streamtape.key);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 1800 }, // Revalidar a cada 30 minutos
    });

    console.log('Streamtape API - Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Streamtape API - Error response:', errorText);
      throw new Error(`Streamtape API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Streamtape API - Response data keys:', Object.keys(data));
    
    if (action === 'list') {
      console.log('Streamtape API - Files count:', data?.result?.files?.length || 0);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from Streamtape:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from Streamtape', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
