'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useImageUrl } from '@/utils/useImageUrl';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
}

interface MediaGalleryProps {
  media?: MediaItem[];
  images?: string[]; // Para compatibilidad con uso anterior
  onImageClick?: (index: number) => void; // Nueva prop para manejar click en imagen
  className?: string;
}

// Componente para renderizar un item de media con URL procesada
const MediaItem: React.FC<{ item: MediaItem; index: number; onClick: (index: number, e?: React.MouseEvent) => void }> = React.memo(({ 
  item, 
  index, 
  onClick 
}) => {
  const { url: processedUrl } = useImageUrl(item.url);
  const { url: thumbnailUrl } = useImageUrl(item.thumbnail);

  const handleClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onClick(index, e);
  };

  if (item.type === 'video') {
    return (
      <div className="relative group cursor-pointer">
        <video
          src={processedUrl}
          className="w-full h-full object-cover rounded-lg"
          poster={thumbnailUrl}
          preload="metadata"
        />
        <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center group-hover:bg-black/30 transition-colors duration-200">
          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={processedUrl || '/images/defaults/default-avatar.png'}
      alt={`Media ${index + 1}`}
      className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity duration-200"
      loading="lazy"
    />
  );
});

MediaItem.displayName = 'MediaItem';

export const MediaGallery: React.FC<MediaGalleryProps> = React.memo(({
  media,
  images,
  onImageClick,
  className = ''
}) => {
  // Determinar qué datos usar - priorizar media sobre images
  const mediaItems = media || images?.map(url => ({ type: 'image' as const, url })) || [];
  
  if (!mediaItems.length) return null;

  const handleItemClick = (index: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Si hay un handler personalizado, usarlo
    if (onImageClick) {
      onImageClick(index);
    }
  };

  // Renderizado de grid/lista de media mejorado para desktop
  const renderMediaGrid = () => {
    if (mediaItems.length === 1) {
      return (
        <div 
          className="w-full cursor-pointer relative overflow-hidden rounded-lg"
          onClick={(e) => handleItemClick(0, e)}
        >
          {/* ✅ FIXED: Contenedor con altura máxima responsiva */}
          <div className="relative w-full h-full max-h-[400px] sm:max-h-[500px] md:max-h-[600px] lg:max-h-[550px] xl:max-h-[500px]">
            <MediaItem item={mediaItems[0]} index={0} onClick={handleItemClick} />
          </div>
        </div>
      );
    }

    if (mediaItems.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-2 max-h-[400px] sm:max-h-[450px] md:max-h-[500px]">
          {mediaItems.map((item, index) => (
            <div 
              key={index}
              onClick={(e) => handleItemClick(index, e)}
              className="aspect-square overflow-hidden rounded-lg"
            >
              <MediaItem item={item} index={index} onClick={handleItemClick} />
            </div>
          ))}
        </div>
      );
    }

    if (mediaItems.length === 3) {
      return (
        <div className="grid grid-cols-2 gap-2 h-64 sm:h-72 md:h-80 lg:h-[400px] max-h-[400px]">
          <div 
            className="row-span-2 cursor-pointer overflow-hidden rounded-lg"
            onClick={(e) => handleItemClick(0, e)}
          >
            <MediaItem item={mediaItems[0]} index={0} onClick={handleItemClick} />
          </div>
          <div 
            className="cursor-pointer overflow-hidden rounded-lg"
            onClick={(e) => handleItemClick(1, e)}
          >
            <MediaItem item={mediaItems[1]} index={1} onClick={handleItemClick} />
          </div>
          <div 
            className="cursor-pointer overflow-hidden rounded-lg"
            onClick={(e) => handleItemClick(2, e)}
          >
            <MediaItem item={mediaItems[2]} index={2} onClick={handleItemClick} />
          </div>
        </div>
      );
    }

    // Para 4 o más items
    return (
      <div className="grid grid-cols-2 gap-2 h-64 sm:h-72 md:h-80 lg:h-[400px] max-h-[400px]">
        {mediaItems.slice(0, 3).map((item, index) => (
          <div 
            key={index}
            className={`cursor-pointer overflow-hidden rounded-lg ${index === 0 ? 'row-span-2' : ''}`}
            onClick={(e) => handleItemClick(index, e)}
          >
            <MediaItem item={item} index={index} onClick={handleItemClick} />
          </div>
        ))}
        <div 
          className="relative cursor-pointer overflow-hidden rounded-lg"
          onClick={(e) => handleItemClick(3, e)}
        >
          <MediaItem item={mediaItems[3]} index={3} onClick={handleItemClick} />
          {mediaItems.length > 4 && (
            <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                +{mediaItems.length - 4}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`${className} overflow-hidden`}>
      {renderMediaGrid()}
    </div>
  );
});

MediaGallery.displayName = 'MediaGallery'; 