import { rpcTrucker } from '../../shared/api/supabase';
import type { Run } from '../../shared/api/types';

/**
 * 진행 중인 운행 정보 (주문/슬롯 정보 포함)
 */
export interface ActiveRun {
  run: Run;
  order: {
    title: string;
    category: string;
    cargoName: string;
    distance: number;
    baseReward: number;
  };
  slotIndex: number;
}

/**
 * 유저의 진행 중인 운행 목록 조회
 */
export async function getActiveRuns(userId: string): Promise<ActiveRun[]> {
  const { data, error } = await rpcTrucker('v1_get_active_runs', { p_user_id: userId });

  if (error) {
    console.error('Failed to fetch active runs:', error);
    throw new Error('Failed to fetch active runs');
  }

  return (data || []).map((row: any) => ({
    run: {
      id: row.run_id,
      orderId: row.order_id,
      slotId: row.slot_id,
      status: row.status,
      startAt: new Date(row.start_at).getTime(),
      etaSeconds: row.eta_seconds,
      deadlineAt: new Date(row.deadline_at).getTime(),
      selectedItems: {
        equipmentId: row.selected_equipment_id,
        documentId: row.selected_document_id,
        insuranceId: row.selected_insurance_id,
      },
      currentReward: row.current_reward,
      accumulatedPenalty: row.accumulated_penalty,
      accumulatedBonus: row.accumulated_bonus,
      currentRisk: row.current_risk,
      currentDurability: row.current_durability,
      maxEnforcementCount: row.max_enforcement_count || 0,
      enforcementProbability: row.enforcement_probability || 0,
      fineRate: row.fine_rate || 0,
    },
    order: {
      title: row.order_title,
      category: row.order_category,
      cargoName: row.order_cargo_name,
      distance: row.order_distance,
      baseReward: row.order_base_reward,
    },
    slotIndex: row.slot_index,
  }));
}

/**
 * 운행 상세 정보 (주문/슬롯 정보 포함)
 */
export interface RunDetail {
  run: Run;
    order: {
    title: string;
    category: string;
    cargoName: string;
    distance: number;
    baseReward: number;
    weight: number;
    limitTimeMinutes: number;
    startPoint: [number, number];
    endPoint: [number, number];
    requiredEquipmentType: string | null;
  };
  slotIndex: number;
}

/**
 * 특정 운행 상세 조회
 */
export async function getRunById(runId: string): Promise<RunDetail | null> {
  const { data, error } = await rpcTrucker('v1_get_run_by_id', { p_run_id: runId });

  if (error) {
    console.error('Failed to fetch run:', error);
    throw new Error('Failed to fetch run');
  }

  if (!data || data.length === 0) {
    return null;
  }

  const row = data[0];
  return {
    run: {
      id: row.run_id,
      orderId: row.order_id,
      slotId: row.slot_id,
      status: row.status,
      startAt: new Date(row.start_at).getTime(),
      completedAt: row.completed_at ? new Date(row.completed_at).getTime() : null,
      etaSeconds: row.eta_seconds,
      deadlineAt: new Date(row.deadline_at).getTime(),
      selectedItems: {
        equipmentId: row.selected_equipment_id,
        documentId: row.selected_document_id,
        insuranceId: row.selected_insurance_id,
      },
      currentReward: row.current_reward,
      accumulatedPenalty: row.accumulated_penalty,
      accumulatedBonus: row.accumulated_bonus,
      currentRisk: row.current_risk,
      currentDurability: row.current_durability,
      maxEnforcementCount: row.max_enforcement_count || 0,
      enforcementProbability: row.enforcement_probability || 0,
      fineRate: row.fine_rate || 0,
    },
    order: {
      title: row.order_title,
      category: row.order_category,
      cargoName: row.order_cargo_name,
      distance: row.order_distance,
      baseReward: row.order_base_reward,
      weight: row.order_weight,
      limitTimeMinutes: row.order_limit_time_minutes,
      startPoint: [row.order_start_lat, row.order_start_lng],
      endPoint: [row.order_end_lat, row.order_end_lng],
      requiredEquipmentType: row.order_required_equipment_type,
    },
    slotIndex: row.slot_index,
  };
}

/**
 * 운행 완료 및 정산 처리
 */
/**
 * 운행 히스토리 정보
 */
export interface RunHistory {
  runId: string;
  orderId: string;
  status: string;
  startAt: number;
  completedAt: number | null;
  selectedEquipmentId: string | null;
  currentReward: number;
  accumulatedPenalty: number;
  orderTitle: string;
  orderCargoName: string;
  orderDistance: number;
  orderCategory: string;
}

/**
 * 사용자의 운행 히스토리 조회
 */
export async function getRunHistory(params: {
  userId: string;
  equipmentId?: string;
  limit?: number;
}): Promise<RunHistory[]> {
  const { data, error } = await rpcTrucker('v1_get_run_history', {
    p_user_id: params.userId,
    p_equipment_id: params.equipmentId,
    p_limit: params.limit || 20,
  });

  if (error) {
    console.error('Failed to fetch run history:', error);
    throw new Error('Failed to fetch run history');
  }

  return (data || []).map((row: any) => ({
    runId: row.run_id,
    orderId: row.order_id,
    status: row.status,
    startAt: new Date(row.start_at).getTime(),
    completedAt: row.completed_at ? new Date(row.completed_at).getTime() : null,
    selectedEquipmentId: row.selected_equipment_id,
    currentReward: row.current_reward,
    accumulatedPenalty: row.accumulated_penalty,
    orderTitle: row.order_title,
    orderCargoName: row.order_cargo_name,
    orderDistance: row.order_distance,
    orderCategory: row.order_category,
  }));
}

export interface CompleteRunResult {
  success: boolean;
  alreadyCompleted: boolean;
  data?: any;
}

export async function completeRun(params: {
  runId: string;
  finalReward: number;
  penaltyAmount: number;
  elapsedSeconds: number;
}): Promise<CompleteRunResult> {
  const { data, error } = await rpcTrucker('v1_complete_run', {
    p_run_id: params.runId,
    p_final_reward: Math.floor(params.finalReward),
    p_penalty_amount: Math.floor(params.penaltyAmount),
    p_elapsed_seconds: params.elapsedSeconds,
  });

  if (error) {
    // 이미 완료/취소된 경우는 에러가 아닌 정상 처리로 간주
    if (error.code === 'P0001' && error.message?.includes('already completed')) {
      console.log('Run already completed (possibly by cron), proceeding normally');
      return { success: true, alreadyCompleted: true };
    }
    
    console.error('Failed to complete run:', error);
    throw error;
  }

  return { success: true, alreadyCompleted: false, data };
}

export async function createRun(params: {
  userId: string;
  orderId: string;
  slotId: string;
  selectedItems: { equipmentId?: string; documentId?: string; insuranceId?: string };
}): Promise<Run> {
  const { userId, orderId, slotId, selectedItems } = params;

  // DB 함수(RPC)를 호출하여 원자적으로 처리 (trucker 스키마)
  const { data: run, error: runError } = await rpcTrucker('v1_create_run', {
    p_user_id: userId,
    p_order_id: orderId,
    p_slot_id: slotId,
    p_selected_items: selectedItems
  });

  if (runError || !run) {
    console.error('Failed to create run via RPC:', runError);
    throw new Error(runError?.message || 'Failed to create run');
  }

  // 카멜케이스 변환하여 반환
  return {
    id: run.id,
    orderId: run.order_id,
    slotId: run.slot_id,
    status: run.status,
    startAt: new Date(run.start_at).getTime(),
    etaSeconds: run.eta_seconds,
    deadlineAt: new Date(run.deadline_at).getTime(),
    selectedItems: {
      equipmentId: run.selected_equipment_id,
      documentId: run.selected_document_id,
      insuranceId: run.selected_insurance_id,
    },
    currentReward: run.current_reward,
    accumulatedPenalty: run.accumulated_penalty,
    accumulatedBonus: run.accumulated_bonus,
      currentRisk: run.current_risk,
      currentDurability: run.current_durability,
      maxEnforcementCount: run.max_enforcement_count || 0,
      enforcementProbability: run.enforcement_probability || 0,
      fineRate: run.fine_rate || 0,
    };
}
