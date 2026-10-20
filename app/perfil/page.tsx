'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@base44/sdk';

const base44 = createClient({ appId: "6ad60db65ef6337559a9c1dc" });

export default function PerfilPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      setName(userData.nome_completo || '');
    } catch (error) {
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await base44.auth.updateMe({ nome_completo: name });
      setUser({ ...user, nome_completo: name });
      setEditing(false);
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      alert('Erro ao atualizar perfil');
    }
  };

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Carregando...</div>
        </div>
      </div>
    );
  }

  const initials = user.nome_completo
    ? user.nome_completo
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email
        .split('@')[0]
        .slice(0, 2)
        .toUpperCase();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      <header className="sticky top-0 z-50 bg-zinc-900/30 backdrop-blur-md border-b border-zinc-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-white font-semibold text-lg">CJCCHUB</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-zinc-300 hover:text-white transition-colors">Início</Link>
              <Link href="/" className="text-zinc-300 hover:text-white transition-colors">Filmes</Link>
              <Link href="/series" className="text-zinc-300 hover:text-white transition-colors">Séries</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700 rounded-2xl p-8">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {initials}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {user.nome_completo || 'Usuário'}
                </h1>
                <p className="text-zinc-400">{user.email}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Nome completo
                </label>
                {editing ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="flex-1 bg-zinc-700/50 border border-zinc-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <button
                      onClick={handleUpdate}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setName(user.nome_completo || '');
                      }}
                      className="bg-zinc-600 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-white text-lg">{user.nome_completo || 'Não definido'}</p>
                    <button
                      onClick={() => setEditing(true)}
                      className="text-red-500 hover:text-red-400 transition-colors"
                    >
                      Editar
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  E-mail
                </label>
                <p className="text-white text-lg">{user.email}</p>
              </div>

              <div className="border-t border-zinc-700 pt-6">
                <button
                  onClick={handleLogout}
                  className="w-full bg-zinc-700 hover:bg-zinc-600 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Sair da conta
                </button>
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link
              href="/"
              className="inline-block text-zinc-400 hover:text-white transition-colors text-sm"
            >
              ← Voltar para a página inicial
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-zinc-900 border-t border-zinc-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-zinc-400">
          <p>CJCCHUB - Plataforma de Streaming</p>
        </div>
      </footer>
    </div>
  );
}
