import { useNavigate } from 'react-router-dom';
import { ArrowRight, Activity, Users, BarChart3 } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="bg-white rounded-xl p-2 shadow-lg">
                  <img 
                    src="/logo-sd.svg?v=2" 
                    alt="ScalpelDiary Logo" 
                    width="48" 
                    height="48"
                    className="flex-shrink-0"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">ScalpelDiary</h1>
                  <p className="text-[10px] text-blue-100">Shaping Tomorrow's Surgeons</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="bg-white text-blue-600 px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition-all hover:shadow-lg hover:scale-105"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden min-h-[85vh] flex items-center">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -right-48 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 -left-48 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-300/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium animate-fade-in">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span>Modern Surgical Training Platform</span>
            </div>

            {/* Main Heading */}
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight animate-fade-in-up">
              Comprehensive Surgical
              <span className="block bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 bg-clip-text text-transparent mt-2">
                Training Management
              </span>
            </h2>
            
            {/* Subheading */}
            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Empowering surgical residents and supervisors with a modern, efficient platform 
              to track procedures, presentations, and professional development.
            </p>
            
            {/* CTA Button */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <button
                onClick={() => navigate('/login')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-10 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-xl shadow-blue-500/30 inline-flex items-center space-x-2 group hover:scale-105"
              >
                <span>Get Started</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-16 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 hover:shadow-xl transition-all hover:scale-105 group">
                <div className="bg-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Activity className="text-white" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Procedure Tracking</h3>
                <p className="text-gray-700 text-sm">Comprehensive surgical log management with real-time feedback</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200 hover:shadow-xl transition-all hover:scale-105 group">
                <div className="bg-green-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="text-white" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Collaboration</h3>
                <p className="text-gray-700 text-sm">Seamless communication between residents and supervisors</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200 hover:shadow-xl transition-all hover:scale-105 group">
                <div className="bg-purple-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="text-white" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
                <p className="text-gray-700 text-sm">Data-driven insights to track progress and performance</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center border-t border-gray-800 pt-8">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img 
                src="/logo-sd.svg?v=2" 
                alt="ScalpelDiary Logo" 
                width="36" 
                height="36"
                className="flex-shrink-0"
              />
              <div>
                <p className="font-bold text-lg">ScalpelDiary</p>
                <p className="text-xs text-gray-400">Shaping Tomorrow's Surgeons</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              © 2025 ScalpelDiary. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
