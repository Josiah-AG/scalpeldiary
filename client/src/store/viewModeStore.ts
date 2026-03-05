import { create } from 'zustand';

interface ViewModeState {
  isReadOnly: boolean;
  viewingResidentId: number | null;
  setReadOnlyMode: (residentId: number) => void;
  clearReadOnlyMode: () => void;
}

export const useViewModeStore = create<ViewModeState>((set) => ({
  isReadOnly: false,
  viewingResidentId: null,
  setReadOnlyMode: (residentId: number) => set({ isReadOnly: true, viewingResidentId: residentId }),
  clearReadOnlyMode: () => set({ isReadOnly: false, viewingResidentId: null }),
}));
