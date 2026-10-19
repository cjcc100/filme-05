import { NextRequest, NextResponse } from 'next/server';
import base44 from '@/lib/base44';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    console.log('Tentando registrar usuário:', { name, email });

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    // Criar novo usuário - sem created_at (Base44 pode gerar automaticamente)
    console.log('Criando novo usuário...');
    const newUser = await base44.entities.User.create({
      name,
      email,
      password // Em produção, deve-se hashear a senha
    });
    console.log('Usuário criado:', newUser);

    return NextResponse.json(
      { message: 'Usuário criado com sucesso', user: newUser },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erro ao registrar usuário:', error);
    console.error('Detalhes do erro:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: 'Erro ao criar usuário', details: error.message || error.toString() },
      { status: 500 }
    );
  }
}
