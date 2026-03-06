import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import Logo from '../components/Logo';
import { ArrowLeft } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      setAuth(response.data.user, response.data.token);
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Mobile Header with Logo */}
      <div className="lg:hidden bg-gradient-to-r from-blue-600 to-blue-700 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full opacity-10 -mr-32 -mt-32"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 inline-block border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="bg-white rounded-xl p-2 shadow-lg">
                  <img 
                    src="/logo-sd.svg?v=2" 
                    alt="ScalpelDiary Logo" 
                    width="40" 
                    height="40"
                    className="flex-shrink-0"
                  />
                </div>
                <div>
                  <div className="text-xl font-bold text-white leading-tight">
                    ScalpelDiary
                  </div>
                  <div className="text-[10px] text-blue-100 leading-tight">
                    Shaping Tomorrow's Surgeons
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-white hover:text-blue-100 transition-colors"
            >
              <ArrowLeft size={18} />
              <span className="text-sm">Back</span>
            </button>
          </div>
        </div>
      </div>

      {/* Left Side - Branding (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full opacity-10 -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-900 rounded-full opacity-10 -ml-48 -mb-48"></div>
        
        <div className="relative z-10">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-white hover:text-blue-100 transition-colors mb-12"
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </button>
          
          {/* Enhanced Logo Container */}
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 inline-block border border-white/20 shadow-2xl cursor-pointer hover:bg-white/15 transition-all" onClick={() => navigate('/')}>
            <div className="flex items-center space-x-4">
              <div className="bg-white rounded-2xl p-4 shadow-lg">
                <img 
                  src="/logo-sd.svg?v=2" 
                  alt="ScalpelDiary Logo" 
                  width="64" 
                  height="64"
                  className="flex-shrink-0"
                />
              </div>
              <div>
                <div className="text-3xl font-bold text-white leading-tight">
                  ScalpelDiary
                </div>
                <div className="text-sm text-blue-100 leading-tight mt-1">
                  Shaping Tomorrow's Surgeons
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Welcome Back to<br />Your Surgical Journey
          </h2>
          <p className="text-blue-100 text-lg">
            Track your progress, receive feedback, and shape your future as a skilled surgeon.
          </p>
        </div>

        <div className="relative z-10 text-blue-200 text-sm">
          © 2025 ScalpelDiary. All rights reserved.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-gradient-to-br from-blue-50 to-gray-50 lg:bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h1>
              <p className="text-gray-600">Enter your credentials to access your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm flex items-start">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-blue-300 disabled:to-blue-400 transition-all font-semibold shadow-lg shadow-blue-500/30 disabled:shadow-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                Need access? <span className="font-semibold text-gray-900">Contact your administrator</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
