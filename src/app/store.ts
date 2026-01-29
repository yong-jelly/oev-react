import { create } from 'zustand';
import type { Order, Slot, Run, EventLog } from '../shared/api/types';

interface GameState {
  slots: Slot[];
  availableOrders: Order[];
  currentRuns: Run[];
  eventLogs: Record<string, EventLog[]>; // runId -> EventLog[]
  
  // Actions
  setSlots: (slots: Slot[]) => void;
  setOrders: (orders: Order[]) => void;
  addRun: (run: Run) => void;
  addEventLog: (runId: string, log: EventLog) => void;
}

export const useGameStore = create<GameState>((set) => ({
  slots: [], // DB에서 로드됨 (v1_get_user_slots)
  availableOrders: [],
  currentRuns: [],
  eventLogs: {},

  setSlots: (slots) => set({ slots }),
  setOrders: (orders) => set({ availableOrders: orders }),
  addRun: (run) => set((state) => ({ currentRuns: [...state.currentRuns, run] })),
  addEventLog: (runId, log) => set((state) => ({
    eventLogs: {
      ...state.eventLogs,
      [runId]: [log, ...(state.eventLogs[runId] || [])]
    }
  })),
}));
