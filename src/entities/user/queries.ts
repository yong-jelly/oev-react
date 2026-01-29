import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, rpcTrucker } from "@/shared/api/supabase";
import { useUserStore } from "./index";

export const userKeys = {
  all: ["user"] as const,
  profile: () => [...userKeys.all, "profile"] as const,
};

// 프로필 타입 정의
export interface UserProfile {
  auth_user_id: string;
  public_profile_id: string;
  nickname: string;
  avatar_url: string | null;
  balance: number;
  reputation: number;
  bio: string | null;
  telegram_chat_id: string | null;
  slack_webhook_url: string | null;
  notification_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// 프로필 데이터가 null인지 확인하는 타입 가드
function isValidProfile(data: unknown): data is UserProfile {
  return (
    data !== null &&
    data !== undefined &&
    typeof data === 'object' &&
    'balance' in data &&
    'reputation' in data &&
    'nickname' in data
  );
}

export function useUserProfile() {
  const { user } = useUserStore();
  
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user) return null;
      
      const { data, error } = await rpcTrucker("v1_get_user_profile", { p_auth_user_id: user.id });
        
      if (error) {
        console.error("Profile fetch error via RPC:", error);
        throw error;
      }
      
      // 유효한 프로필이 아니면 null 반환 (신규 유저)
      if (!isValidProfile(data)) {
        return null;
      }
      
      return data;
    },
    enabled: !!user,
    retry: false, // 프로필이 없는 건 정상 케이스이므로 재시도 안 함
    staleTime: 1000 * 60 * 5, // 5분간 캐시 유지
  });
}

export function useUpsertProfile() {
  const queryClient = useQueryClient();
  const { user } = useUserStore();

  return useMutation({
    mutationFn: async (profile: { 
      nickname: string; 
      bio?: string | null; 
      avatar_url?: string | null;
      telegram_chat_id?: string | null;
      slack_webhook_url?: string | null;
      notification_enabled?: boolean;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await rpcTrucker("v1_upsert_user_profile", {
        p_auth_user_id: user.id,
        p_profile: profile
      });

      if (error) {
        console.error("Profile upsert error via RPC:", error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const { clearUser } = useUserStore();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      clearUser();
      queryClient.clear();
    },
  });
}
