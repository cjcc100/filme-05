import { NextRequest, NextResponse } from 'next/server';
import base44 from '@/lib/base44';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-mail e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar usuário pelo e-mail
    const users = await base44.entities.User.filter({ email });

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'E-mail ou senha incorretos' },
        { status: 401 }
      );
    }

    const user = users[0];

    // Verificar senha (em produção, deve-se comparar com hash)
    if (user.password !== password) {
      return NextResponse.json(
        { error: 'E-mail ou senha incorretos' },
        { status: 401 }
      );
    }

    // Retornar usuário sem a senha
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { message: 'Login realizado com sucesso', user: userWithoutPassword },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    );
  }
}
