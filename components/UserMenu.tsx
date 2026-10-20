'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@base44/sdk';

const base44 = createClient({ appId: "6ad60db65ef6337559a9c1dc" });

export default function UserMenu() {
  const [user, setUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  // Verificar usuário sempre que o componente for montado
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkUser();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const checkUser = async () => {
    try {
      const token = localStorage.getItem('base44_access_token');

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const userData = await base44.auth.me();
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
      setUser(null);
      setIsOpen(false);
      window.location.href = '/';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (loading) {
    return (
      <div className="w-10 h-10 bg-zinc-700 rounded-full animate-pulse" />
    );
  }

  if (!user) {
    return (
      <Link href="/planos" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors font-medium whitespace-nowrap">
        Entrar
      </Link>
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
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold hover:from-red-600 hover:to-orange-600 transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
      >
        {initials}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50">
            <div className="px-4 py-3 border-b border-zinc-700">
              <p className="text-white font-medium truncate">
                {user.nome_completo || 'Usuário'}
              </p>
              <p className="text-zinc-400 text-sm truncate">{user.email}</p>
            </div>
            <div className="py-2">
              <Link
                href="/perfil"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
              >
                Meu Perfil
              </Link>
              <Link
                href="/minha-lista"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
              >
                Minha Lista
              </Link>
            </div>
            <div className="border-t border-zinc-700 py-2">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-red-400 hover:bg-zinc-700 hover:text-red-300 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
