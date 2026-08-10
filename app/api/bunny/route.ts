import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get('videoId');
  const collectionId = searchParams.get('collectionId');
  const action = searchParams.get('action') || 'list';

  try {
    let url: URL;
    
    if (action === 'list') {
      // Listar todos os vídeos da biblioteca
      url = new URL(`${config.bunny.apiUrl}/${config.bunny.videoLibraryId}/videos`);
      url.searchParams.append('page', searchParams.get('page') || '0');
      url.searchParams.append('itemsPerPage', searchParams.get('itemsPerPage') || '20');
      console.log('Bunny API - Fetching videos:', url.toString());
    } else if (action === 'video' && videoId) {
      // Obter detalhes de um vídeo específico
      url = new URL(`${config.bunny.apiUrl}/${config.bunny.videoLibraryId}/videos/${videoId}`);
      console.log('Bunny API - Fetching video:', url.toString());
    } else if (action === 'collections') {
      // Listar todas as coleções
      url = new URL(`${config.bunny.apiUrl}/${config.bunny.videoLibraryId}/collections`);
      console.log('Bunny API - Fetching collections:', url.toString());
    } else if (action === 'collection' && collectionId) {
      // Obter vídeos de uma coleção específica
      url = new URL(`${config.bunny.apiUrl}/${config.bunny.videoLibraryId}/collections/${collectionId}`);
      console.log('Bunny API - Fetching collection:', url.toString());
    } else {
      url = new URL(`${config.bunny.apiUrl}/${config.bunny.videoLibraryId}`);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'AccessKey': config.bunny.apiKey, // Usar API key principal para acessar vídeos privados
      },
      next: { revalidate: 1800 }, // Revalidar a cada 30 minutos
    });

    console.log('Bunny API - Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Bunny API - Error response:', errorText);
      throw new Error(`Bunny.net API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Bunny API - Response data keys:', Object.keys(data));
    
    if (action === 'list') {
      console.log('Bunny API - Items count:', data?.items?.length || 0);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from Bunny.net:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from Bunny.net', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
