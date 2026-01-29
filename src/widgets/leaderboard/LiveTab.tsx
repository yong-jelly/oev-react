import { useNavigate } from 'react-router';
import { Activity, Users } from 'lucide-react';
import { ActiveRunCard, ActiveRunCardSkeleton } from './ui/ActiveRunCard';
import { RankingItemSkeleton } from './ui/RankingItem';
import { Bot } from 'lucide-react';
import type { ActiveRunEntry } from '../../entities/leaderboard/api';

// 상대 시간 표시 함수 (ActiveRunCard에서 사용하지만 여기서도 필요할 수 있음)
const formatRelativeTime = (timestamp: number) => {
  const now = Date.now();
  const diff = Math.max(0, now - timestamp);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  return `${days}일 전`;
};

interface LiveTabProps {
  isLoading: boolean;
  activeRuns: ActiveRunEntry[];
  recentRuns: ActiveRunEntry[];
  userProfileId?: string;
  userNickname?: string;
  userAvatarUrl?: string;
}

export const LiveTab = ({
  isLoading,
  activeRuns,
  recentRuns,
  userProfileId,
  userNickname,
  userAvatarUrl,
}: LiveTabProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* 활성 운행 */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-[11px] font-bold text-surface-500 uppercase tracking-tight flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            실시간 운행
          </h2>
          {!isLoading && <span className="text-[10px] font-medium text-surface-400">{activeRuns.length}건 진행 중</span>}
        </div>
        
        {isLoading ? (
          <div className="space-y-2">
            <ActiveRunCardSkeleton />
            <ActiveRunCardSkeleton />
          </div>
        ) : (
          <div className="space-y-2">
            {/* 나의 운행을 가장 먼저 표시 */}
            {activeRuns
              .filter(run => run.userId === userProfileId)
              .map((run) => (
                <ActiveRunCard key={run.runId} run={run} isMe={true} />
              ))}
            
            {/* 내가 활동 중이 아닐 때 나의 상태 카드 표시 */}
            {!activeRuns.some(run => run.userId === userProfileId) && userProfileId && (
              <div 
                onClick={() => navigate('/')}
                className="rounded-xl bg-white border border-surface-200 p-4 flex flex-col gap-4 cursor-pointer hover:border-primary-200 hover:bg-primary-50/30 transition-all shadow-soft-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-surface-100 flex items-center justify-center overflow-hidden border border-surface-200">
                      {userAvatarUrl ? (
                        <img src={userAvatarUrl} alt={userNickname} className="h-full w-full object-cover grayscale opacity-80" />
                      ) : (
                        <Users className="h-6 w-6 text-surface-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-surface-900">{userNickname}</p>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface-100 text-surface-500">나</span>
                      </div>
                      <p className="text-xs text-surface-500 mt-0.5">현재 대기 중</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {recentRuns.find(r => r.userId === userProfileId) ? (
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-medium text-surface-400 uppercase tracking-tight">마지막 완료</p>
                        <p className="text-xs font-medium text-surface-600">
                          {formatRelativeTime(recentRuns.find(r => r.userId === userProfileId)!.deadlineAt)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[10px] font-medium text-surface-400 uppercase tracking-tight">상태</p>
                    )}
                  </div>
                </div>

                <div className="bg-surface-50 rounded-lg p-3 border border-surface-100">
                  <p className="text-xs text-surface-600 leading-relaxed">
                    새로운 운행을 시작하여 리더보드에 이름을 올리고 수익을 창출해보세요. 
                    실시간 탭에서는 현재 운행 중인 드라이버들의 현황을 볼 수 있습니다.
                  </p>
                </div>

                <button className="w-full py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold shadow-soft-sm active:scale-[0.98] transition-transform">
                  운행 시작하기
                </button>
              </div>
            )}

            {/* 다른 운행들 (봇 및 다른 유저) */}
            {activeRuns
              .filter(run => run.userId !== userProfileId)
              .map((run) => (
                <ActiveRunCard key={run.runId} run={run} />
              ))}
            
            {activeRuns.length === 0 && (
              <div className="rounded-xl bg-white border border-surface-100 p-8 text-center">
                <Activity className="h-10 w-10 text-surface-300 mx-auto mb-3" />
                <p className="text-sm text-surface-500">현재 진행 중인 운행이 없습니다</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 최근 완료 */}
      <section className="space-y-2">
        <div className="px-0.5">
          <h2 className="text-[11px] font-bold text-surface-500 uppercase tracking-tight">최근 완료된 운행</h2>
        </div>
        
        {isLoading ? (
          <div className="space-y-2">
            <RankingItemSkeleton />
            <RankingItemSkeleton />
            <RankingItemSkeleton />
          </div>
        ) : recentRuns.length > 0 ? (
          <div className="space-y-2">
            {recentRuns.slice(0, 5).map((run) => (
              <div 
                key={run.runId}
                onClick={() => navigate(`/p/status/${run.userId}`)}
                className="flex items-center gap-3 rounded-xl bg-white border border-surface-100 p-3 cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center overflow-hidden ${
                  run.isBot ? 'bg-amber-100' : 'bg-primary-100'
                }`}>
                  {run.avatarUrl ? (
                    <img 
                      src={run.avatarUrl} 
                      alt={run.nickname} 
                      className="h-full w-full object-cover" 
                      loading="lazy"
                      decoding="async"
                    />
                  ) : run.isBot ? (
                    <Bot className="h-4 w-4 text-amber-600" />
                  ) : (
                    <Users className="h-4 w-4 text-primary-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-surface-900">{run.nickname}</span>
                  <p className="text-xs text-surface-500 truncate">{run.orderTitle}</p>
                </div>
                <div className="text-right">
                  <span className="block text-sm font-medium text-emerald-600">
                    +${run.currentReward.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-surface-400">
                    {formatRelativeTime(run.deadlineAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-white border border-surface-100 p-6 text-center">
            <p className="text-sm text-surface-500">최근 완료된 운행이 없습니다</p>
          </div>
        )}
      </section>
    </div>
  );
};
