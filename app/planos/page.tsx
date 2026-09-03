import Link from "next/link";
import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function PlanosPage() {
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
              <Link href="/#filmes" className="text-zinc-300 hover:text-white transition-colors">Filmes</Link>
              <Link href="/#series" className="text-zinc-300 hover:text-white transition-colors">Séries</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Escolha o plano ideal para você
            </h1>
            <p className="text-zinc-300 text-lg">
              Assine e aproveite todos os filmes e séries sem limites
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Plano Básico */}
            <div className="bg-zinc-800/50 rounded-2xl p-8 backdrop-blur-sm border border-zinc-700 hover:border-red-500/50 transition-colors">
              <h2 className="text-2xl font-bold text-white mb-2">Básico</h2>
              <p className="text-zinc-400 mb-6">Para quem quer começar</p>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">R$ 19,90</span>
                <span className="text-zinc-400">/mês</span>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-zinc-300">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Qualidade SD</span>
                </li>
                <li className="flex items-center gap-2 text-zinc-300">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>1 tela simultânea</span>
                </li>
                <li className="flex items-center gap-2 text-zinc-300">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Catálogo completo</span>
                </li>
                <li className="flex items-center gap-2 text-zinc-300">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Cancelamento a qualquer momento</span>
                </li>
              </ul>

              <button className="w-full bg-zinc-700 hover:bg-zinc-600 text-white py-3 rounded-lg font-semibold transition-colors">
                Assinar Básico
              </button>
            </div>

            {/* Plano Padrão - Destaque */}
            <div className="bg-gradient-to-b from-red-600/20 to-zinc-800/50 rounded-2xl p-8 backdrop-blur-sm border-2 border-red-500 relative transform md:scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Mais Popular
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">Padrão</h2>
              <p className="text-zinc-400 mb-6">Para assistir em HD</p>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">R$ 29,90</span>
                <span className="text-zinc-400">/mês</span>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-zinc-300">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Qualidade HD</span>
                </li>
                <li className="flex items-center gap-2 text-zinc-300">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>2 telas simultâneas</span>
                </li>
                <li className="flex items-center gap-2 text-zinc-300">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Catálogo completo</span>
                </li>
                <li className="flex items-center gap-2 text-zinc-300">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Download para offline</span>
                </li>
                <li className="flex items-center gap-2 text-zinc-300">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Cancelamento a qualquer momento</span>
                </li>
              </ul>

              <button className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-colors">
                Assinar Padrão
              </button>
            </div>

            {/* Plano Premium */}
            <div className="bg-zinc-800/50 rounded-2xl p-8 backdrop-blur-sm border border-zinc-700 hover:border-red-500/50 transition-colors">
              <h2 className="text-2xl font-bold text-white mb-2">Premium</h2>
              <p className="text-zinc-400 mb-6">A melhor experiência</p>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">R$ 39,90</span>
                <span className="text-zinc-400">/mês</span>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-zinc-300">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Qualidade 4K Ultra HD</span>
                </li>
                <li className="flex items-center gap-2 text-zinc-300">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>4 telas simultâneas</span>
                </li>
                <li className="flex items-center gap-2 text-zinc-300">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Catálogo completo</span>
                </li>
                <li className="flex items-center gap-2 text-zinc-300">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Download para offline</span>
                </li>
                <li className="flex items-center gap-2 text-zinc-300">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Áudio Dolby Atmos</span>
                </li>
                <li className="flex items-center gap-2 text-zinc-300">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Cancelamento a qualquer momento</span>
                </li>
              </ul>

              <button className="w-full bg-zinc-700 hover:bg-zinc-600 text-white py-3 rounded-lg font-semibold transition-colors">
                Assinar Premium
              </button>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-zinc-400 mb-4">
              Todos os planos incluem acesso completo ao catálogo
            </p>
            <Link 
              href="/"
              className="inline-block text-red-500 hover:text-red-400 transition-colors"
            >
              Voltar para a página inicial
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