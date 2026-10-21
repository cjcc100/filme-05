'use client';

import { useState, useEffect, useRef } from 'react';
import { getStreamUrl } from '@/lib/stream';
import { saveWatchHistory, updateWatchPosition } from '@/lib/history';

interface VideoPlayerProps {
  fileName: string;
  movieTitle?: string;
  moviePoster?: string;
  tmdbId?: string;
  onClose: () => void;
}

export default function VideoPlayer({ 
  fileName, 
  movieTitle = 'Sem título',
  moviePoster = '',
  tmdbId,
  onClose 
}: VideoPlayerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [plyrLoaded, setPlyrLoaded] = useState(false);
  const streamUrl = getStreamUrl(fileName);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);

  // Carregar Plyr CSS e JS
  useEffect(() => {
    if (plyrLoaded) return;

    // Carregar CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.plyr.io/3.8.4/plyr.css';
    document.head.appendChild(link);

    // Carregar JS
    const script = document.createElement('script');
    script.src = 'https://cdn.plyr.io/3.8.4/plyr.js';
    script.async = true;
    script.onload = () => {
      setPlyrLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.body.removeChild(script);
    };
  }, [plyrLoaded]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Inicializar Plyr
  useEffect(() => {
    if (!videoRef.current || !plyrLoaded || !isVisible) return;

    // @ts-ignore
    const player = new (window as any).Plyr('#player', {
      controls: [
        'play-large',
        'play',
        'progress',
        'current-time',
        'mute',
        'volume',
        'captions',
        'settings',
        'pip',
        'airplay',
        'fullscreen',
      ],
      previewThumbnails: {
        enabled: false,
      },
    });

    playerRef.current = player;

    // Salvar histórico quando o vídeo carregar
    player.on('ready', async () => {
      const duration = player.duration;
      console.log('Vídeo carregado, duração:', duration);
      console.log('Salvando histórico com tmdb_id:', tmdbId);
      await saveWatchHistory({
        titulo: movieTitle,
        capa_url: moviePoster,
        duracao_total: Math.floor(duration),
        posicao_segundos: 0,
        status: 'assistindo',
        ultimo_acesso: new Date().toISOString(),
        tmdb_id: tmdbId,
      });
    });

    // Tracking de progresso
    let saveInterval: NodeJS.Timeout;

    player.on('play', () => {
      console.log('Video iniciado');
      saveInterval = setInterval(() => {
        const duration = player.duration;
        const currentTime = player.currentTime;
        if (duration > 0) {
          updateWatchPosition(
            movieTitle,
            Math.floor(currentTime),
            Math.floor(duration),
            tmdbId
          );
        }
      }, 10000);
    });

    player.on('pause', () => {
      console.log('Video pausado');
      if (saveInterval) {
        clearInterval(saveInterval);
      }
      const duration = player.duration;
      const currentTime = player.currentTime;
      if (duration > 0) {
        updateWatchPosition(
          movieTitle,
          Math.floor(currentTime),
          Math.floor(duration),
          tmdbId
        );
      }
    });

    player.on('ended', () => {
      console.log('Video finalizado');
      if (saveInterval) {
        clearInterval(saveInterval);
      }
      const duration = player.duration;
      if (duration > 0) {
        updateWatchPosition(
          movieTitle,
          Math.floor(duration),
          Math.floor(duration),
          tmdbId
        );
      }
    });

    return () => {
      if (saveInterval) {
        clearInterval(saveInterval);
      }
      if (player) {
        player.destroy();
      }
    };
  }, [plyrLoaded, isVisible, streamUrl, movieTitle, moviePoster, tmdbId]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        handleClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible]);

  const handleClose = async () => {
    // Salvar posição final antes de fechar
    if (playerRef.current) {
      const duration = playerRef.current.duration;
      const currentTime = playerRef.current.currentTime;
      if (duration > 0) {
        await updateWatchPosition(
          movieTitle,
          Math.floor(currentTime),
          Math.floor(duration),
          tmdbId
        );
      }
    }

    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] bg-black/90 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div
        className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ${
          isVisible ? 'scale-100' : 'scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full max-w-6xl mx-4">
          <div className="relative w-full aspect-video bg-zinc-900 rounded-lg overflow-hidden">
            <video
              id="player"
              ref={videoRef}
              src={streamUrl}
              playsInline
              controls
              data-poster={moviePoster || undefined}
            />
          </div>

          <button
            onClick={handleClose}
            className="mt-4 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 mx-auto hover:scale-105 hover:shadow-lg hover:shadow-red-500/50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
