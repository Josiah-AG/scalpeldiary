import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RatedLogs from '../../resident/RatedLogs';
import { useViewModeStore } from '../../../store/viewModeStore';

export default function RatedLogsWrapper() {
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
  }, [setReadOnlyMode, navigate]);

  return <RatedLogs />;
}
