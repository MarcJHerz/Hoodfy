"use client";

import Link from 'next/link';
import { CheckIcon, StarIcon, UserGroupIcon, ChatBubbleLeftRightIcon, CalendarIcon, TrophyIcon, ChartBarIcon, HeartIcon } from '@heroicons/react/24/outline';
import LandingMenu from '@/components/LandingMenu';

export default function Home() {
  const features = [
    {
      icon: UserGroupIcon,
      title: "Instant Communities",
      description: "Join like-minded communities and automatically make friends when you join."
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: "Group & Private Chat",
      description: "Chat in groups with the entire community or privately with new friends."
    },
    {
      icon: CalendarIcon,
      title: "Exclusive Events",
      description: "Access unique events organized by your community."
    },
    {
      icon: TrophyIcon,
      title: "Automatic Contests",
      description: "Automatically participate in contests by belonging to a community."
    }
  ];

  const stats = [
    { label: "Private communities generate 10x more engagement than public networks.", value: "10x" },
    { label: "United Community", value: "500+" },
    { label: "Active Members", value: "50K+" },
    { label: "Communities Created", value: "1000+" }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Community Creator",
      content: "My community has grown to 500 members and I generate $2,000 USD monthly. The platform is incredible.",
      rating: 5
    },
    {
      name: "Mike Chen",
      role: "Community Member",
      content: "I found my tribe here. The connections are real and the engagement is amazing.",
      rating: 5
    },
    {
      name: "Emma Rodriguez",
      role: "Community Creator",
      content: "Creating my community was the best decision. The tools are powerful and the support is excellent.",
      rating: 5
    }
  ];

  const communityExamples = [
    {
      name: "Tech Enthusiasts",
      members: "1,200+",
      description: "Share the latest in technology and innovation"
    },
    {
      name: "Fitness & Wellness",
      members: "800+",
      description: "Support each other in health and fitness goals"
    },
    {
      name: "Creative Artists",
      members: "650+",
      description: "Showcase and collaborate on creative projects"
    }
  ];

  const benefits = [
    "Connect with people who share your interests",
    "Access exclusive content and events",
    "Build meaningful relationships",
    "Grow your personal and professional network",
    "Participate in community challenges and contests",
    "Get support and advice from like-minded people"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Landing Menu */}
      <LandingMenu />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Be part of a private community<br />
              Make real connections
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl">
            Join meaningful communities. Speak freely. Grow together
            </p>
            
            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 mb-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">10x</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">More engagement</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">500+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Communities created</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">50K+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active members</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg px-8 py-4 text-lg shadow-lg hover:scale-105 transition-transform duration-200"
              >
                Join your community
              </Link>
              <Link
                href="/login"
                className="border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg px-8 py-4 text-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need to build amazing communities
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Discover all the tools and features that make Qahood the perfect platform for your community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-xl bg-gray-50 dark:bg-gray-700 hover:shadow-lg transition-shadow duration-200">
                <feature.icon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-12">
            Communities that are changing lives
          </h2>
          <p className="text-xl text-blue-100 mb-16">
            See some examples of the most successful communities on our platform
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {communityExamples.map((community, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-white">
                <h3 className="text-xl font-semibold mb-2">{community.name}</h3>
                <p className="text-blue-100 mb-4">{community.description}</p>
                <div className="text-2xl font-bold text-yellow-300">{community.members}</div>
                <div className="text-sm text-blue-100">members</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Want to create your own community?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Join thousands of community creators who are building meaningful connections and generating income
          </p>
          <Link
            href="/register"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg px-8 py-4 text-lg shadow-lg hover:scale-105 transition-transform duration-200 inline-block"
          >
            Create my community
          </Link>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What our users say
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Real stories from real people who found their community on Qahood
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Your community is waiting for you
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of people who have already found their perfect community
          </p>
          <Link
            href="/register"
            className="bg-white text-blue-600 font-semibold rounded-lg px-8 py-4 text-lg shadow-lg hover:scale-105 transition-transform duration-200 inline-block"
          >
            Get started today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">Qahood</h3>
              <p className="text-gray-400 mb-4">
                Connecting communities, creating real bonds.
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
                <li><Link href="/communities" className="hover:text-white transition-colors">Communities</Link></li>
                <li><Link href="/how-it-works" className="hover:text-white transition-colors">How it works</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Qahood. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
