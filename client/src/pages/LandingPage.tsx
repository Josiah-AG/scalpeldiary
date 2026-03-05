import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <img 
                src="/logo-sd.svg" 
                alt="ScalpelDiary Logo" 
                width="40" 
                height="40"
                className="flex-shrink-0"
              />
              <div>
                <h1 className="text-xl font-bold text-white">ScalpelDiary</h1>
                <p className="text-[10px] text-blue-100">Shaping Tomorrow's Surgeons</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="bg-white text-blue-600 px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition-all shadow-lg"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-blue-50 via-white to-blue-50 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full opacity-20 blur-3xl -mr-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-300 rounded-full opacity-20 blur-3xl -ml-48"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Comprehensive Surgical
              <span className="block bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mt-2">
                Training Management
              </span>
            </h2>
            
            <p className="text-xl sm:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Empowering surgical residents and supervisors with a modern, efficient platform 
              to track procedures, presentations, and professional development.
            </p>
            
            <button
              onClick={() => navigate('/login')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-xl shadow-blue-500/30 inline-flex items-center space-x-2 group"
            >
              <span>Get Started</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center border-t border-gray-800 pt-8">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img 
                src="/logo-sd.svg" 
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
    </div>
  );
}
