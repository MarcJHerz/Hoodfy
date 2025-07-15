import Link from 'next/link';
import Logo from './Logo';

export default function LandingMenu() {
  return (
    <nav className="w-full absolute top-0 left-0 z-40 px-4 sm:px-8 pt-6">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <Logo size="md" showText={false} href="/" className="mr-4" />
        {/* Enlaces */}
        <div className="flex gap-4 sm:gap-8 items-center">
          <Link href="/how-it-works" className="text-gray-900 dark:text-white font-medium hover:underline transition-colors duration-150 text-sm sm:text-base">Cómo funciona</Link>
          <Link href="/contact" className="text-gray-900 dark:text-white font-medium hover:underline transition-colors duration-150 text-sm sm:text-base">Contacto</Link>
          <Link href="/login" className="text-gray-900 dark:text-white font-medium hover:underline transition-colors duration-150 text-sm sm:text-base">Iniciar sesión</Link>
          <Link href="/register" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg px-4 py-2 text-sm sm:text-base shadow hover:scale-105 transition-transform duration-150">Registrarse</Link>
        </div>
      </div>
    </nav>
  );
} 