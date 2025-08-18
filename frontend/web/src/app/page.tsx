"use client";

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckIcon, 
  StarIcon, 
  UserGroupIcon, 
  ChatBubbleLeftRightIcon, 
  CalendarIcon, 
  TrophyIcon, 
  ChartBarIcon, 
  HeartIcon,
  ArrowRightIcon,
  SparklesIcon,
  UsersIcon,
  LinkIcon,
  RocketLaunchIcon,
  GlobeAltIcon,
  ExclamationTriangleIcon,
  HandRaisedIcon
} from '@heroicons/react/24/outline';
import LandingMenu from '@/components/LandingMenu';
import { useAuthStore } from '@/stores/authStore';

export default function Home() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();

  // Redirección automática para usuarios autenticados
  useEffect(() => {
    if (isInitialized && user) {
      console.log('🔄 Usuario autenticado detectado, redirigiendo al dashboard...');
      router.replace('/dashboard');
    }
  }, [user, isInitialized, router]);

  // Mostrar loading mientras se inicializa la autenticación
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-600 dark:border-primary-400 border-t-transparent mx-auto mb-6"></div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Cargando Hoodfy
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Preparando tu experiencia...
          </p>
        </div>
      </div>
    );
  }

  // Si el usuario está autenticado, no mostrar nada (ya se redirigió)
  if (user) {
    return null;
  }

  const revolutionPoints = [
    {
      icon: UsersIcon,
      title: "Creator as Connector",
      description: "No more followers. Creators become hosts who introduce people to each other.",
      oldWay: "1 Creator → 1M Followers",
      newWay: "1 Creator → Groups of Friends"
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: "Peer-to-Peer Bonds",
      description: "Members talk directly with each other, creating real friendships.",
      oldWay: "Parasocial relationships",
      newWay: "Real friendships form"
    },
    {
      icon: SparklesIcon,
      title: "Create Together",
      description: "Friends collaborate on projects, events, and shared experiences.",
      oldWay: "Consume content alone",
      newWay: "Create things together"
    }
  ];

  const howItWorks = [
    {
      step: "01",
      title: "Creator Sets the Vibe",
      description: "Someone passionate creates a space and defines the community purpose",
      icon: RocketLaunchIcon,
      color: "from-blue-500 to-purple-600"
    },
    {
      step: "02", 
      title: "Members Become Friends",
      description: "People join and immediately start connecting with each other, not just the creator",
      icon: UsersIcon,
      color: "from-purple-500 to-pink-600"
    },
    {
      step: "03",
      title: "Friends Create Together", 
      description: "Real relationships form. Friends collaborate, meet up, and build amazing things",
      icon: SparklesIcon,
      color: "from-pink-500 to-red-600"
    }
  ];

  const visionStats = [
    { 
      label: "The First of Its Kind", 
      value: "🌟",
      description: "Revolutionary friendship platform"
    },
    { 
      label: "Join the Pioneer Community", 
      value: "🚀",
      description: "Shape the future of connection"
    },
    { 
      label: "Limited Early Access", 
      value: "💫",
      description: "Be part of something groundbreaking"
    }
  ];

  const exampleCommunities = [
    {
      name: "Book Lovers Circle",
      purpose: "Where reading becomes social",
      outcome: "Members forming reading groups & hosting book cafes",
      members: "Coming Soon"
    },
    {
      name: "Local Foodies",
      purpose: "Transform solo dining", 
      outcome: "Friends cooking together & hosting dinner parties",
      members: "Coming Soon"
    },
    {
      name: "Fitness Buddies",
      purpose: "Make working out social",
      outcome: "Workout partners in every city & group challenges", 
      members: "Coming Soon"
    }
  ];

  const problemPoints = [
    "🔴 Following creators but never meeting people",
    "🔴 Parasocial relationships that feel empty", 
    "🔴 Consuming content alone in your room",
    "🔴 Competing for creator attention",
    "🔴 Surface-level interactions only"
  ];

  const solutionPoints = [
    "✅ Making real friends through shared interests",
    "✅ Authentic relationships between members",
    "✅ Creating and building things together", 
    "✅ Collaborating instead of competing",
    "✅ Deep, meaningful connections"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Landing Menu */}
      <LandingMenu />

      {/* Hero Section - Revolutionary */}
      <section className="relative pt-20 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 dark:from-blue-400/5 dark:to-purple-400/5"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-5xl mx-auto">
            {/* Coming Soon Badge */}
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full px-6 py-2 mb-8 border border-blue-200 dark:border-blue-800">
              <SparklesIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">The Future of Social Connection</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight tracking-tight">
              Feel the Magic of connection.<br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Join a social club.
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              Social media gives you followers. Hoodfy gives you friends.<br />
              Where creators connect people, not collect followers.
            </p>

            {/* Vision Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mb-12 max-w-4xl mx-auto">
              {visionStats.map((stat, index) => (
                <div key={index} className="text-center p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
                  <div className="text-4xl mb-3">{stat.value}</div>
                  <div className="font-bold text-gray-900 dark:text-white mb-2">{stat.label}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{stat.description}</div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link
                href="/register"
                className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-2xl px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <span className="flex items-center">
                  🚀 Be a Founding Member
                  <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <Link
                href="#vision"
                className="border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-2xl px-8 py-4 text-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300"
              >
                See the Vision
              </Link>
            </div>

            {/* Early Access Notice */}
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center space-x-2">
              <HandRaisedIcon className="w-4 h-4" />
              <span>Limited Early Access • Be First • Be Different</span>
            </p>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section id="vision" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Social Media is Broken.<br />
              <span className="text-blue-600">We're Here to Fix It.</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Traditional platforms create loneliness. We create lasting friendships.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* The Problem */}
            <div className="space-y-8">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center space-x-2 bg-red-100 dark:bg-red-900/20 rounded-full px-4 py-2 mb-4">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-semibold text-red-700 dark:text-red-300">The Problem</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  Traditional Social Media
                </h3>
              </div>
              
              <div className="space-y-4">
                {problemPoints.map((point, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800">
                    <div className="text-lg">{point}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* The Solution */}
            <div className="space-y-8">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center space-x-2 bg-green-100 dark:bg-green-900/20 rounded-full px-4 py-2 mb-4">
                  <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-300">The Solution</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  The Hoodfy Way
                </h3>
              </div>
              
              <div className="space-y-4">
                {solutionPoints.map((point, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="text-lg">{point}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Revolutionary Process */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              How the Magic Happens
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Three simple steps that change everything about how people connect online
            </p>
          </div>

          <div className="space-y-12">
            {howItWorks.map((step, index) => (
              <div key={index} className={`flex flex-col lg:flex-row items-center gap-8 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                <div className="flex-1 space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center text-white font-bold text-xl`}>
                      {step.step}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{step.title}</h3>
                    </div>
                  </div>
                  <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                    {step.description}
                  </p>
                </div>
                
                <div className="flex-1">
                  <div className={`w-full h-64 bg-gradient-to-r ${step.color} rounded-3xl flex items-center justify-center shadow-2xl`}>
                    <step.icon className="w-24 h-24 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Revolution */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              A Complete Paradigm Shift
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              We're not improving social media. We're replacing it with something fundamentally better.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {revolutionPoints.map((point, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-3xl p-8 hover:shadow-xl transition-all duration-300">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <point.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {point.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {point.description}
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                    <div className="text-sm font-semibold text-red-700 dark:text-red-300 mb-1">OLD WAY</div>
                    <div className="text-red-800 dark:text-red-200">{point.oldWay}</div>
                  </div>
                  <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">HOODFY WAY</div>
                    <div className="text-green-800 dark:text-green-200">{point.newWay}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Future Communities */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">
            Imagine Your Future Community
          </h2>
          <p className="text-xl text-blue-100 mb-16 max-w-3xl mx-auto">
            See how communities become friend groups that create amazing things together
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {exampleCommunities.map((community, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-white hover:bg-white/20 transition-all duration-300">
                <h3 className="text-2xl font-bold mb-3">{community.name}</h3>
                <p className="text-blue-100 mb-4 text-lg">{community.purpose}</p>
                <div className="bg-white/20 rounded-xl p-4 mb-6">
                  <div className="text-sm font-semibold text-blue-200 mb-2">REAL OUTCOMES</div>
                  <div className="text-white">{community.outcome}</div>
                </div>
                <div className="text-2xl font-bold text-yellow-300">{community.members}</div>
                <div className="text-sm text-blue-100">Ready for you</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder Story */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-12">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <HeartIcon className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              From Vision to Reality
            </h2>
          </div>
          
          <blockquote className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300 italic leading-relaxed mb-8">
            "I believe the future isn't about following—it's about befriending. 
            Social media should bring people together, not make them feel more alone. 
            Join me in building the platform where real relationships grow."
          </blockquote>
          
          <div className="text-gray-600 dark:text-gray-400 mb-8">
            — The Hoodfy Team
          </div>

          <Link
            href="/register"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-2xl px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 inline-block"
          >
            Be Part of History
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">
            Your Friend Group is Waiting
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto">
            Be among the first to experience the future of social connection. 
            Don't just follow. Become friends.
          </p>
          
          <div className="space-y-4">
            <Link
              href="/register"
              className="bg-white text-blue-600 hover:bg-gray-100 font-bold rounded-2xl px-10 py-5 text-xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 inline-block mb-4"
            >
              🚀 Join the Revolution
            </Link>
            <p className="text-blue-200 text-sm">
              ✨ Early access • No waiting list • Start making friends today
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">Hoodfy</h3>
              <p className="text-gray-400 mb-4 max-w-md">
                The first platform where communities become friend groups. 
                Don't just follow. Become friends.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Twitter
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  LinkedIn
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Instagram
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2">
                <li><Link href="/communities" className="text-gray-400 hover:text-white transition-colors">Communities</Link></li>
                <li><Link href="#vision" className="text-gray-400 hover:text-white transition-colors">How it works</Link></li>
                <li><Link href="/register" className="text-gray-400 hover:text-white transition-colors">Early Access</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Vision</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link href="/help" className="text-gray-400 hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Hoodfy. All rights reserved. • The Future of Friendship</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
