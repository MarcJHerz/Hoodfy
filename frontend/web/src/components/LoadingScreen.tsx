'use client';

import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  message?: string;
  variant?: 'default' | 'splash' | 'inline';
  showProgress?: boolean;
  progress?: number;
}

export default function LoadingScreen({ 
  message = 'Cargando...', 
  variant = 'default',
  showProgress = false,
  progress = 0
}: LoadingScreenProps) {
  const [dots, setDots] = useState('');
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showProgress) {
      const interval = setInterval(() => {
        setCurrentProgress(prev => {
          if (prev < progress) {
            return Math.min(prev + 2, progress);
          }
          return prev;
        });
      }, 50);

      return () => clearInterval(interval);
    }
  }, [progress, showProgress]);

  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {message}{dots}
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'splash') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center z-50">
        <div className="text-center space-y-8 animate-fade-in">
          {/* Logo animado */}
          <div className="relative">
            <div className="w-20 h-20 mx-auto relative">
              {/* Círculo exterior giratorio */}
              <div className="absolute inset-0 border-4 border-primary-200 dark:border-primary-800 rounded-full animate-spin"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-primary-500 rounded-full animate-spin [animation-duration:1.5s]"></div>
              
              {/* Logo central */}
              <div className="absolute inset-2 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">H</span>
              </div>
            </div>
            
            {/* Pulso de fondo */}
            <div className="absolute inset-0 w-20 h-20 mx-auto bg-primary-200 dark:bg-primary-800 rounded-full animate-ping opacity-20"></div>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gradient">Hoodfy</h1>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              {message}{dots}
            </p>
          </div>

          {/* Barra de progreso */}
          {showProgress && (
            <div className="w-64 mx-auto space-y-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${currentProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentProgress}%
              </p>
            </div>
          )}

          {/* Indicadores de carga */}
          <div className="flex justify-center space-x-2">
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse [animation-delay:0s]"></div>
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse [animation-delay:0.6s]"></div>
          </div>
        </div>
      </div>
    );
  }

  // Variant por defecto
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center space-y-6 animate-fade-in">
        {/* Spinner principal */}
        <div className="relative w-16 h-16 mx-auto">
          {/* Anillo exterior */}
          <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
          
          {/* Anillo de progreso */}
          <div className="absolute inset-0 border-4 border-transparent border-t-primary-500 border-r-primary-400 rounded-full animate-spin"></div>
          
          {/* Punto central */}
          <div className="absolute inset-6 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Texto de carga */}
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            {message}{dots}
          </p>
          
          {/* Barra de progreso opcional */}
          {showProgress && (
            <div className="w-48 mx-auto">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div 
                  className="bg-gradient-to-r from-primary-500 to-accent-500 h-1.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${currentProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Skeleton placeholder para contenido futuro */}
        <div className="space-y-3 mt-8 opacity-30">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded skeleton w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded skeleton w-1/2 mx-auto"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded skeleton w-2/3 mx-auto"></div>
        </div>
      </div>
    </div>
  );
}

// Componente Skeleton para loading states de posts
export function PostSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`card ${compact ? 'p-4' : 'p-6'} animate-pulse`}>
      {/* Header skeleton */}
      <div className="flex items-start space-x-3 mb-4">
        <div className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} bg-gray-200 dark:bg-gray-700 rounded-full skeleton`}></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded skeleton w-1/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded skeleton w-1/3"></div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="space-y-3 mb-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded skeleton"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded skeleton w-3/4"></div>
      </div>

      {/* Media skeleton (opcional) */}
      <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg skeleton mb-4"></div>

             {/* Footer skeleton */}
       <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
         <div className="flex items-center space-x-6">
           <div className="flex items-center space-x-2">
             <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full skeleton"></div>
             <div className="w-6 h-4 bg-gray-200 dark:bg-gray-700 rounded skeleton"></div>
           </div>
           <div className="flex items-center space-x-2">
             <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full skeleton"></div>
             <div className="w-6 h-4 bg-gray-200 dark:bg-gray-700 rounded skeleton"></div>
           </div>
           <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full skeleton"></div>
         </div>
         <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full skeleton"></div>
       </div>
     </div>
   );
 } 