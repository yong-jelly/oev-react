import { Trophy } from 'lucide-react';
import { RankingItem, RankingItemSkeleton } from './ui/RankingItem';
import type { LeaderboardEntry, LeaderboardPeriod } from '../../entities/leaderboard/api';

interface RankingTabProps {
  isLoading: boolean;
  leaderboard: LeaderboardEntry[];
  period: LeaderboardPeriod;
  setPeriod: (period: LeaderboardPeriod) => void;
  userProfileId?: string;
}

export const RankingTab = ({
  isLoading,
  leaderboard,
  period,
  setPeriod,
  userProfileId,
}: RankingTabProps) => {
  const getPeriodText = (p: LeaderboardPeriod) => {
    switch (p) {
      case 'daily': return '오늘 수익';
      case 'weekly': return '주간 수익';
      case 'monthly': return '월간 수익';
      case 'all': return '누적 수익';
      default: return '수익';
    }
  };

  return (
    <div className="space-y-6">
      {/* 기간 선택 */}
      <div className="flex gap-2">
        {(['daily', 'weekly', 'monthly', 'all'] as LeaderboardPeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              period === p
                ? 'bg-primary-600 text-white'
                : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-50'
            }`}
          >
            {p === 'daily' && '오늘'}
            {p === 'weekly' && '이번 주'}
            {p === 'monthly' && '이번 달'}
            {p === 'all' && '전체'}
          </button>
        ))}
      </div>

      {/* 순위표 */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-surface-900 flex items-center gap-2">
          순위표
        </h2>
        
        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <RankingItemSkeleton key={i} />)
          ) : leaderboard.length > 0 ? (
            leaderboard.map((entry) => (
              <RankingItem 
                key={entry.userId} 
                entry={entry} 
                isMe={entry.userId === userProfileId}
                periodText={getPeriodText(period)}
              />
            ))
          ) : (
            <div className="rounded-xl bg-white border border-surface-100 p-8 text-center">
              <Trophy className="h-10 w-10 text-surface-300 mx-auto mb-3" />
              <p className="text-sm text-surface-500">랭킹 데이터가 없습니다</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
