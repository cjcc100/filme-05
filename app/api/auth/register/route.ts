import { NextRequest, NextResponse } from 'next/server';
import base44 from '@/lib/base44';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o usuário já existe
    const existingUsers = await base44.entities.User.filter({ email });
    
    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'E-mail já cadastrado' },
        { status: 400 }
      );
    }

    // Criar novo usuário
    const newUser = await base44.entities.User.create({
      name,
      email,
      password, // Em produção, deve-se hashear a senha
      created_at: new Date().toISOString()
    });

    return NextResponse.json(
      { message: 'Usuário criado com sucesso', user: newUser },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
}
