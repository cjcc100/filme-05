'use client';

import { useState, useEffect } from 'react';

interface VideoPlayerProps {
  fileId: string;
  onClose: () => void;
}

export default function VideoPlayer({ fileId, onClose }: VideoPlayerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Fechar com tecla ESC
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

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-black transition-opacity duration-300 ${
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
          {/* Close Button - Agora dentro do container */}
          <button
            onClick={handleClose}
            className="absolute -top-14 right-0 bg-red-600 hover:bg-red-700 text-white w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 z-20 shadow-lg hover:shadow-red-500/50 hover:scale-110"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Video Container */}
          <div style={{ position: 'relative', paddingTop: '56.25%' }}>
            <iframe
              src={`https://streamtape.com/e/${fileId}?autoplay=true`}
              loading="lazy"
              style={{
                border: 'none',
                position: 'absolute',
                top: '0',
                height: '100%',
                width: '100%',
              }}
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
              allowFullScreen={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}