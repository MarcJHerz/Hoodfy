'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/stores/authStore';
import Logo from '@/components/Logo';
import {
  SunIcon,
  MoonIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccess(false);

    try {
      // Verificar intentos de login
      if (loginAttempts >= 3) {
        throw new Error('Demasiados intentos de inicio de sesión. Por favor, espera unos minutos.');
      }

      console.log('Iniciando sesión...');
      // Usar la función login del AuthStore que maneja Firebase y backend
      await login(formData.email, formData.password);
      console.log('Sesión iniciada exitosamente');

      // Mostrar éxito brevemente antes de redirigir
      setSuccess(true);
      
      // Redirigir al usuario a la página principal
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al iniciar sesión';
      setError(errorMessage);
      console.error('Error completo en el inicio de sesión:', err);
      
      // Incrementar contador de intentos
      setLoginAttempts(prev => prev + 1);
      
      // Si hay demasiados intentos, deshabilitar el formulario temporalmente
      if (loginAttempts >= 2) {
        setTimeout(() => {
          setLoginAttempts(0);
          setError('');
        }, 60000); // 1 minuto de espera
      }
    } finally {
      setLoading(false);
    }
  }, [formData, login, router, loginAttempts]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar errores cuando el usuario empiece a escribir
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        {mounted && (
          <button
            onClick={toggleTheme}
            className="p-3 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200 shadow-lg hover:shadow-xl"
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {theme === 'dark' ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      {/* Back to Home Link */}
      <Link
        href="/"
        className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200 shadow-lg hover:shadow-xl text-sm font-medium"
      >
        <ArrowRightIcon className="h-4 w-4 rotate-180" />
        <span>Volver al inicio</span>
      </Link>

      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo size="xl" showText={false} href={undefined} />
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            ¡Bienvenido de vuelta!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Inicia sesión para continuar con tu comunidad
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 space-y-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Correo electrónico
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  disabled={loginAttempts >= 3 || loading}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="tu@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loginAttempts >= 3 || loading}
                  className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Tu contraseña"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl animate-fade-in">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl animate-fade-in">
                <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                <p className="text-green-700 dark:text-green-300 text-sm font-medium">
                  ¡Sesión iniciada exitosamente! Redirigiendo...
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || loginAttempts >= 3 || success}
              className="group relative w-full flex justify-center items-center gap-3 py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 hover:shadow-xl"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Iniciando sesión...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>¡Éxito!</span>
                </>
              ) : (
                <>
                  <span>Iniciar sesión</span>
                  <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                </>
              )}
            </button>

            {/* Attempts Warning */}
            {loginAttempts > 0 && loginAttempts < 3 && (
              <div className="text-center">
                <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                  {loginAttempts === 1 ? 'Primer intento fallido' : 'Segundo intento fallido'}
                  {loginAttempts === 2 && ' - Un intento más y se bloqueará temporalmente'}
                </p>
              </div>
            )}
          </form>

          {/* Links */}
          <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <Link 
                href="/register" 
                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors duration-200"
              >
                ¿No tienes una cuenta? <span className="underline">Regístrate aquí</span>
              </Link>
            </div>
            <div className="text-center">
              <Link 
                href="/forgot-password" 
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            🔒 Tu información está protegida con encriptación de extremo a extremo
          </p>
        </div>
      </div>
    </div>
  );
} 