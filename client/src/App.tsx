import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import api from './api/axios';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import ResidentDashboard from './pages/resident/Dashboard';
import AddLog from './pages/resident/AddLog';
import LogsToRate from './pages/resident/LogsToRate';
import RatedLogs from './pages/resident/RatedLogs';
import AllProcedures from './pages/resident/AllProcedures';
import ResidentAnalytics from './pages/resident/Analytics';
import Presentations from './pages/resident/Presentations';
import Settings from './pages/resident/Settings';
import SupervisorDashboard from './pages/supervisor/Dashboard';
import UnrespondedLogs from './pages/supervisor/UnrespondedLogs';
import RatingsDone from './pages/supervisor/RatingsDone';
import SupervisorSettings from './pages/supervisor/Settings';
import AllRatedProcedures from './pages/supervisor/AllRatedProcedures';
import AllRatedPresentations from './pages/supervisor/AllRatedPresentations';
import ResidentDashboardWrapper from './pages/supervisor/wrappers/ResidentDashboardWrapper';
import AllProceduresWrapper from './pages/supervisor/wrappers/AllProceduresWrapper';
import PresentationsWrapper from './pages/supervisor/wrappers/PresentationsWrapper';
import AnalyticsWrapper from './pages/supervisor/wrappers/AnalyticsWrapper';
import RatedLogsWrapper from './pages/supervisor/wrappers/RatedLogsWrapper';
import MasterDashboard from './pages/master/Dashboard';
import AccountManagement from './pages/master/AccountManagement';
import ResidentBrowsing from './pages/master/ResidentBrowsing';
import SupervisorBrowsing from './pages/master/SupervisorBrowsing';
import SupervisorView from './pages/master/SupervisorView';
import ManagementDashboard from './pages/management/Dashboard';
import ManagementResidentBrowsing from './pages/management/ResidentBrowsing';
import ManagementSupervisorBrowsing from './pages/management/SupervisorBrowsing';
import ManagementSupervisorView from './pages/management/SupervisorView';
import YearlyRotations from './pages/chief-resident/YearlyRotations';
import MonthlyDuties from './pages/chief-resident/MonthlyDuties';
import MonthlyActivities from './pages/chief-resident/MonthlyActivities';
import AssignPresentation from './pages/chief-resident/AssignPresentation';
import SupervisorAssignPresentation from './pages/supervisor/AssignPresentation';

function App() {
  const { user, setAuth, token } = useAuthStore();

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
      <Routes>
        {user.role === 'RESIDENT' && (
          <>
            <Route path="/" element={<ResidentDashboard />} />
            <Route path="/add-log" element={<AddLog />} />
            <Route path="/logs-to-rate" element={<LogsToRate />} />
            <Route path="/rated-logs" element={<RatedLogs />} />
            <Route path="/all-procedures" element={<AllProcedures />} />
            <Route path="/analytics" element={<ResidentAnalytics />} />
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
            <Route path="/resident-view/dashboard" element={<ResidentDashboardWrapper />} />
            <Route path="/resident-view/all-procedures" element={<AllProceduresWrapper />} />
            <Route path="/resident-view/presentations" element={<PresentationsWrapper />} />
            <Route path="/resident-view/analytics" element={<AnalyticsWrapper />} />
            <Route path="/resident-view/rated-logs" element={<RatedLogsWrapper />} />
            {/* Management routes for supervisors with management access */}
            {user.has_management_access && (
              <>
                <Route path="/management" element={<ManagementDashboard />} />
                <Route path="/management/browse-residents" element={<ManagementResidentBrowsing />} />
                <Route path="/management/browse-supervisors" element={<ManagementSupervisorBrowsing />} />
                <Route path="/management/supervisor-view" element={<ManagementSupervisorView />} />
              </>
            )}
          </>
        )}
        {user.role === 'MASTER' && (
          <>
            <Route path="/" element={<MasterDashboard />} />
            <Route path="/accounts" element={<AccountManagement />} />
            <Route path="/browse-residents" element={<ResidentBrowsing />} />
            <Route path="/browse-supervisors" element={<SupervisorBrowsing />} />
            <Route path="/supervisor-view" element={<SupervisorView />} />
            <Route path="/resident-view/dashboard" element={<ResidentDashboardWrapper />} />
            <Route path="/resident-view/all-procedures" element={<AllProceduresWrapper />} />
            <Route path="/resident-view/presentations" element={<PresentationsWrapper />} />
            <Route path="/resident-view/analytics" element={<AnalyticsWrapper />} />
            <Route path="/resident-view/rated-logs" element={<RatedLogsWrapper />} />
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
            <Route path="/resident-view/rated-logs" element={<RatedLogsWrapper />} />
          </>
        )}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
