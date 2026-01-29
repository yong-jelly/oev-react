import { supabase } from '../../shared/api/supabase';

export interface AdminConfig {
  key: string;
  value: any;
  description: string;
  updatedAt: number;
}

export interface EnforcementSettings {
  baseEnforcementRate: number;
  speedingEnforcementMultiplier: number;
  baseFineAmount: number;
  evasionSuccessRate: number;
  enforcementBypassPenalty: number;
  // 추가된 필드
  maxEnforcementCount: number;
  enforcementCheckProbability: number;
  enforcementFineRate: number;
}

export interface BotStatus {
  botId: string;
  status: 'IDLE' | 'DELIVERING' | 'RESTING';
  currentRunId: string | null;
  lastCompletedAt: number | null;
  nextAvailableAt: number | null;
  totalDeliveries: number;
  nickname: string;
  avatarUrl: string | null;
}

/**
 * 관리자 설정 조회 (RPC 사용)
 */
export async function getAdminConfig(key: string): Promise<any> {
  const configs = await getAllAdminConfigs();
  const config = configs.find(c => c.key === key);
  return config ? config.value : null;
}

/**
 * 전체 관리자 설정 조회 (RPC 사용)
 */
export async function getAllAdminConfigs(): Promise<AdminConfig[]> {
  const { data, error } = await supabase.rpc('v1_get_admin_configs');

  if (error) {
    console.error('Failed to fetch all admin configs via RPC:', error);
    throw new Error('Failed to fetch admin configs');
  }

  return (data || []).map((row: any) => ({
    key: row.config_key,
    value: row.config_value,
    description: row.config_description,
    updatedAt: new Date(row.config_updated_at).getTime(),
  }));
}

/**
 * 관리자 설정 저장 (RPC 사용)
 */
export async function setAdminConfig(key: string, value: any): Promise<void> {
  const { error } = await supabase.rpc('v1_update_admin_config', {
    p_key: key,
    p_value: value
  });

  if (error) {
    console.error(`Failed to update admin config for key ${key} via RPC:`, error);
    throw new Error('Failed to update admin config');
  }
}

/**
 * 봇 상태 목록 조회 (RPC 사용)
 */
export async function getBotStatuses(): Promise<BotStatus[]> {
  const { data, error } = await supabase.rpc('v1_get_bot_statuses');

  if (error) {
    console.error('Failed to fetch bot statuses via RPC:', error);
    throw new Error('Failed to fetch bot statuses');
  }

  return (data || []).map((row: any) => ({
    botId: row.bot_id,
    status: row.status,
    currentRunId: row.current_run_id,
    lastCompletedAt: row.last_completed_at ? new Date(row.last_completed_at).getTime() : null,
    nextAvailableAt: row.next_available_at ? new Date(row.next_available_at).getTime() : null,
    totalDeliveries: row.total_deliveries,
    nickname: row.nickname || 'Unknown Bot',
    avatarUrl: row.avatar_url || null,
  }));
}

/**
 * 봇 시스템 초기화 (관리자용)
 */
export async function resetBotSystem(): Promise<void> {
  const { error } = await supabase.rpc('reset_bot_system');

  if (error) {
    console.error('Failed to reset bot system:', error);
    throw new Error('Failed to reset bot system');
  }
}
