import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const endpoint = searchParams.get('endpoint') || 'trending/movie/day';
  const page = searchParams.get('page') || '1';

  try {
    const url = new URL(`${config.tmdb.baseUrl}/${endpoint}`);
    url.searchParams.append('api_key', config.tmdb.apiKey);
    url.searchParams.append('language', 'pt-BR');
    
    if (page) {
      url.searchParams.append('page', page);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 }, // Revalidar a cada hora
    });

    if (!response.ok) {
      throw new Error(`TMDb API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from TMDb:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from TMDb' },
      { status: 500 }
    );
  }
}
