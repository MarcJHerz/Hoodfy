"use client";

import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center text-center">
        <img
          src="/logo.svg"
          alt="Hoodfy Logo"
          className="w-24 h-24 mb-4 mx-auto"
        />
        <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-700 mb-4">
          ¡Bienvenido a Hoodfy!
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-6">
          La red social privada para tu comunidad, donde puedes compartir, informarte y conectar con tus vecinos de forma segura.
        </p>
        <div className="flex flex-col md:flex-row gap-4 w-full justify-center mb-6">
          <Link
            href="/login"
            className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold shadow hover:bg-indigo-700 transition"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="w-full md:w-auto px-6 py-3 bg-white border border-indigo-600 text-indigo-700 rounded-lg font-semibold shadow hover:bg-indigo-50 transition"
          >
            Registrarse
          </Link>
        </div>
        <div className="flex flex-col md:flex-row gap-2 text-sm text-gray-400 mt-2">
          <span>¿Eres nuevo? Únete a tu comunidad privada.</span>
          <span className="hidden md:inline">|</span>
          <span>100% seguro y solo para residentes verificados.</span>
        </div>
      </div>
      <footer className="mt-10 text-gray-400 text-xs text-center">
        &copy; {new Date().getFullYear()} Hoodfy. Todos los derechos reservados.
      </footer>
    </main>
  );
} 