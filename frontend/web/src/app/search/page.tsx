"use client";
import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, UsersIcon } from '@heroicons/react/24/outline';
import { communities } from '@/services/api';
import { useRouter } from 'next/navigation';

const filters = [
  { key: 'communities', label: 'Comunidades', icon: UsersIcon },
  // { key: 'people', label: 'Personas', icon: UserIcon },
  // { key: 'topics', label: 'Temas', icon: HashtagIcon },
  // { key: 'posts', label: 'Posts', icon: ChatBubbleLeftRightIcon },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('communities');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const router = useRouter();

  // Obtener recomendaciones al cargar
  useEffect(() => {
    setLoading(true);
    communities.getAll()
      .then(res => setRecommendations(res.data))
      .catch(() => setError('Error loading communities'))
      .finally(() => setLoading(false));
  }, []);

  // Buscar en tiempo real
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setError('');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    const timeout = setTimeout(() => {
      communities.search(query)
        .then(res => setResults(res.data))
        .catch(() => setError('Error searching communities'))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(timeout);
  }, [query]);

  const showRecommendations = !query;
  const showResults = !!query;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Barra de búsqueda fija */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-2">
        <button className="p-2 text-gray-400 hover:text-indigo-600">
          <MagnifyingGlassIcon className="h-6 w-6" />
        </button>
        <input
          type="text"
          className="flex-1 px-4 py-2 rounded-full border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-gray-700 bg-gray-50 placeholder-gray-400"
          placeholder="Search communities..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>
      {/* Filtros (chips/pestañas) */}
      <div className="flex gap-2 px-4 py-2 bg-white sticky top-[56px] z-10 border-b border-gray-100">
        {filters.map(f => (
          <button
            key={f.key}
            className={`flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-medium transition border ${activeFilter === f.key ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-indigo-50 hover:text-indigo-700'}`}
            onClick={() => setActiveFilter(f.key)}
          >
            <f.icon className="h-5 w-5" />
            {f.label}
          </button>
        ))}
      </div>
      {/* Sugerencias y resultados */}
      <div className="px-4 py-4">
        {loading && <div className="text-center text-gray-400 py-8">Loading...</div>}
        {error && <div className="text-center text-red-500 py-4">{error}</div>}
        {showRecommendations && !loading && !error && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-2">Communities</h3>
            <div className="grid gap-4">
              {recommendations.map(c => (
                <div
                  key={c._id}
                  className="flex items-center gap-4 bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition cursor-pointer"
                  onClick={() => router.push(`/dashboard/communities/${c._id}`)}
                >
                  <img src={c.coverImage || '/images/defaults/default-community.svg'} alt={c.name} className="h-12 w-12 rounded-full object-cover bg-indigo-100" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{c.name}</div>
                    <div className="text-xs text-gray-500 mb-1">{c.description}</div>
                    <div className="text-xs text-indigo-600 font-medium">{c.members?.length || 0} miembros</div>
                  </div>
                  <button className="px-4 py-1.5 rounded-full bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition" onClick={e => { e.stopPropagation(); router.push(`/dashboard/communities/${c._id}`); }}>Unirse</button>
                </div>
              ))}
            </div>
          </div>
        )}
        {showResults && !loading && !error && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-2">Results</h3>
            {results.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No communities found.</div>
            ) : (
              <div className="grid gap-4">
                {results.map(c => (
                  <div
                    key={c._id}
                    className="flex items-center gap-4 bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition cursor-pointer"
                    onClick={() => router.push(`/dashboard/communities/${c._id}`)}
                  >
                    <img src={c.coverImage || '/images/defaults/default-community.svg'} alt={c.name} className="h-12 w-12 rounded-full object-cover bg-indigo-100" />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{c.name}</div>
                      <div className="text-xs text-gray-500 mb-1">{c.description}</div>
                      <div className="text-xs text-indigo-600 font-medium">{c.members?.length || 0} members</div>
                    </div>
                    <button className="px-4 py-1.5 rounded-full bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition" onClick={e => { e.stopPropagation(); router.push(`/dashboard/communities/${c._id}`); }}>Unirse</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 