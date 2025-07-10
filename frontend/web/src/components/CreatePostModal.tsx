'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { XMarkIcon, PhotoIcon, VideoCameraIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { posts } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
  communityId?: string;
  postType?: 'general' | 'community';
  initialFiles?: File[];
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
  communityId,
  postType = 'general',
  initialFiles = []
}) => {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<{ url: string; type: 'image' | 'video'; file: File }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Efecto para cargar archivos iniciales
  useEffect(() => {
    if (isOpen && initialFiles.length > 0) {
      setMedia(initialFiles);
      createPreviews(initialFiles);
    }
  }, [isOpen, initialFiles]);

  const createPreviews = (files: File[]) => {
    const newPreviews: { url: string; type: 'image' | 'video'; file: File }[] = [];
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const target = e.target as FileReader;
        if (target && target.result) {
          newPreviews.push({
            url: target.result as string,
            type: file.type.startsWith('image/') ? 'image' : 'video',
            file
          });
          
          // Actualizar cuando todos los archivos estén procesados
          if (newPreviews.length === files.length) {
            setMediaPreviews(newPreviews);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter(file => {
        const isValid = file.type.startsWith('image/') || file.type.startsWith('video/');
        if (!isValid) {
          toast.error(`El archivo ${file.name} no es una imagen o video válido`);
        }
        return isValid;
      });

      if (media.length + validFiles.length > 4) {
        toast.error('No puedes subir más de 4 archivos');
        return;
      }

      setMedia(prev => [...prev, ...validFiles]);

      // Crear previsualizaciones
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const target = e.target as FileReader;
          if (target && target.result) {
            setMediaPreviews(prev => [...prev, {
              url: target.result as string,
              type: file.type.startsWith('image/') ? 'image' : 'video',
              file
            }]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeMedia = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && media.length === 0) {
      toast.error('Debes agregar contenido o al menos un archivo');
      return;
    }

    setIsLoading(true);
    try {
      console.log('📱 Iniciando creación de post desde dispositivo:', {
        userAgent: navigator.userAgent,
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        contentLength: content.length,
        mediaCount: media.length,
        mediaFiles: media.map(f => ({ name: f.name, size: f.size, type: f.type })),
        postType,
        communityId
      });

      const formData = new FormData();
      formData.append('content', content);
      formData.append('postType', postType);
      if (communityId) {
        formData.append('communityId', communityId);
      }
      
      media.forEach((file, index) => {
        console.log(`📎 Agregando archivo ${index + 1}:`, { name: file.name, size: file.size, type: file.type });
        formData.append('media', file);
      });

      console.log('🚀 Enviando FormData a createPost...');
      
      // Debugging específico para iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      
      if (isIOS && isSafari) {
        console.log('📱 iOS Safari detectado - Debugging especial activado');
        console.log('📊 FormData details:', {
          entries: Array.from(formData.entries()).map(([key, value]) => ({
            key,
            type: value instanceof File ? 'File' : 'string',
            size: value instanceof File ? value.size : 'N/A',
            name: value instanceof File ? value.name : 'N/A'
          }))
        });
      }
      
      const response = await posts.createPost(formData);
      console.log('✅ Post creado exitosamente:', response.data);
      
      // Limpiar formulario
      setContent('');
      setMedia([]);
      setMediaPreviews([]);
      
      onPostCreated();
      onClose();
      toast.success('Post creado exitosamente');
    } catch (error: any) {
      console.error('❌ Error detallado al crear el post:', {
        message: error.message,
        code: error.code,
        name: error.name,
        config: error.config,
        request: error.request ? 'Request object present' : 'No request object',
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        } : 'No response object',
        stack: error.stack
      });
      
      let errorMessage = 'Error al crear el post';
      
      if (error.code === 'ERR_NETWORK') {
        // Debugging específico para iOS Safari
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
        
        if (isIOS && isSafari) {
          console.log('🚨 iOS Safari ERR_NETWORK detectado');
          console.log('🔍 Error details:', {
            message: error.message,
            code: error.code,
            name: error.name,
            config: error.config,
            request: error.request ? 'Present' : 'Missing',
            response: error.response ? 'Present' : 'Missing'
          });
        }
        
        errorMessage = 'Error de red. Verifica tu conexión a internet.';
      } else if (error.response?.status === 413) {
        errorMessage = 'El archivo es demasiado grande. Intenta con archivos más pequeños.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setContent('');
      setMedia([]);
      setMediaPreviews([]);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700 mx-2 sm:mx-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/20 dark:to-accent-900/20 rounded-xl">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">Crear publicación</h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Comparte algo increíble con la comunidad</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full disabled:opacity-50 transition-colors"
          >
            <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          {/* Contenido */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="¿Qué quieres compartir?"
            className="w-full p-4 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-all"
            rows={4}
            disabled={isLoading}
          />
          
          {/* Vista previa de archivos */}
          {mediaPreviews.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Archivos adjuntos</h4>
              <div className="grid grid-cols-2 gap-4">
                {mediaPreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                      {preview.type === 'image' ? (
                        <Image
                          src={preview.url}
                          alt="Preview"
                          width={200}
                          height={200}
                          className="object-cover w-full h-32 group-hover:scale-105 transition-transform duration-200"
                          unoptimized
                        />
                      ) : (
                        <video
                          src={preview.url}
                          className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                          controls
                          preload="metadata"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover-lift"
                      disabled={isLoading}
                      title="Eliminar archivo"
                    >
                      <XCircleIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-stretch sm:items-center space-y-3 sm:space-y-0">
            <div className="flex space-x-2 justify-center sm:justify-start">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all duration-200 disabled:opacity-50 border border-gray-200 dark:border-gray-600 text-sm"
                disabled={isLoading}
              >
                <PhotoIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Imagen</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all duration-200 disabled:opacity-50 border border-gray-200 dark:border-gray-600 text-sm"
                disabled={isLoading}
              >
                <VideoCameraIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Video</span>
              </button>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleMediaChange}
              accept=".jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.webm"
              multiple
              className="hidden"
              disabled={isLoading}
            />
            
            <button
              type="submit"
              disabled={isLoading || (!content.trim() && media.length === 0)}
              className={`w-full sm:w-auto px-6 sm:px-8 py-3 rounded-xl text-white font-semibold transition-all duration-200 ${
                isLoading || (!content.trim() && media.length === 0)
                  ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 shadow-lg hover:shadow-xl hover-lift'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Publicando...</span>
                </div>
              ) : (
                'Publicar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 