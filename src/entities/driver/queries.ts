import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDriverPersonas, getDriverPersonaById, hireDriver } from './api';
import { userKeys } from '../user/queries';

export const driverKeys = {
  all: ['driver'] as const,
  personas: () => [...driverKeys.all, 'personas'] as const,
  persona: (id: string) => [...driverKeys.personas(), id] as const,
};

/**
 * 모든 드라이버 페르소나 조회
 */
export function useDriverPersonas() {
  return useQuery({
    queryKey: driverKeys.personas(),
    queryFn: getDriverPersonas,
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
  });
}

/**
 * 특정 드라이버 페르소나 조회
 */
export function useDriverPersona(personaId: string) {
  return useQuery({
    queryKey: driverKeys.persona(personaId),
    queryFn: () => getDriverPersonaById(personaId),
    enabled: !!personaId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 드라이버 고용 mutation
 */
export function useHireDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: hireDriver,
    onSuccess: () => {
      // 사용자 프로필 갱신 (잔액 변경 반영)
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
      // 드라이버 페르소나 목록은 변경되지 않으므로 갱신 불필요
    },
  });
}
