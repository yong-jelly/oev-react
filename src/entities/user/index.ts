import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/shared/api/supabase";

interface UserState {
  user: any | null;
  isAuthenticated: boolean;
  isSyncing: boolean;
  isHydrated: boolean;
  setUser: (user: any) => void;
  clearUser: () => void;
  syncSession: () => Promise<void>;
  setHydrated: (hydrated: boolean) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isSyncing: true,
      isHydrated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user, isSyncing: false }),
      clearUser: () => set({ user: null, isAuthenticated: false, isSyncing: false }),
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
      syncSession: async () => {
        try {
          set({ isSyncing: true });
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) throw error;
          
          if (session) {
            set({ user: session.user, isAuthenticated: true, isSyncing: false });
          } else {
            set({ user: null, isAuthenticated: false, isSyncing: false });
          }
        } catch (error) {
          console.error("Session sync error:", error);
          set({ user: null, isAuthenticated: false, isSyncing: false });
        }
      },
    }),
    {
      name: "user-storage",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        // Hydration 완료 시 호출됨
        state?.setHydrated(true);
      },
    }
  )
);

export * from "./queries";

