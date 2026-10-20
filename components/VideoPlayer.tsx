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
  const streamUrl = getStreamUrl(fileName);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Tracking de progresso do vídeo
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let saveInterval: NodeJS.Timeout;

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      const duration = video.duration;

      if (duration > 0) {
        // Salvar posição a cada 10 segundos
        console.log(`Progresso: ${currentTime}s / ${duration}s`);
      }
    };

    const handlePlay = () => {
      console.log('Video iniciado');
      // Iniciar timer para salvar posição
      saveInterval = setInterval(() => {
        if (video.duration > 0) {
          updateWatchPosition(
            movieTitle,
            Math.floor(video.currentTime),
            Math.floor(video.duration),
            tmdbId
          );
        }
      }, 10000); // Salva a cada 10 segundos
    };

    const handlePause = () => {
      console.log('Video pausado');
      if (saveInterval) {
        clearInterval(saveInterval);
      }
      // Salvar posição ao pausar
      if (video.duration > 0) {
        updateWatchPosition(
          movieTitle,
          Math.floor(video.currentTime),
          Math.floor(video.duration),
          tmdbId
        );
      }
    };

    const handleEnded = () => {
      console.log('Video finalizado');
      if (saveInterval) {
        clearInterval(saveInterval);
      }
      // Marcar como assistido
      updateWatchPosition(
        movieTitle,
        Math.floor(video.duration),
        Math.floor(video.duration),
        tmdbId
      );
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      if (saveInterval) {
        clearInterval(saveInterval);
      }
    };
  }, [movieTitle]);

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
    const video = videoRef.current;
    if (video && video.duration > 0) {
      await updateWatchPosition(
        movieTitle,
        Math.floor(video.currentTime),
        Math.floor(video.duration),
        tmdbId
      );
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
              ref={videoRef}
              src={streamUrl}
              className="absolute inset-0 h-full w-full bg-black"
              controls
              autoPlay
              playsInline
              onLoadedMetadata={async () => {
                // Salvar histórico inicial quando o vídeo carregar
                const video = videoRef.current;
                if (video) {
                  console.log('Vídeo carregado, duração:', video.duration);
                  console.log('Salvando histórico com tmdb_id:', tmdbId);
                  await saveWatchHistory({
                    titulo: movieTitle,
                    capa_url: moviePoster,
                    duracao_total: Math.floor(video.duration),
                    posicao_segundos: 0,
                    status: 'assistindo',
                    ultimo_acesso: new Date().toISOString(),
                    tmdb_id: tmdbId,
                  });
                }
              }}
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
