'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { auth } from '@/services/api';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth as firebaseAuth } from '@/config/firebase';
import {
  SunIcon,
  MoonIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserIcon,
  AtSymbolIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import {
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/solid';
import { useAuthStore } from '@/stores/authStore';
import Logo from '@/components/Logo';

export default function RegisterPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Validaciones en tiempo real
  const [validations, setValidations] = useState({
    name: false,
    username: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Validación en tiempo real
  useEffect(() => {
    setValidations({
      name: formData.name.length >= 2,
      username: formData.username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(formData.username),
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
      password: formData.password.length >= 6,
      confirmPassword: formData.confirmPassword === formData.password && formData.password.length > 0,
    });
  }, [formData]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    let strength = 0;
    
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    return strength;
  };

  const getPasswordStrengthLabel = () => {
    const strength = getPasswordStrength();
    if (strength <= 2) return { label: 'Débil', color: 'text-red-500' };
    if (strength <= 4) return { label: 'Media', color: 'text-yellow-500' };
    return { label: 'Fuerte', color: 'text-green-500' };
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar errores cuando el usuario empiece a escribir
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccess(false);

    // Validación de contraseñas
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    // Validación de fuerza de contraseña
    if (getPasswordStrength() < 3) {
      setError('La contraseña debe ser más fuerte. Usa mayúsculas, minúsculas, números y símbolos.');
      setLoading(false);
      return;
    }

    try {
      console.log('Iniciando registro en Firebase...');
      // 1. Registrar usuario en Firebase
      const userCredential = await createUserWithEmailAndPassword(
        firebaseAuth,
        formData.email,
        formData.password
      );
      const { user } = userCredential;
      console.log('Usuario registrado en Firebase:', user.uid);

      // 2. Obtener el token de Firebase
      const token = await user.getIdToken();
      console.log('Token de Firebase obtenido');

      // 3. Registrar usuario en el backend
      console.log('Registrando usuario en el backend...');
      try {
        await auth.register({
          email: formData.email,
          name: formData.name,
          firebaseUid: user.uid,
          username: formData.username,
        });
        console.log('Usuario registrado en el backend exitosamente');
      } catch (backendError: any) {
        console.error('Error al registrar en el backend:', backendError);
        // Si falla el registro en el backend, eliminamos el usuario de Firebase
        await user.delete();
        throw new Error(backendError.response?.data?.message || 'Error al registrar en el backend');
      }

      // Mostrar éxito
      setSuccess(true);

      // 4. Redirigir al usuario a la página principal
      setTimeout(() => {
      router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error('Error completo en el registro:', err);
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('Este correo electrónico ya está registrado');
          break;
        case 'auth/invalid-email':
          setError('Correo electrónico inválido');
          break;
        case 'auth/weak-password':
          setError('La contraseña debe tener al menos 6 caracteres');
          break;
        case 'auth/network-request-failed':
          setError('Error de conexión. Verifica tu conexión a internet');
          break;
        default:
          setError(err.message || 'Error al registrar usuario');
      }
    } finally {
      setLoading(false);
    }
  };

  const completedFields = Object.values(validations).filter(Boolean).length;
  const totalFields = Object.keys(validations).length;
  const progressPercentage = (completedFields / totalFields) * 100;

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
            ¡Únete a Qahood!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-4">
            Crea tu cuenta y encuentra tu comunidad perfecta
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {completedFields} de {totalFields} campos completados
          </p>
        </div>

        {/* Beneficios rápidos */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <SparklesIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Gratis para siempre</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <ShieldCheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">100% seguro</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Listo en 2 min</p>
          </div>
        </div>

        {/* Form será continuado en la siguiente parte debido a límites de longitud */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 space-y-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Nombre completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
              <input
                id="name"
                name="name"
                type="text"
                required
                  disabled={loading}
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 disabled:opacity-50"
                  placeholder="Tu nombre completo"
                value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {formData.name && (
                    validations.name ? (
                      <CheckIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <XMarkIcon className="h-5 w-5 text-red-500" />
                    )
                  )}
                </div>
              </div>
              {formData.name && !validations.name && (
                <p className="text-xs text-red-500">Mínimo 2 caracteres</p>
              )}
            </div>

            {/* Username Field */}
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Nombre de usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <AtSymbolIcon className="h-5 w-5 text-gray-400" />
                </div>
              <input
                id="username"
                name="username"
                type="text"
                required
                  disabled={loading}
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 disabled:opacity-50"
                  placeholder="usuario123"
                value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value.toLowerCase())}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {formData.username && (
                    validations.username ? (
                      <CheckIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <XMarkIcon className="h-5 w-5 text-red-500" />
                    )
                  )}
                </div>
              </div>
              {formData.username && !validations.username && (
                <p className="text-xs text-red-500">Mínimo 3 caracteres, solo letras, números y guión bajo</p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                  disabled={loading}
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 disabled:opacity-50"
                  placeholder="tu@ejemplo.com"
                value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {formData.email && (
                    validations.email ? (
                      <CheckIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <XMarkIcon className="h-5 w-5 text-red-500" />
                    )
                  )}
                </div>
              </div>
              {formData.email && !validations.email && (
                <p className="text-xs text-red-500">Ingresa un email válido</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
              <input
                id="password"
                name="password"
                  type={showPassword ? 'text' : 'password'}
                required
                  disabled={loading}
                  className="w-full pl-10 pr-20 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 disabled:opacity-50"
                  placeholder="Mínimo 6 caracteres"
                value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
                  {formData.password && (
                    validations.password ? (
                      <CheckIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <XMarkIcon className="h-5 w-5 text-red-500" />
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Fuerza de contraseña:</span>
                    <span className={`text-xs font-medium ${getPasswordStrengthLabel().color}`}>
                      {getPasswordStrengthLabel().label}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                          i < getPasswordStrength()
                            ? getPasswordStrength() <= 2 
                              ? 'bg-red-500' 
                              : getPasswordStrength() <= 4 
                                ? 'bg-yellow-500' 
                                : 'bg-green-500'
                            : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Confirmar contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                required
                  disabled={loading}
                  className="w-full pl-10 pr-20 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 disabled:opacity-50"
                  placeholder="Repite tu contraseña"
                value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
                  {formData.confirmPassword && (
                    validations.confirmPassword ? (
                      <CheckIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <XMarkIcon className="h-5 w-5 text-red-500" />
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              {formData.confirmPassword && !validations.confirmPassword && (
                <p className="text-xs text-red-500">Las contraseñas no coinciden</p>
              )}
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
                  ¡Cuenta creada exitosamente! Bienvenido a Qahood...
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success || !Object.values(validations).every(Boolean)}
              className="group relative w-full flex justify-center items-center gap-3 py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 hover:shadow-xl"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creando cuenta...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>¡Cuenta creada!</span>
                </>
              ) : (
                <>
                  <span>Crear mi cuenta</span>
                  <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                </>
              )}
            </button>

            {/* Terms */}
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Al registrarte, aceptas nuestros{' '}
              <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
                Términos de Servicio
              </Link>{' '}
              y{' '}
              <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                Política de Privacidad
              </Link>
            </p>
          </form>

          {/* Links */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <Link 
                href="/login" 
                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors duration-200"
              >
                ¿Ya tienes una cuenta? <span className="underline">Inicia sesión aquí</span>
              </Link>
            </div>
          </div>
          </div>

        {/* Additional Info */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            🔒 Tus datos están protegidos con encriptación de extremo a extremo
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ✨ Más de 10,000 personas ya se han unido a Qahood
          </p>
          </div>
      </div>
    </div>
  );
} 