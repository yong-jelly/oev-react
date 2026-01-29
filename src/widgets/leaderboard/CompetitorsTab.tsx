import { Users } from 'lucide-react';
import { CompetitorCard, CompetitorCardSkeleton } from './ui/CompetitorCard';
import type { LeaderboardEntry, ActiveRunEntry } from '../../entities/leaderboard/api';

interface CompetitorsTabProps {
  isLoading: boolean;
  leaderboard: LeaderboardEntry[];
  activeRuns: ActiveRunEntry[];
  userProfileId?: string;
}

export const CompetitorsTab = ({
  isLoading,
  leaderboard,
  activeRuns,
  userProfileId,
}: CompetitorsTabProps) => {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-surface-900 flex items-center gap-2">
              경쟁자들
            </h2>
            {!isLoading && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                  <span className="text-xs text-surface-600">봇</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-primary-500"></div>
                  <span className="text-xs text-surface-600">유저</span>
                </div>
              </div>
            )}
          </div>
          {!isLoading && (
            <span className="text-xs text-surface-500">
              {leaderboard.filter(e => e.isBot).length}명의 봇 + {leaderboard.filter(e => !e.isBot).length}명의 유저
            </span>
          )}
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CompetitorCardSkeleton />
            <CompetitorCardSkeleton />
            <CompetitorCardSkeleton />
            <CompetitorCardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 먼저 봇들 표시 */}
            {leaderboard
              .filter(entry => entry.isBot)
              .map((entry) => (
                <CompetitorCard 
                  key={entry.userId} 
                  entry={entry} 
                  isActive={activeRuns.some(r => r.userId === entry.userId)}
                />
              ))}
            {/* 유저들 표시 */}
            {leaderboard
              .filter(entry => !entry.isBot)
              .map((entry) => (
                <CompetitorCard 
                  key={entry.userId} 
                  entry={entry} 
                  isActive={activeRuns.some(r => r.userId === entry.userId)}
                  isMe={entry.userId === userProfileId}
                />
              ))}
          </div>
        )}
        
        {!isLoading && leaderboard.filter(e => !e.isBot).length === 0 && (
          <div className="rounded-xl bg-primary-50 border border-primary-200 p-4 text-center">
            <Users className="h-8 w-8 text-primary-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-primary-700">아직 참여한 유저가 없습니다</p>
            <p className="text-xs text-primary-600 mt-1">첫 번째 유저가 되어 봇들과 경쟁하세요!</p>
          </div>
        )}
      </section>
    </div>
  );
};
