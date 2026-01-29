import { rpcTrucker } from '../../shared/api/supabase';

/**
 * 리더보드 엔트리
 */
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  nickname: string;
  avatarUrl: string | null;
  isBot: boolean;
  balance: number;
  reputation: number;
  totalRuns: number;
  totalEarnings: number;
  periodEarnings: number;
  botStatus?: string;
  botNextAvailableAt?: number;
}

/**
 * 활성 운행 엔트리
 */
export interface ActiveRunEntry {
  runId: string;
  userId: string;
  nickname: string;
  avatarUrl: string | null;
  isBot: boolean;
  orderTitle: string;
  cargoName: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  distance: number;
  currentReward: number;
  status: string;
  startAt: number;
  etaSeconds: number;
  deadlineAt: number;
  progressPercent: number;
}

/**
 * 활동 히트맵 데이터
 */
export interface ActivityDay {
  date: string;
  runsCount: number;
  earnings: number;
  level: number; // 0-4
}

/**
 * 시간대별 활동 데이터
 */
export interface HourlyActivity {
  hour: number;
  runs_count: number;
  earnings: number;
  level: number;
}

/**
 * 거래 내역 엔트리
 */
export interface TransactionEntry {
  id: string;
  userId: string;
  nickname: string;
  avatarUrl: string | null;
  isBot: boolean;
  runId: string | null;
  orderTitle: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: number;
}

/**
 * 통계 요약
 */
export interface StatsSummary {
  totalUsers: number;
  totalBots: number;
  activeRuns: number;
  completedRunsToday: number;
  totalEarningsToday: number;
  topEarnerNickname: string | null;
  topEarnerEarnings: number;
}

export type LeaderboardPeriod = 'all' | 'weekly' | 'daily' | 'monthly';

/**
 * 리더보드 조회
 */
export async function getLeaderboard(period: LeaderboardPeriod = 'weekly'): Promise<LeaderboardEntry[]> {
  const { data, error } = await rpcTrucker('v1_get_leaderboard', { p_period: period });

  if (error) {
    console.error('Failed to fetch leaderboard:', error);
    throw new Error('Failed to fetch leaderboard');
  }

  return (data || []).map((row: any) => ({
    rank: row.rank,
    userId: row.user_id,
    nickname: row.nickname,
    avatarUrl: row.avatar_url,
    isBot: row.is_bot,
    balance: row.balance,
    reputation: row.reputation,
    totalRuns: row.total_runs,
    totalEarnings: row.total_earnings,
    periodEarnings: row.period_earnings,
    botStatus: row.bot_status,
    botNextAvailableAt: row.bot_next_available_at ? new Date(row.bot_next_available_at).getTime() : undefined,
  }));
}

/**
 * 실시간 활성 운행 조회
 */
export async function getAllActiveRuns(): Promise<ActiveRunEntry[]> {
  const { data, error } = await rpcTrucker('v1_get_all_active_runs');

  if (error) {
    console.error('Failed to fetch active runs:', error);
    throw new Error('Failed to fetch active runs');
  }

  return (data || []).map((row: any) => ({
    runId: row.run_id,
    userId: row.user_id,
    nickname: row.nickname,
    avatarUrl: row.avatar_url,
    isBot: row.is_bot,
    orderTitle: row.order_title,
    cargoName: row.cargo_name,
    startLat: row.start_lat,
    startLng: row.start_lng,
    endLat: row.end_lat,
    endLng: row.end_lng,
    distance: row.distance,
    currentReward: row.current_reward,
    status: row.status,
    startAt: new Date(row.start_at).getTime(),
    etaSeconds: row.eta_seconds,
    deadlineAt: new Date(row.deadline_at).getTime(),
    progressPercent: row.progress_percent,
  }));
}

/**
 * 최근 완료된 운행 조회
 */
export async function getRecentCompletedRuns(limit = 20): Promise<ActiveRunEntry[]> {
  const { data, error } = await rpcTrucker('v1_get_recent_completed_runs', { p_limit: limit });

  if (error) {
    console.error('Failed to fetch recent completed runs:', error);
    throw new Error('Failed to fetch recent completed runs');
  }

  return (data || []).map((row: any) => ({
    runId: row.run_id,
    userId: row.user_id,
    nickname: row.nickname,
    avatarUrl: row.avatar_url,
    isBot: row.is_bot,
    orderTitle: row.order_title,
    cargoName: row.cargo_name,
    startLat: row.start_lat,
    startLng: row.start_lng,
    endLat: row.end_lat,
    endLng: row.end_lng,
    distance: row.distance,
    currentReward: row.current_reward,
    status: row.status,
    startAt: new Date(row.start_at).getTime(),
    etaSeconds: row.eta_seconds,
    deadlineAt: new Date(row.deadline_at).getTime(),
    progressPercent: row.progress_percent,
  }));
}

/**
 * 활동 히트맵 데이터 조회
 */
export async function getActivityHeatmap(userId?: string): Promise<ActivityDay[]> {
  const { data, error } = await rpcTrucker('v1_get_activity_heatmap', { 
    p_user_id: userId || null 
  });

  if (error) {
    console.error('Failed to fetch activity heatmap:', error);
    throw new Error('Failed to fetch activity heatmap');
  }

  return (data || []).map((row: any) => ({
    date: row.date,
    runsCount: row.runs_count,
    earnings: row.earnings,
    level: row.level,
  }));
}

/**
 * 시간대별 활동 데이터 조회
 */
export async function getHourlyActivity(userId?: string): Promise<HourlyActivity[]> {
  const { data, error } = await rpcTrucker('v1_get_hourly_activity', { 
    p_user_id: userId || null 
  });

  if (error) {
    console.error('Failed to fetch hourly activity:', error);
    throw new Error('Failed to fetch hourly activity');
  }

  return (data || []).map((row: any) => ({
    hour: row.hour,
    runs_count: row.runs_count,
    earnings: row.earnings,
    level: row.level,
  }));
}

/**
 * 거래 내역 조회
 */
export async function getTransactions(params?: {
  userId?: string;
  limit?: number;
  offset?: number;
  includeBots?: boolean;
}): Promise<TransactionEntry[]> {
  const { data, error } = await rpcTrucker('v1_get_transactions', {
    p_user_id: params?.userId || null,
    p_limit: params?.limit || 50,
    p_offset: params?.offset || 0,
    p_include_bots: params?.includeBots ?? true,
  });

  if (error) {
    console.error('Failed to fetch transactions:', error);
    throw new Error('Failed to fetch transactions');
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    nickname: row.nickname,
    avatarUrl: row.avatar_url,
    isBot: row.is_bot,
    runId: row.run_id,
    orderTitle: row.order_title,
    type: row.type,
    amount: row.amount,
    balanceAfter: row.balance_after,
    description: row.description,
    createdAt: new Date(row.created_at).getTime(),
  }));
}

/**
 * 통계 요약 조회
 */
export async function getStatsSummary(): Promise<StatsSummary> {
  const { data, error } = await rpcTrucker('v1_get_stats_summary');

  if (error) {
    console.error('Failed to fetch stats summary:', error);
    throw new Error('Failed to fetch stats summary');
  }

  return {
    totalUsers: data?.total_users || 0,
    totalBots: data?.total_bots || 0,
    activeRuns: data?.active_runs || 0,
    completedRunsToday: data?.completed_runs_today || 0,
    totalEarningsToday: data?.total_earnings_today || 0,
    topEarnerNickname: data?.top_earner_nickname || null,
    topEarnerEarnings: data?.top_earner_earnings || 0,
  };
}

/**
 * 봇 활동 수동 트리거 (관리자용)
 */
export async function triggerBotActivities(): Promise<any> {
  const { data, error } = await rpcTrucker('v1_trigger_bot_activities');

  if (error) {
    console.error('Failed to trigger bot activities:', error);
    throw new Error('Failed to trigger bot activities');
  }

  return data;
}
