'use client';

import { useState, useEffect } from 'react';

interface WatchButtonProps {
  videoId: string;
}

export default function WatchButton({ videoId }: WatchButtonProps) {
  const [showPlayer, setShowPlayer] = useState(false);

  const handleWatch = () => {
    setShowPlayer(true);
  };

  const handleClosePlayer = () => {
    setShowPlayer(false);
  };

  // Fechar com tecla ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showPlayer) {
        handleClosePlayer();
      }
    };

    if (showPlayer) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showPlayer]);

  return (
    <>
      <button 
        onClick={handleWatch}
        className="bg-white text-black px-8 py-3 rounded-lg font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-2"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
        Assistir
      </button>

      {showPlayer && (
        <div 
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
          onClick={handleClosePlayer}
        >
          <div 
            className="relative w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full aspect-video bg-zinc-900 rounded-lg overflow-hidden">
              <iframe
                src={`https://streamtape.com/e/${videoId}`}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
            
            <button
              onClick={handleClosePlayer}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
