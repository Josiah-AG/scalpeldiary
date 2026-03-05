import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Presentations from '../../resident/Presentations';
import { useViewModeStore } from '../../../store/viewModeStore';

export default function PresentationsWrapper() {
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

  return <Presentations />;
}
