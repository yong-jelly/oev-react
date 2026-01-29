import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getEquipments, 
  getAllEquipmentsAdmin, 
  getUserEquipments, 
  updateEquipment,
  type Equipment,
  type UserEquipment,
} from './api';

/**
 * 전체 장비 목록 조회 훅
 */
export function useEquipments() {
  return useQuery<Equipment[], Error>({
    queryKey: ['equipments'],
    queryFn: getEquipments,
    staleTime: 1000 * 60 * 5, // 5분간 캐시
  });
}

/**
 * 관리자용 전체 장비 목록 조회 훅 (비활성 포함)
 */
export function useAllEquipmentsAdmin() {
  return useQuery<Equipment[], Error>({
    queryKey: ['equipments', 'admin'],
    queryFn: getAllEquipmentsAdmin,
    staleTime: 1000 * 60 * 1, // 1분간 캐시 (관리자는 자주 새로고침)
  });
}

/**
 * 유저 보유 장비 목록 조회 훅
 */
export function useUserEquipments(userId: string | undefined) {
  return useQuery<UserEquipment[], Error>({
    queryKey: ['userEquipments', userId],
    queryFn: () => getUserEquipments(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2분간 캐시
  });
}

/**
 * 장비 수정 뮤테이션 훅 (관리자용)
 */
export function useUpdateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateEquipment,
    onSuccess: () => {
      // 장비 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['equipments'] });
    },
  });
}
