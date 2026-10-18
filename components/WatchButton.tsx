'use client';

import { useState } from 'react';
import VideoPlayer from './VideoPlayer';

interface WatchButtonProps {
  fileName: string;
  className?: string;
}

export default function WatchButton({ fileName, className }: WatchButtonProps) {
  const [playingFile, setPlayingFile] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setPlayingFile(fileName)}
        className={
          className ||
          'bg-gradient-to-r from-red-600 to-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-red-700 hover:to-orange-600 transition-all duration-300 flex items-center gap-2 hover:scale-105 hover:shadow-lg hover:shadow-red-500/50'
        }
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
        Assistir
      </button>

      {playingFile && (
        <VideoPlayer fileName={playingFile} onClose={() => setPlayingFile(null)} />
      )}
    </>
  );
}
