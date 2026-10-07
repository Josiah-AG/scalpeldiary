import { create } from 'zustand';

interface ViewModeState {
  isReadOnly: boolean;
  viewingResidentId: string | null;
  setReadOnlyMode: (residentId: string) => void;
  clearReadOnlyMode: () => void;
}

export const useViewModeStore = create<ViewModeState>((set) => ({
  isReadOnly: false,
  viewingResidentId: null,
  setReadOnlyMode: (residentId: string) => set({ isReadOnly: true, viewingResidentId: residentId }),
  clearReadOnlyMode: () => set({ isReadOnly: false, viewingResidentId: null }),
}));
