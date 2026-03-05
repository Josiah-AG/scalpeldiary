import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ResidentDashboard from '../../resident/Dashboard';
import { useViewModeStore } from '../../../store/viewModeStore';

export default function ResidentDashboardWrapper() {
  const navigate = useNavigate();
  const { setReadOnlyMode } = useViewModeStore();

  useEffect(() => {
    const residentId = sessionStorage.getItem('viewingResidentId');
    const isReadOnly = sessionStorage.getItem('isReadOnlyMode');
    
    if (!residentId || !isReadOnly) {
      navigate('/');
      return;
    }

    setReadOnlyMode(parseInt(residentId));

    return () => {
      // Don't clear on unmount, only when explicitly leaving
    };
  }, [setReadOnlyMode, navigate]);

  return <ResidentDashboard />;
}
