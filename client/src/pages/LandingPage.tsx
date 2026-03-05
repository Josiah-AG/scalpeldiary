import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-200">
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
                <h1 className="text-xl font-bold text-gray-900">ScalpelDiary</h1>
                <p className="text-[10px] text-gray-600">Shaping Tomorrow's Surgeons</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-all"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Surgical Training
            <span className="block bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mt-2">
              Management System
            </span>
          </h2>
          
          <p className="text-xl sm:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto">
            Track procedures, manage presentations, and monitor progress—all in one place.
          </p>
          
          <button
            onClick={() => navigate('/login')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-10 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg inline-flex items-center space-x-2 group"
          >
            <span>Get Started</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/logo-sd.svg" 
                alt="ScalpelDiary Logo" 
                width="32" 
                height="32"
                className="flex-shrink-0"
              />
              <div>
                <p className="font-semibold text-gray-900">ScalpelDiary</p>
                <p className="text-xs text-gray-600">Shaping Tomorrow's Surgeons</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm">
              © 2025 ScalpelDiary. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
