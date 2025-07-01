"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  SunIcon,
  MoonIcon,
  UsersIcon,
  ChatBubbleLeftIcon,
  CalendarDaysIcon,
  TrophyIcon,
  HeartIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  GlobeAltIcon,
  StarIcon,
  CheckIcon,
  ArrowRightIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const benefits = [
    {
      icon: UsersIcon,
      title: "Comunidades Instantáneas",
      description: "Únete a comunidades afines y haz amigos automáticamente al ingresar."
    },
    {
      icon: ChatBubbleLeftIcon,
      title: "Chat Grupal y Privado",
      description: "Chatea en grupo con toda la comunidad o en privado con nuevos amigos."
    },
    {
      icon: CalendarDaysIcon,
      title: "Eventos Exclusivos",
      description: "Accede a eventos únicos organizados por tu comunidad."
    },
    {
      icon: TrophyIcon,
      title: "Concursos Automáticos",
      description: "Participa automáticamente en concursos al pertenecer a una comunidad."
    }
  ];

  const creatorBenefits = [
    {
      icon: CurrencyDollarIcon,
      title: "Monetización",
      description: "Genera ingresos a través de suscripciones y eventos premium."
    },
    {
      icon: ChartBarIcon,
      title: "Alto Engagement",
      description: "Comunidades privadas generan 10x más interacción que redes públicas."
    },
    {
      icon: HeartIcon,
      title: "Comunidad Unida",
      description: "Crea lazos reales y duraderos con miembros comprometidos."
    }
  ];

  const communityExamples = [
    {
      title: "Expats en Madrid",
      description: "Latinos viviendo en España se apoyan y comparten experiencias",
      members: "1,247 miembros",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Intercambio de Idiomas",
      description: "Practica español, inglés y francés con nativos en Barcelona",
      members: "856 miembros",
      color: "from-green-500 to-green-600"
    },
    {
      title: "Fin de Semana Social",
      description: "Planes y actividades para solteros de 25-35 años en CDMX",
      members: "2,341 miembros",
      color: "from-purple-500 to-purple-600"
    }
  ];

  const testimonials = [
    {
      name: "María González",
      role: "Miembro de 'Expats en Madrid'",
      content: "Gracias a Hoodfy encontré mi grupo de amigos en Madrid. En 2 semanas ya tenía planes todos los fines de semana.",
      rating: 5
    },
    {
      name: "Carlos Ruiz",
      role: "Fundador de 'Tech Entrepreneurs'",
      content: "Mi comunidad ha crecido a 500 miembros y genero $2,000 USD mensuales. La plataforma es increíble.",
      rating: 5
    },
    {
      name: "Ana Torres",
      role: "Miembro de 'Mamás Primerizas'",
      content: "El apoyo que recibo aquí no lo encuentro en ninguna otra red social. Es como tener una familia digital.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
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

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
          <div className="max-w-4xl mx-auto">
            {/* Logo */}
            <div className="mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg mx-auto mb-4">
                <span className="text-white font-bold text-2xl">H</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white mb-6">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Hoodfy
                </span>
        </h1>
            </div>

            {/* Hero Title */}
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Encuentra tu <span className="text-blue-600">comunidad perfecta</span><br />
              o <span className="text-purple-600">crea la tuya propia</span>
            </h2>

            {/* Hero Subtitle */}
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              La primera plataforma que conecta personas con intereses comunes en comunidades privadas, 
              donde los lazos reales se forman y los negocios florecen.
            </p>

            {/* Hero Stats */}
            <div className="flex flex-wrap justify-center gap-8 mb-10 text-sm md:text-base">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <UsersIcon className="h-5 w-5 text-blue-500" />
                <span>+10,000 miembros activos</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <SparklesIcon className="h-5 w-5 text-purple-500" />
                <span>+500 comunidades creadas</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <HeartIcon className="h-5 w-5 text-pink-500" />
                <span>95% satisfacción</span>
              </div>
            </div>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
              >
                <span>Crear mi cuenta gratis</span>
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
          <Link
            href="/login"
                className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
                Ya tengo cuenta
          </Link>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              ✨ Sin publicidad • 🔒 100% privado • 🚀 Listo en 2 minutos
            </p>
          </div>
        </div>
      </section>

      {/* Beneficios para Usuarios */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              ¿Por qué unirte a una comunidad?
            </h3>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Descubre todo lo que puedes obtener al formar parte de una comunidad en Hoodfy
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="group">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 dark:border-gray-700">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                    <benefit.icon className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {benefit.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ejemplos de Comunidades */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Comunidades que están cambiando vidas
            </h3>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Mira algunos ejemplos de las comunidades más exitosas en nuestra plataforma
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {communityExamples.map((community, index) => (
              <div key={index} className="group">
                <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 dark:border-gray-700">
                  <div className={`h-32 bg-gradient-to-r ${community.color} flex items-center justify-center`}>
                    <UsersIcon className="h-12 w-12 text-white opacity-80" />
                  </div>
                  <div className="p-6">
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {community.title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {community.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {community.members}
                      </span>
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon key={i} className="h-4 w-4 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios para Creadores */}
      <section className="py-20 bg-gradient-to-r from-blue-900 to-purple-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Quieres crear tu propia comunidad?
            </h3>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Conviértete en líder, genera ingresos y construye algo significativo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {creatorBenefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <benefit.icon className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-semibold mb-2">{benefit.title}</h4>
                <p className="text-blue-100">{benefit.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
          <Link
            href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-900 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
              <span>Crear mi comunidad</span>
              <ArrowRightIcon className="h-5 w-5" />
          </Link>
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Lo que dicen nuestros usuarios
            </h3>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Historias reales de personas que han transformado sus vidas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <div className="flex text-yellow-400 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Tu comunidad te está esperando
          </h3>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Únete a miles de personas que ya encontraron su lugar en el mundo
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
            >
              <span>Comenzar ahora - Es gratis</span>
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center justify-center gap-2">
              <CheckIcon className="h-4 w-4 text-green-500" />
              <span>Sin tarjeta de crédito</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckIcon className="h-4 w-4 text-green-500" />
              <span>Configura en 2 minutos</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckIcon className="h-4 w-4 text-green-500" />
              <span>Soporte 24/7</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">H</span>
                </div>
                <span className="text-xl font-bold">Hoodfy</span>
              </div>
              <p className="text-gray-300 text-sm">
                Conectando comunidades, creando vínculos reales.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link href="/features" className="hover:text-white transition-colors">Características</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Precios</Link></li>
                <li><Link href="/communities" className="hover:text-white transition-colors">Comunidades</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link href="/help" className="hover:text-white transition-colors">Centro de ayuda</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contacto</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacidad</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Comunidad</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/success-stories" className="hover:text-white transition-colors">Casos de éxito</Link></li>
                <li><Link href="/events" className="hover:text-white transition-colors">Eventos</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} Hoodfy. Todos los derechos reservados.</p>
        </div>
      </div>
      </footer>
    </div>
  );
}
