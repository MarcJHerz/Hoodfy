'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [posts, setPosts] = useState([
    {
      id: 1,
      title: 'Primer post',
      content: 'Contenido del primer post...',
      author: 'Usuario 1',
      date: '2024-03-20',
    },
    // Más posts...
  ]);

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Hoodfy</h1>
          <div className="flex space-x-4">
            <Link
              href="/profile"
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
              <p className="text-gray-600 mb-4">{post.content}</p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{post.author}</span>
                <span>{post.date}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
} 