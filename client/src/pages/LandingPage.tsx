import { useNavigate } from 'react-router-dom';
import { Activity, Award, BarChart3, Shield, Users, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img 
                src="/favicon2.svg" 
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
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Sparkles size={16} />
              <span>Modern Surgical Training Platform</span>
            </div>
            
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
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => navigate('/login')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-xl shadow-blue-500/30 flex items-center space-x-2 group"
              >
                <span>Get Started</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-all border-2 border-gray-200 shadow-lg"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Powerful Features for Surgical Education
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to track, manage, and excel in your surgical training journey
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl hover:shadow-xl transition-all duration-300 border border-blue-200 hover:scale-105">
              <div className="bg-blue-600 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Activity className="text-white" size={28} />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Procedure Logging</h4>
              <p className="text-gray-700 leading-relaxed">
                Comprehensive surgical log tracking with detailed procedure information, 
                roles, and supervisor feedback.
              </p>
            </div>

            <div className="group bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl hover:shadow-xl transition-all duration-300 border border-green-200 hover:scale-105">
              <div className="bg-green-600 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Award className="text-white" size={28} />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Presentation Management</h4>
              <p className="text-gray-700 leading-relaxed">
                Track academic presentations, seminars, and MDTs with moderator ratings 
                and feedback.
              </p>
            </div>

            <div className="group bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl hover:shadow-xl transition-all duration-300 border border-purple-200 hover:scale-105">
              <div className="bg-purple-600 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="text-white" size={28} />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Analytics & Insights</h4>
              <p className="text-gray-700 leading-relaxed">
                Visualize progress with comprehensive analytics, performance metrics, 
                and trend analysis.
              </p>
            </div>

            <div className="group bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-2xl hover:shadow-xl transition-all duration-300 border border-orange-200 hover:scale-105">
              <div className="bg-orange-600 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Shield className="text-white" size={28} />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Role-Based Access</h4>
              <p className="text-gray-700 leading-relaxed">
                Secure access control for residents, supervisors, and administrators 
                with appropriate permissions.
              </p>
            </div>

            <div className="group bg-gradient-to-br from-indigo-50 to-indigo-100 p-8 rounded-2xl hover:shadow-xl transition-all duration-300 border border-indigo-200 hover:scale-105">
              <div className="bg-indigo-600 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="text-white" size={28} />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Supervisor Feedback</h4>
              <p className="text-gray-700 leading-relaxed">
                Real-time feedback and ratings from supervisors to guide resident 
                development and learning.
              </p>
            </div>

            <div className="group bg-gradient-to-br from-pink-50 to-pink-100 p-8 rounded-2xl hover:shadow-xl transition-all duration-300 border border-pink-200 hover:scale-105">
              <div className="bg-pink-600 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CheckCircle className="text-white" size={28} />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Year Progression</h4>
              <p className="text-gray-700 leading-relaxed">
                Track progress across training years with preserved historical data 
                and milestone achievements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full opacity-10 blur-3xl -ml-48 -mt-48"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-900 rounded-full opacity-10 blur-3xl -mr-48 -mb-48"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h3 className="text-4xl sm:text-5xl font-bold mb-4">
              Why Choose ScalpelDiary?
            </h3>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Built by surgeons, for surgeons. Experience the difference.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 hover:bg-white/15 transition-all">
              <div className="bg-white/20 p-3 rounded-xl flex-shrink-0">
                <CheckCircle size={24} />
              </div>
              <div>
                <h4 className="text-xl font-bold mb-2">Comprehensive Tracking</h4>
                <p className="text-blue-100 leading-relaxed">
                  Log all surgical procedures, presentations, and academic activities in one centralized platform.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 hover:bg-white/15 transition-all">
              <div className="bg-white/20 p-3 rounded-xl flex-shrink-0">
                <CheckCircle size={24} />
              </div>
              <div>
                <h4 className="text-xl font-bold mb-2">Real-Time Feedback</h4>
                <p className="text-blue-100 leading-relaxed">
                  Receive immediate feedback from supervisors to accelerate learning and skill development.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 hover:bg-white/15 transition-all">
              <div className="bg-white/20 p-3 rounded-xl flex-shrink-0">
                <CheckCircle size={24} />
              </div>
              <div>
                <h4 className="text-xl font-bold mb-2">Data-Driven Insights</h4>
                <p className="text-blue-100 leading-relaxed">
                  Make informed decisions with comprehensive analytics and performance metrics.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 hover:bg-white/15 transition-all">
              <div className="bg-white/20 p-3 rounded-xl flex-shrink-0">
                <CheckCircle size={24} />
              </div>
              <div>
                <h4 className="text-xl font-bold mb-2">Secure & Reliable</h4>
                <p className="text-blue-100 leading-relaxed">
                  Enterprise-grade security with role-based access control and data protection.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full opacity-20 blur-3xl -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-900 rounded-full opacity-20 blur-3xl -ml-32 -mb-32"></div>
            
            <div className="relative z-10">
              <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Transform Your Surgical Training?
              </h3>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Join ScalpelDiary today and experience the future of surgical education management.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="bg-white text-blue-700 px-10 py-4 rounded-xl text-lg font-bold hover:bg-blue-50 transition-all shadow-xl inline-flex items-center space-x-2 group"
              >
                <span>Sign In Now</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
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
                src="/favicon2.svg" 
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
              © 2024 ScalpelDiary. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
