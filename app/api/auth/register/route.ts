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

    // Verificar se o usuário já existe
    console.log('Verificando se usuário já existe...');
    const existingUsers = await base44.entities.User.filter({ email });
    console.log('Usuários existentes:', existingUsers);
    
    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'E-mail já cadastrado' },
        { status: 400 }
      );
    }

    // Criar novo usuário
    console.log('Criando novo usuário...');
    const newUser = await base44.entities.User.create({
      name,
      email,
      password, // Em produção, deve-se hashear a senha
      created_at: new Date().toISOString()
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
