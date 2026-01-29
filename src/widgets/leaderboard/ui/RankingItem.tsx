import { useNavigate } from 'react-router';
import { Bot, Users } from 'lucide-react';
import { Skeleton } from '../../../shared/ui/Skeleton';
import type { LeaderboardEntry } from '../../../entities/leaderboard/api';

export const RankingItem = ({ 
  entry, 
  isMe = false,
  highlight = false,
  periodText = '이번 기간'
}: { 
  entry: LeaderboardEntry; 
  isMe?: boolean;
  highlight?: boolean;
  periodText?: string;
}) => {
  const navigate = useNavigate();

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-amber-400 text-white';
    if (rank === 2) return 'bg-surface-400 text-white';
    if (rank === 3) return 'bg-amber-700 text-white';
    return 'bg-surface-100 text-surface-600';
  };

  const handleClick = () => {
    navigate(`/p/status/${entry.userId}`);
  };

  return (
    <div 
      onClick={handleClick}
      className={`flex items-center gap-3 rounded-xl p-3 transition-colors cursor-pointer active:scale-[0.98] ${
        isMe 
          ? 'bg-primary-50 border-2 border-primary-500' 
          : highlight 
            ? 'bg-primary-50 border border-primary-200' 
            : 'bg-white border border-surface-100'
      }`}
    >
      {/* 순위 */}
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium ${getRankStyle(entry.rank)}`}>
        {entry.rank}
      </div>
      
      {/* 프로필 */}
      <div className={`h-10 w-10 rounded-full flex items-center justify-center overflow-hidden ${
        entry.isBot ? 'bg-amber-100' : 'bg-primary-100'
      }`}>
        {entry.avatarUrl ? (
          <img 
            src={entry.avatarUrl} 
            alt={entry.nickname} 
            className="h-full w-full object-cover" 
            loading="lazy"
            decoding="async"
          />
        ) : entry.isBot ? (
          <Bot className="h-5 w-5 text-amber-600" />
        ) : (
          <Users className="h-5 w-5 text-primary-600" />
        )}
      </div>
      
      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-surface-900 truncate">{entry.nickname}</span>
          {entry.isBot && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 shrink-0">BOT</span>
          )}
          {isMe && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary-100 text-primary-700 shrink-0">나</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-surface-500 mt-0.5">
          <span>평판: {entry.reputation}</span>
          <span>완료: {entry.totalRuns}</span>
        </div>
      </div>
      
      {/* 수익 */}
      <div className="text-right">
        <p className="text-sm font-medium text-emerald-600">${entry.periodEarnings.toLocaleString()}</p>
        <p className="text-[10px] text-surface-400">{periodText}</p>
      </div>
    </div>
  );
};

export const RankingItemSkeleton = () => (
  <div className="flex items-center gap-3 rounded-xl p-3 bg-white border border-surface-100">
    <Skeleton className="h-8 w-8 rounded-lg" />
    <Skeleton className="h-10 w-10 rounded-full" />
    <div className="flex-1">
      <Skeleton className="h-4 w-32 mb-2" />
      <Skeleton className="h-3 w-24" />
    </div>
    <div className="text-right">
      <Skeleton className="h-4 w-16 mb-2 ml-auto" />
      <Skeleton className="h-2 w-10 ml-auto" />
    </div>
  </div>
);
