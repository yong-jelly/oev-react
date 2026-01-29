import { rpcTrucker } from '../../shared/api/supabase';
import type { Slot } from '../../shared/api/types';

/**
 * 유저의 슬롯 목록 조회
 * DB에 슬롯이 없으면 자동 생성됩니다.
 */
export async function getUserSlots(userId: string): Promise<Slot[]> {
  const { data, error } = await rpcTrucker('v1_get_user_slots', { p_user_id: userId });

  if (error) {
    console.error('Failed to fetch user slots via RPC:', error);
    throw new Error('Failed to fetch user slots');
  }

  return (data || []).map(mapDbSlotToSlot);
}

/**
 * DB 모델을 프론트엔드 Slot 타입으로 변환
 */
function mapDbSlotToSlot(dbSlot: any): Slot {
  return {
    id: dbSlot.id,
    index: dbSlot.index,
    isLocked: dbSlot.is_locked,
    activeRunId: dbSlot.active_run_id || undefined,
  };
}
