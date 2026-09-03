'use client';

import { useState, useEffect } from 'react';

interface VideoPlayerProps {
  fileId: string;
  onClose?: () => void;
  isModal?: boolean;
}

export default function VideoPlayer({ fileId, onClose, isModal = true }: VideoPlayerProps) {
  const [isVisible, setIsVisible] = useState(isModal ? false : true);

  useEffect(() => {
    if (isModal) {
      setIsVisible(true);
    }
  }, [isModal]);

  // Fechar com tecla ESC (apenas no modal)
  useEffect(() => {
    if (!isModal || !onClose) return;

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
  }, [isVisible, isModal, onClose]);

  const handleClose = () => {
    if (onClose) {
      setIsVisible(false);
      setTimeout(() => onClose(), 300);
    }
  };

  const playerContent = (
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
  );

  // Se não for modal, retornar apenas o player
  if (!isModal) {
    return <div className="w-full">{playerContent}</div>;
  }

  // Se for modal, retornar com overlay e botão de fechar
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
          {/* Video Container */}
          {playerContent}

          {/* Close Button - Abaixo do player */}
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