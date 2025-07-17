'use client';

import Link from 'next/link';
import { useState } from 'react';
import Logo from './Logo';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function LandingMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav className="w-full absolute top-0 left-0 z-40 px-4 sm:px-8 pt-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo + Text */}
          <div className="flex items-center">
            <Logo size="md" showText={false} href="/" className="mr-2" />
            <span className="font-bold text-xl bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              Hoodfy
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-6 items-center">
            <Link href="/how-it-works" className="text-gray-900 dark:text-white font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-150">
              How it works
            </Link>
            <Link href="/contact" className="text-gray-900 dark:text-white font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-150">
              Contact
            </Link>
            <Link href="/communities" className="text-gray-900 dark:text-white font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-150">
              Communities
            </Link>
            <Link href="/login" className="text-gray-900 dark:text-white font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-150">
              Sign in
            </Link>
            <Link href="/register" className="bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold rounded-lg px-4 py-2 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-150">
              Sign up
            </Link>
          </div>

          {/* Mobile Auth Buttons + Hamburger */}
          <div className="md:hidden flex items-center gap-3">
            <Link href="/login" className="text-gray-900 dark:text-white font-medium text-sm">
              Sign in
            </Link>
            <Link href="/register" className="bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold rounded-lg px-3 py-2 text-sm shadow-lg hover:shadow-xl transition-all duration-150">
              Sign up
            </Link>
            <button
              onClick={toggleMenu}
              className="p-2 text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-150"
              aria-label="Open menu"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Modal */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeMenu}
          />
          
          {/* Menu Content */}
          <div className="absolute top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <Logo size="sm" showText={false} href="/" className="mr-2" />
                  <span className="font-bold text-lg bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                    Hoodfy
                  </span>
                </div>
                <button
                  onClick={closeMenu}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-150"
                  aria-label="Close menu"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Menu Items */}
              <div className="flex-1 p-6">
                <div className="space-y-6">
                  <Link 
                    href="/how-it-works" 
                    onClick={closeMenu}
                    className="block text-lg font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-150 py-2"
                  >
                    How it works
                  </Link>
                  <Link 
                    href="/contact" 
                    onClick={closeMenu}
                    className="block text-lg font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-150 py-2"
                  >
                    Contact
                  </Link>
                  <Link 
                    href="/communities" 
                    onClick={closeMenu}
                    className="block text-lg font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-150 py-2"
                  >
                    Communities
                  </Link>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  © 2024 Hoodfy. All rights reserved.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 