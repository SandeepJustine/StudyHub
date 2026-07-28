'use client';

import { create } from 'zustand';
import { 
  LabEquipmentItem, 
  Experiment, 
  StudentExperiment,
} from '@/types/lab';

interface LabStore {
  // Lab State
  workbench: LabEquipmentItem[];
  selectedEquipment: string | null;
  currentExperiment: Experiment | null;
  currentAttempt: StudentExperiment | null;
  currentStep: number;
  isHeating: boolean;
  showSafetyGuidelines: boolean;

  // Actions
  setCurrentExperiment: (experiment: Experiment) => void;
  setCurrentAttempt: (attempt: StudentExperiment) => void;
  addEquipment: (equipment: LabEquipmentItem) => void;
  removeEquipment: (id: string) => void;
  moveEquipment: (id: string, x: number, y: number) => void;
  addChemical: (equipmentId: string, chemicalId: string, volume: number) => void;
  setHeating: (heating: boolean) => void;
  nextStep: () => void;
  previousStep: () => void;
  completeExperiment: () => void;
  resetLab: () => void;
}

export const useLabStore = create<LabStore>((set, get) => ({
  workbench: [],
  selectedEquipment: null,
  currentExperiment: null,
  currentAttempt: null,
  currentStep: 0,
  isHeating: false,
  showSafetyGuidelines: true,

  setCurrentExperiment: (experiment) => set({ 
    currentExperiment: experiment,
    currentStep: 0,
    workbench: [],
    isHeating: false
  }),

  setCurrentAttempt: (attempt) => set({ currentAttempt: attempt }),

  addEquipment: (equipment) => set((state) => ({
    workbench: [...state.workbench, equipment]
  })),

  removeEquipment: (id) => set((state) => ({
    workbench: state.workbench.filter(item => item.id !== id)
  })),

  moveEquipment: (id, x, y) => set((state) => ({
    workbench: state.workbench.map(item =>
      item.id === id ? { ...item, position: { x, y } } : item
    )
  })),

  addChemical: (equipmentId, chemicalId, volume) => set((state) => ({
    workbench: state.workbench.map(item => {
      if (item.id === equipmentId) {
        const existingContents = item.contents || [];
        return {
          ...item,
          contents: [...existingContents, { chemicalId, volume }]
        };
      }
      return item;
    })
  })),

  setHeating: (heating) => set({ isHeating: heating }),

  nextStep: () => set((state) => ({
    currentStep: Math.min(
      state.currentStep + 1,
      (state.currentExperiment?.steps.length || 1) - 1
    )
  })),

  previousStep: () => set((state) => ({
    currentStep: Math.max(state.currentStep - 1, 0)
  })),

  completeExperiment: () => set((state) => ({
    currentAttempt: state.currentAttempt
      ? { ...state.currentAttempt, status: 'completed', completedAt: new Date() }
      : null
  })),

  resetLab: () => set({
    workbench: [],
    selectedEquipment: null,
    currentExperiment: null,
    currentAttempt: null,
    currentStep: 0,
    isHeating: false
  })
}));