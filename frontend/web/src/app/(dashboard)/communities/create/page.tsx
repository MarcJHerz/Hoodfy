'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '@/services/api';
import { PhotoIcon, XMarkIcon, SparklesIcon, UserGroupIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export default function CreateCommunityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priceType: 'free', // Agregar campo de tipo de precio
    price: 0, // Agregar campo de precio
  });
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Precios predefinidos
  const predefinedPrices = [1, 3, 5, 7, 10, 15, 20, 25, 50, 100];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? Number(value) : value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecciona una imagen válida');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB');
      return;
    }

    setCoverImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setCoverImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.name.trim()) {
      toast.error('El nombre de la comunidad es requerido');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('La descripción es requerida');
      return;
    }

    if (formData.name.length < 3) {
      toast.error('El nombre debe tener al menos 3 caracteres');
      return;
    }

    if (formData.description.length < 10) {
      toast.error('La descripción debe tener al menos 10 caracteres');
      return;
    }

    // Validar precio si no es gratis
    if (formData.priceType === 'predefined' && !predefinedPrices.includes(formData.price)) {
      toast.error('Por favor, selecciona un precio válido');
      return;
    }

    if (formData.priceType === 'custom' && (formData.price <= 0 || formData.price > 1000)) {
      toast.error('El precio personalizado debe estar entre $1 y $1000');
      return;
    }

    try {
      setLoading(true);
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('priceType', formData.priceType);
      formDataToSend.append('price', formData.price.toString());
      
      if (coverImage) {
        formDataToSend.append('coverImage', coverImage);
      }
      
      await api.post('/api/communities/create', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('¡Comunidad creada con éxito!');
      router.push('/communities');
    } catch (error: any) {
      console.error('Error al crear comunidad:', error);
      toast.error(error.response?.data?.error || 'Error al crear la comunidad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-primary-600 to-accent-600 dark:from-primary-700 dark:to-accent-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 dark:bg-black/20 rounded-full p-4 backdrop-blur-sm">
                <SparklesIcon className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Crea tu Comunidad
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Dale vida a tu visión. Crea un espacio donde las personas puedan conectar, aprender y crecer juntas.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Progress indicator */}
          <div className="bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 px-6 sm:px-8 py-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/40 dark:to-accent-900/40 rounded-xl">
                  <UserGroupIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Información Básica</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Configura los datos fundamentales de tu comunidad</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">Paso 1 de 3</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
            {/* Nombre */}
            <div className="space-y-3">
              <label htmlFor="name" className="flex items-center text-base font-semibold text-gray-900 dark:text-gray-100">
                <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                Nombre de la comunidad
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-2xl focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-200 text-lg"
                  placeholder="Ej: Desarrolladores React, Artistas Digitales, Emprendedores..."
                  maxLength={50}
                />
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <span className={`text-sm font-medium ${
                    formData.name.length > 40 
                      ? 'text-amber-500 dark:text-amber-400' 
                      : formData.name.length > 30 
                        ? 'text-blue-500 dark:text-blue-400' 
                        : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {formData.name.length}/50
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                <SparklesIcon className="w-4 h-4 mr-1" />
                Este será el nombre público de tu comunidad
              </p>
            </div>

            {/* Descripción */}
            <div className="space-y-3">
              <label htmlFor="description" className="flex items-center text-base font-semibold text-gray-900 dark:text-gray-100">
                <div className="w-2 h-2 bg-accent-500 rounded-full mr-3"></div>
                Descripción
              </label>
              <div className="relative">
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-2xl focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-200 text-lg resize-none"
                  placeholder="Describe de qué trata tu comunidad, qué tipo de contenido compartirán, quién puede unirse..."
                  maxLength={500}
                />
                <div className="absolute bottom-4 right-4 pointer-events-none">
                  <span className={`text-sm font-medium ${
                    formData.description.length > 400 
                      ? 'text-amber-500 dark:text-amber-400' 
                      : formData.description.length > 300 
                        ? 'text-blue-500 dark:text-blue-400' 
                        : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {formData.description.length}/500
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                <SparklesIcon className="w-4 h-4 mr-1" />
                Una buena descripción ayuda a las personas a entender el valor de tu comunidad
              </p>
            </div>

            {/* Configuración de Precio */}
            <div className="space-y-6">
              <label className="flex items-center text-base font-semibold text-gray-900 dark:text-gray-100">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                Configuración de Precio
              </label>
              
              {/* Tipo de precio */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className={`relative flex cursor-pointer rounded-xl border-2 p-4 transition-all ${
                    formData.priceType === 'free' 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}>
                    <input
                      type="radio"
                      name="priceType"
                      value="free"
                      checked={formData.priceType === 'free'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className="flex flex-col">
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">Gratuita</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Cualquiera puede unirse</div>
                    </div>
                  </label>

                  <label className={`relative flex cursor-pointer rounded-xl border-2 p-4 transition-all ${
                    formData.priceType === 'predefined' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}>
                    <input
                      type="radio"
                      name="priceType"
                      value="predefined"
                      checked={formData.priceType === 'predefined'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className="flex flex-col">
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">Precio Fijo</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Selecciona un precio estándar</div>
                    </div>
                  </label>

                  <label className={`relative flex cursor-pointer rounded-xl border-2 p-4 transition-all ${
                    formData.priceType === 'custom' 
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}>
                    <input
                      type="radio"
                      name="priceType"
                      value="custom"
                      checked={formData.priceType === 'custom'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className="flex flex-col">
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">Personalizado</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Define tu propio precio</div>
                    </div>
                  </label>
                </div>

                {/* Selector de precio predefinido */}
                {formData.priceType === 'predefined' && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Selecciona el precio mensual
                    </label>
                    <div className="grid grid-cols-5 gap-3">
                      {predefinedPrices.map((priceOption) => (
                        <label
                          key={priceOption}
                          className={`flex cursor-pointer items-center justify-center rounded-lg border-2 p-3 text-center transition-all ${
                            formData.price === priceOption
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <input
                            type="radio"
                            name="price"
                            value={priceOption}
                            checked={formData.price === priceOption}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <span className="font-semibold">${priceOption}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Campo de precio personalizado */}
                {formData.priceType === 'custom' && (
                  <div className="space-y-3">
                    <label htmlFor="customPrice" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Precio mensual personalizado (USD)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500 dark:text-gray-400 text-lg">$</span>
                      </div>
                      <input
                        type="number"
                        name="price"
                        value={formData.price || ''}
                        onChange={handleInputChange}
                        min="1"
                        max="1000"
                        className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-purple-500 dark:focus:border-purple-400 transition-all duration-200"
                        placeholder="0"
                      />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Mínimo: $1 USD • Máximo: $1000 USD
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Imagen de portada */}
            <div className="space-y-3">
              <label className="flex items-center text-base font-semibold text-gray-900 dark:text-gray-100">
                <div className="w-2 h-2 bg-success-500 rounded-full mr-3"></div>
                Imagen de portada
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">(Opcional)</span>
              </label>
              
              <div className="relative">
                {previewUrl ? (
                  <div className="relative group">
                    <div className="relative overflow-hidden rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 aspect-video">
                      <Image
                        src={previewUrl}
                        alt="Vista previa"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200"></div>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-4 right-4 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all duration-200 transform hover:scale-110 shadow-lg"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 cursor-pointer group"
                       onClick={() => fileInputRef.current?.click()}>
                    <div className="px-6 py-12 text-center">
                      <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/40 dark:to-accent-900/40 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                        <PhotoIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Agregar imagen de portada
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Sube una imagen que represente tu comunidad
                      </p>
                      <div className="inline-flex items-center px-4 py-2 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-lg text-sm font-medium">
                        Seleccionar archivo
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                        PNG, JPG, GIF hasta 5MB • Recomendado: 1200x630px
                      </p>
                    </div>
                  </div>
                )}
                
                <input
                  id="coverImage"
                  name="coverImage"
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageChange}
                  className="sr-only"
                />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={loading}
                className="flex-1 sm:flex-none px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 disabled:opacity-50 transition-all duration-200 font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name.trim() || !formData.description.trim()}
                className="flex-1 sm:flex-auto px-8 py-3 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Creando comunidad...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-5 h-5" />
                    <span>Crear mi comunidad</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 