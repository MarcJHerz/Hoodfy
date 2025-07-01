'use client';

import { ReactNode } from 'react';
import Link from 'next/link';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="text-2xl font-bold text-gray-900">
              Hoodfy
            </Link>
            <div className="flex space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                Inicio
              </Link>
              <Link
                href="/dashboard/profile"
                className="text-gray-600 hover:text-gray-900"
              >
                Perfil
              </Link>
              <button
                onClick={() => {
                  // TODO: Implementar logout
                  console.log('Logout clicked');
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
} 