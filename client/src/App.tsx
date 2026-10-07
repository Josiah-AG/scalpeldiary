import { AppErrorBoundary, NetworkStatus } from './components/AppStatus';
import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import api from './api/axios';
import InstallPrompt from './components/InstallPrompt';
import NotificationPermission from './components/NotificationPermission';
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const ResidentDashboard = lazy(() => import('./pages/resident/Dashboard'));
const AddLog = lazy(() => import('./pages/resident/AddLog'));
const LogsToRate = lazy(() => import('./pages/resident/LogsToRate'));
const RatedLogs = lazy(() => import('./pages/resident/RatedLogs'));
const AllProcedures = lazy(() => import('./pages/resident/AllProcedures'));
const ResidentAnalytics = lazy(() => import('./pages/resident/Analytics'));
const AllComments = lazy(() => import('./pages/resident/AllComments'));
const Presentations = lazy(() => import('./pages/resident/Presentations'));
const Settings = lazy(() => import('./pages/resident/Settings'));
const SupervisorDashboard = lazy(() => import('./pages/supervisor/Dashboard'));
const UnrespondedLogs = lazy(() => import('./pages/supervisor/UnrespondedLogs'));
const RatingsDone = lazy(() => import('./pages/supervisor/RatingsDone'));
const SupervisorSettings = lazy(() => import('./pages/supervisor/Settings'));
const GeneralComments = lazy(() => import('./pages/supervisor/GeneralComments'));
const AllRatedProcedures = lazy(() => import('./pages/supervisor/AllRatedProcedures'));
const AllRatedPresentations = lazy(() => import('./pages/supervisor/AllRatedPresentations'));
const ResidentDashboardWrapper = lazy(() => import('./pages/supervisor/wrappers/ResidentDashboardWrapper'));
const AllProceduresWrapper = lazy(() => import('./pages/supervisor/wrappers/AllProceduresWrapper'));
const PresentationsWrapper = lazy(() => import('./pages/supervisor/wrappers/PresentationsWrapper'));
const AnalyticsWrapper = lazy(() => import('./pages/supervisor/wrappers/AnalyticsWrapper'));
const RatedLogsWrapper = lazy(() => import('./pages/supervisor/wrappers/RatedLogsWrapper'));
const MasterDashboard = lazy(() => import('./pages/master/Dashboard'));
const AccountManagement = lazy(() => import('./pages/master/AccountManagement'));
const ResidentBrowsing = lazy(() => import('./pages/master/ResidentBrowsing'));
const SupervisorBrowsing = lazy(() => import('./pages/master/SupervisorBrowsing'));
const SupervisorView = lazy(() => import('./pages/master/SupervisorView'));
const ManagementDashboard = lazy(() => import('./pages/management/Dashboard'));
const DetachmentLogs = lazy(() => import('./pages/management/DetachmentLogs'));
const ManagementResidentBrowsing = lazy(() => import('./pages/management/ResidentBrowsing'));
const ManagementSupervisorBrowsing = lazy(() => import('./pages/management/SupervisorBrowsing'));
const ManagementSupervisorView = lazy(() => import('./pages/management/SupervisorView'));
const YearlyRotations = lazy(() => import('./pages/chief-resident/YearlyRotations'));
const MonthlyDuties = lazy(() => import('./pages/chief-resident/MonthlyDuties'));
const MonthlyActivities = lazy(() => import('./pages/chief-resident/MonthlyActivities'));
const AssignPresentation = lazy(() => import('./pages/chief-resident/AssignPresentation'));
const SupervisorAssignPresentation = lazy(() => import('./pages/supervisor/AssignPresentation'));
const ActivityMonitor = lazy(() => import('./pages/master/ActivityMonitor'));

function App() {
  const { user, setAuth, token } = useAuthStore();

  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Service Worker registered successfully
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  // Refresh user data on mount/reload
  useEffect(() => {
    const refreshUserData = async () => {
      if (user && token) {
        try {
          const response = await api.get('/users/me');
          // Update user in store with fresh data (including has_management_access)
          setAuth(response.data, token);
        } catch (error) {
          console.error('Failed to refresh user data:', error);
        }
      }
    };

    refreshUserData();
  }, []); // Run once on mount

  if (!user) {
    return (
      <BrowserRouter>
        <InstallPrompt />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <InstallPrompt />
      <NotificationPermission />
      <Routes>
        {user.role === 'RESIDENT' && (
          <>
            <Route path="/" element={<ResidentDashboard />} />
            <Route path="/add-log" element={<AddLog />} />
            <Route path="/logs-to-rate" element={<LogsToRate />} />
            <Route path="/rated-logs" element={<RatedLogs />} />
            <Route path="/all-procedures" element={<AllProcedures />} />
            <Route path="/analytics" element={<ResidentAnalytics />} />
            <Route path="/all-comments" element={<AllComments />} />
            <Route path="/presentations" element={<Presentations />} />
            <Route path="/settings" element={<Settings />} />

            {/* Chief Resident Routes */}
            <Route path="/chief/yearly-rotations" element={<YearlyRotations />} />
            <Route path="/chief/monthly-duties" element={<MonthlyDuties />} />
            <Route path="/chief/monthly-activities" element={<MonthlyActivities />} />
            <Route path="/chief/assign-presentation" element={<AssignPresentation />} />
          </>
        )}
        {user.role === 'SUPERVISOR' && (
          <>
            <Route path="/" element={<SupervisorDashboard />} />
            <Route path="/unresponded-logs" element={<UnrespondedLogs />} />
            <Route path="/ratings-done" element={<RatingsDone />} />
            <Route path="/settings" element={<SupervisorSettings />} />
            <Route path="/rated-procedures" element={<AllRatedProcedures />} />
            <Route path="/rated-presentations" element={<AllRatedPresentations />} />
            <Route path="/assign-presentation" element={<SupervisorAssignPresentation />} />
            <Route path="/general-comments" element={<GeneralComments />} />
            <Route path="/resident-view/dashboard" element={<ResidentDashboardWrapper />} />
            <Route path="/resident-view/all-procedures" element={<AllProceduresWrapper />} />
            <Route path="/resident-view/presentations" element={<PresentationsWrapper />} />
            <Route path="/resident-view/analytics" element={<AnalyticsWrapper />} />
            <Route path="/resident-view/all-comments" element={<AllComments />} />
            <Route path="/resident-view/rated-logs" element={<RatedLogsWrapper />} />
            {/* Management routes for supervisors with management access */}
            {user.has_management_access && (
              <>
                <Route path="/management" element={<ManagementDashboard />} />
                <Route path="/management/browse-residents" element={<ManagementResidentBrowsing />} />
                <Route path="/management/browse-supervisors" element={<ManagementSupervisorBrowsing />} />
                <Route path="/management/supervisor-view" element={<ManagementSupervisorView />} />
                <Route path="/detachment-logs" element={<DetachmentLogs />} />
              </>
            )}
          </>
        )}
        {user.role === 'MASTER' && (
          <>
            <Route path="/" element={<MasterDashboard />} />
            <Route path="/accounts" element={<AccountManagement />} />
            <Route path="/activity-monitor" element={<ActivityMonitor />} />
            <Route path="/browse-residents" element={<ResidentBrowsing />} />
            <Route path="/browse-supervisors" element={<SupervisorBrowsing />} />
            <Route path="/supervisor-view" element={<SupervisorView />} />
            <Route path="/resident-view/dashboard" element={<ResidentDashboardWrapper />} />
            <Route path="/resident-view/all-procedures" element={<AllProceduresWrapper />} />
            <Route path="/resident-view/presentations" element={<PresentationsWrapper />} />
            <Route path="/resident-view/analytics" element={<AnalyticsWrapper />} />
            <Route path="/resident-view/all-comments" element={<AllComments />} />
            <Route path="/resident-view/rated-logs" element={<RatedLogsWrapper />} />
            <Route path="/detachment-logs" element={<DetachmentLogs />} />
          </>
        )}
        {user.role === 'MANAGEMENT' && (
          <>
            <Route path="/" element={<ManagementDashboard />} />
            <Route path="/management" element={<ManagementDashboard />} />
            <Route path="/management/browse-residents" element={<ManagementResidentBrowsing />} />
            <Route path="/management/browse-supervisors" element={<ManagementSupervisorBrowsing />} />
            <Route path="/management/supervisor-view" element={<ManagementSupervisorView />} />
            <Route path="/resident-view/dashboard" element={<ResidentDashboardWrapper />} />
            <Route path="/resident-view/all-procedures" element={<AllProceduresWrapper />} />
            <Route path="/resident-view/presentations" element={<PresentationsWrapper />} />
            <Route path="/resident-view/analytics" element={<AnalyticsWrapper />} />
            <Route path="/resident-view/all-comments" element={<AllComments />} />
            <Route path="/resident-view/rated-logs" element={<RatedLogsWrapper />} />
            <Route path="/detachment-logs" element={<DetachmentLogs />} />
          </>
        )}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function AppWithLoading() { return <AppErrorBoundary><NetworkStatus /><Suspense fallback={<div role="status" className="p-8 text-center">Loading ScalpelDiary…</div>}><App /></Suspense></AppErrorBoundary>; }
