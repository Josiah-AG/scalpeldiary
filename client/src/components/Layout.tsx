import { ReactNode, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, Calendar, FileText, BarChart3, Star, Settings, PlusCircle, ClipboardList, UserCheck, CalendarDays, ClipboardCheck, Activity, Bell } from 'lucide-react';
import api from '../api/axios';
import Logo from './Logo';
import RoleSwitcher from './RoleSwitcher';
import NotificationPopup from './NotificationPopup';
import NotificationBell from './NotificationBell';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [userDetails, setUserDetails] = useState<any>(null);
  const [unrespondedCount, setUnrespondedCount] = useState<number>(0);
  const [logsToRateCount, setLogsToRateCount] = useState<number>(0);
  const [assignedPresentationsCount, setAssignedPresentationsCount] = useState<number>(0);
  const [moderatorAssignmentsCount, setModeratorAssignmentsCount] = useState<number>(0);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user?.role === 'RESIDENT') {
      fetchCurrentYear();
      fetchAssignedPresentationsCount();
    }
    if (user?.role === 'SUPERVISOR') {
      fetchUnrespondedCount();
      fetchModeratorAssignmentsCount();
    }
    fetchUserProfile();
    fetchUnreadNotificationsCount();
  }, [user]);

  useEffect(() => {
    // Fetch logs to rate count for Year 2+ residents
    if (user?.role === 'RESIDENT' && currentYear && currentYear >= 2) {
      fetchLogsToRateCount();
    }
  }, [user, currentYear]);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/users/me');
      console.log('User profile data:', response.data);
      setProfilePicture(response.data.profile_picture || '');
      setUserDetails(response.data);
    } catch (error) {
      console.error('Failed to fetch profile');
    }
  };

  const fetchCurrentYear = async () => {
    try {
      const response = await api.get('/users/resident-years/me');
      if (response.data.length > 0) {
        const latestYear = response.data[response.data.length - 1];
        setCurrentYear(latestYear.year);
      }
    } catch (error) {
      console.error('Failed to fetch year');
    }
  };

  const fetchUnrespondedCount = async () => {
    try {
      const [logsResponse, presentationsResponse] = await Promise.all([
        api.get('/logs/to-rate'),
        api.get('/presentations/to-rate')
      ]);
      setUnrespondedCount(logsResponse.data.length + presentationsResponse.data.length);
    } catch (error) {
      console.error('Failed to fetch unresponded count');
    }
  };

  const fetchLogsToRateCount = async () => {
    try {
      const response = await api.get('/logs/to-rate/count');
      setLogsToRateCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch logs to rate count');
    }
  };

  const fetchAssignedPresentationsCount = async () => {
    try {
      const response = await api.get('/presentation-assignments/my-assignments/count');
      setAssignedPresentationsCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch assigned presentations count');
    }
  };

  const fetchModeratorAssignmentsCount = async () => {
    try {
      const response = await api.get('/presentation-assignments/moderator-assignments/count');
      setModeratorAssignmentsCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch moderator assignments count');
    }
  };

  const fetchUnreadNotificationsCount = async () => {
    try {
      const response = await api.get('/notifications');
      const unread = response.data.filter((n: any) => !n.read);
      setUnreadNotificationsCount(unread.length);
    } catch (error) {
      console.error('Failed to fetch unread notifications count');
    }
  };

  const handleLogout = () => {
    // Clear read-only mode
    sessionStorage.removeItem('viewingResidentId');
    sessionStorage.removeItem('isReadOnlyMode');
    logout();
    navigate('/login');
  };

  const handleBackToSupervisor = () => {
    sessionStorage.removeItem('viewingResidentId');
    sessionStorage.removeItem('isReadOnlyMode');
    navigate('/');
  };

  const isReadOnlyMode = sessionStorage.getItem('isReadOnlyMode') === 'true';

  const getNavLinks = (): Array<{ to: string; label: string; icon: any; count?: number }> => {
    // Check if in read-only mode
    const isReadOnly = sessionStorage.getItem('isReadOnlyMode') === 'true';
    
    if (user?.role === 'RESIDENT') {
      const links: Array<{ to: string; label: string; icon: any; count?: number }> = [
        { to: '/', label: 'Dashboard', icon: Calendar },
        { to: '/add-log', label: 'Add Procedure', icon: PlusCircle },
        { to: '/presentations', label: 'Presentations', icon: FileText, count: assignedPresentationsCount },
        { to: '/analytics', label: 'Analytics', icon: BarChart3 },
        { to: '/settings', label: 'Settings', icon: Settings },
      ];
      
      // Only show "Logs to Rate" and "Rated Logs" for Year 2+
      if (currentYear && currentYear >= 2) {
        links.splice(4, 0, { to: '/logs-to-rate', label: 'Logs to Rate', icon: ClipboardList, count: logsToRateCount });
        links.splice(5, 0, { to: '/rated-logs', label: 'Rated Logs', icon: Star });
      }
      
      return links;
    } else if (user?.role === 'SUPERVISOR') {
      // If viewing a resident in read-only mode, show resident navigation
      if (isReadOnly) {
        return [
          { to: '/resident-view/dashboard', label: 'Dashboard', icon: Calendar },
          { to: '/resident-view/all-procedures', label: 'All Procedures', icon: ClipboardList },
          { to: '/resident-view/presentations', label: 'Presentations', icon: FileText },
          { to: '/resident-view/analytics', label: 'Analytics', icon: BarChart3 },
          { to: '/resident-view/rated-logs', label: 'Rated Logs', icon: Star },
        ];
      }
      
      return [
        { to: '/', label: 'Dashboard', icon: Calendar },
        { to: '/unresponded-logs', label: 'Unresponded Logs', icon: ClipboardList, count: unrespondedCount },
        { to: '/ratings-done', label: 'Ratings Done', icon: Star },
        { to: '/assign-presentation', label: 'Assign Presentation', icon: FileText, count: moderatorAssignmentsCount },
        { to: '/settings', label: 'Settings', icon: Settings },
      ];
    } else if (user?.role === 'MASTER') {
      // If viewing a resident in read-only mode, show resident navigation
      if (isReadOnly) {
        return [
          { to: '/resident-view/dashboard', label: 'Dashboard', icon: Calendar },
          { to: '/resident-view/all-procedures', label: 'All Procedures', icon: ClipboardList },
          { to: '/resident-view/presentations', label: 'Presentations', icon: FileText },
          { to: '/resident-view/analytics', label: 'Analytics', icon: BarChart3 },
          { to: '/resident-view/rated-logs', label: 'Rated Logs', icon: Star },
        ];
      }
      
      return [
        { to: '/', label: 'Dashboard', icon: Calendar },
        { to: '/accounts', label: 'Account Management', icon: Settings },
      ];
    } else if (user?.role === 'MANAGEMENT') {
      // If viewing a resident in read-only mode, show resident navigation
      if (isReadOnly) {
        return [
          { to: '/resident-view/dashboard', label: 'Dashboard', icon: Calendar },
          { to: '/resident-view/all-procedures', label: 'All Procedures', icon: ClipboardList },
          { to: '/resident-view/presentations', label: 'Presentations', icon: FileText },
          { to: '/resident-view/analytics', label: 'Analytics', icon: BarChart3 },
          { to: '/resident-view/rated-logs', label: 'Rated Logs', icon: Star },
        ];
      }
      
      return [
        { to: '/management', label: 'Dashboard', icon: Calendar },
      ];
    }
    return [];
  };

  const getChiefResidentLinks = (): Array<{ to: string; label: string; icon: any }> => {
    // Only show for residents who are Chief Residents
    if (user?.role === 'RESIDENT' && userDetails?.is_chief_resident) {
      return [
        { to: '/chief/yearly-rotations', label: 'Yearly Rotations', icon: CalendarDays },
        { to: '/chief/monthly-duties', label: 'Monthly Duties', icon: ClipboardCheck },
        { to: '/chief/monthly-activities', label: 'Monthly Activities', icon: Activity },
        { to: '/chief/assign-presentation', label: 'Assign Presentation', icon: FileText },
      ];
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Notification Popup */}
      <NotificationPopup />
      
      {/* Modern Header */}
      <nav className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-1 min-w-0">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileSidebar(true)}
                className="md:hidden p-1.5 sm:p-2 rounded-lg hover:bg-blue-800 transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-2 py-1 sm:px-3 sm:py-1.5 border border-white/20 flex-shrink-0">
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <div className="bg-white rounded-md sm:rounded-lg p-1 sm:p-1.5 shadow-md flex-shrink-0">
                    <img 
                      src="/logo-sd.svg?v=2" 
                      alt="SD" 
                      className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7"
                    />
                  </div>
                  <div className="hidden sm:block">
                    <div className="font-bold text-xs sm:text-sm text-white leading-tight">
                      ScalpelDiary
                    </div>
                  </div>
                </div>
              </div>
              {isReadOnlyMode && (
                <span className="hidden sm:inline-block px-2 sm:px-3 py-0.5 sm:py-1 bg-yellow-500 text-white text-xs font-semibold rounded-full flex-shrink-0">
                  READ ONLY
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-shrink-0">
              {isReadOnlyMode && (
                <button
                  onClick={handleBackToSupervisor}
                  className="flex items-center space-x-1 sm:space-x-2 bg-white text-blue-600 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors text-xs sm:text-sm font-medium"
                >
                  <span className="text-lg sm:text-base">←</span>
                  <span className="hidden sm:inline">Back to Dashboard</span>
                </button>
              )}
              
              {/* Notification Bell */}
              {(user?.role === 'RESIDENT' || user?.role === 'SUPERVISOR') && (
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 hover:bg-blue-800 rounded-lg transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell size={20} className="text-white" />
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                      </span>
                    )}
                  </button>
                  <NotificationBell 
                    show={showNotifications} 
                    onClose={() => setShowNotifications(false)}
                    onCountChange={setUnreadNotificationsCount}
                  />
                </div>
              )}
              
              {/* Profile Picture - Always visible */}
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-white shadow-md"
                />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center border-2 border-white shadow-md">
                  <span className="text-blue-600 font-bold text-sm sm:text-base">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              
              {/* User Info - Always visible but responsive */}
              <div className="text-right">
                <p className="text-xs sm:text-sm font-semibold truncate max-w-[100px] sm:max-w-none">
                  {user?.name}
                </p>
                {currentYear && user?.role === 'RESIDENT' && userDetails && (
                  <p className="text-xs text-blue-200">
                    Year {currentYear}{userDetails.specialty ? ` - ${userDetails.specialty}` : ''}
                  </p>
                )}
                {user?.role === 'SUPERVISOR' && userDetails && (
                  <>
                    {userDetails.specialty && (
                      <p className="text-xs text-blue-200">{userDetails.specialty}</p>
                    )}
                    {userDetails.institution && (
                      <p className="text-xs text-blue-200">{userDetails.institution}</p>
                    )}
                    {!userDetails.specialty && !userDetails.institution && (
                      <p className="text-xs text-blue-200">Supervisor</p>
                    )}
                  </>
                )}
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 sm:space-x-2 hover:bg-blue-800 px-2 sm:px-4 py-2 rounded-lg transition-colors"
              >
                <LogOut size={16} className="sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Role Switcher for dual-role users */}
      <RoleSwitcher />

      <div className="flex flex-col md:flex-row">
        {/* Mobile Sidebar Overlay */}
        {showMobileSidebar && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setShowMobileSidebar(false)}
            />
            
            {/* Sidebar */}
            <aside className="fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-50 md:hidden overflow-y-auto">
              {/* Close Button */}
              <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="bg-blue-600 rounded-lg p-1.5 shadow-md">
                    <img 
                      src="/logo-sd.svg?v=2" 
                      alt="ScalpelDiary Logo" 
                      width="28" 
                      height="28"
                      className="flex-shrink-0"
                    />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-blue-600 leading-tight">
                      ScalpelDiary
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowMobileSidebar(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <nav className="mt-6 px-3 pb-6">
                {getNavLinks().map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.to;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setShowMobileSidebar(false)}
                      className={`group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg mb-2 transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon size={20} className="mr-3" />
                        {link.label}
                      </div>
                      {link.count !== undefined && link.count > 0 && (
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                          isActive ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
                        }`}>
                          {link.count}
                        </span>
                      )}
                    </Link>
                  );
                })}
                
                {/* Chief Resident Section */}
                {getChiefResidentLinks().length > 0 && (
                  <>
                    <div className="mt-6 mb-3 px-4">
                      <div className="flex items-center space-x-2 text-amber-600">
                        <UserCheck size={18} />
                        <h3 className="text-xs font-bold uppercase tracking-wider">Chief Resident</h3>
                      </div>
                      <div className="mt-1 h-0.5 bg-gradient-to-r from-amber-400 to-transparent"></div>
                    </div>
                    {getChiefResidentLinks().map((link) => {
                      const Icon = link.icon;
                      const isActive = location.pathname === link.to;
                      return (
                        <Link
                          key={link.to}
                          to={link.to}
                          onClick={() => setShowMobileSidebar(false)}
                          className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg mb-2 transition-all ${
                            isActive
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md'
                              : 'text-gray-700 hover:bg-amber-50 hover:text-amber-600'
                          }`}
                        >
                          <Icon size={20} className="mr-3" />
                          {link.label}
                        </Link>
                      );
                    })}
                  </>
                )}
              </nav>
            </aside>
          </>
        )}
        
        {/* Desktop Sidebar - Hidden on mobile, shown on md+ */}
        <aside className="hidden md:block md:w-64 bg-white shadow-lg min-h-screen border-r border-gray-200">
          <nav className="mt-6 px-3">
            {getNavLinks().map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg mb-2 transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <div className="flex items-center">
                    <Icon size={20} className="mr-3" />
                    {link.label}
                  </div>
                  {link.count !== undefined && link.count > 0 && (
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                      isActive ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
                    }`}>
                      {link.count}
                    </span>
                  )}
                </Link>
              );
            })}
            
            {/* Chief Resident Section */}
            {getChiefResidentLinks().length > 0 && (
              <>
                <div className="mt-6 mb-3 px-4">
                  <div className="flex items-center space-x-2 text-amber-600">
                    <UserCheck size={18} />
                    <h3 className="text-xs font-bold uppercase tracking-wider">Chief Resident</h3>
                  </div>
                  <div className="mt-1 h-0.5 bg-gradient-to-r from-amber-400 to-transparent"></div>
                </div>
                {getChiefResidentLinks().map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.to;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg mb-2 transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-amber-50 hover:text-amber-600'
                      }`}
                    >
                      <Icon size={20} className="mr-3" />
                      {link.label}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
              {title}
            </h2>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
