import { NextResponse } from 'next/server';
import { getCatalogMovies } from '@/lib/catalog';

export async function GET() {
  try {
    const movies = await getCatalogMovies();
    return NextResponse.json(movies);
  } catch (error) {
    console.error('Erro ao buscar filmes:', error);
    return NextResponse.json({ error: 'Erro ao buscar filmes' }, { status: 500 });
  }
}
