import { useNavigate } from 'react-router';
import { Bot, Users, Clock, MapPin } from 'lucide-react';
import { Skeleton } from '../../../shared/ui/Skeleton';
import type { ActiveRunEntry } from '../../../entities/leaderboard/api';
import { formatRelativeTime } from '../../../shared/lib/date';

export const ActiveRunCard = ({ run, isMe = false }: { run: ActiveRunEntry; isMe?: boolean }) => {
  const navigate = useNavigate();
  const progressWidth = Math.min(100, Math.max(0, run.progressPercent));
  
  const handleClick = () => {
    navigate(`/p/status/${run.userId}`);
  };

  return (
    <div 
      onClick={handleClick}
      className={`rounded-xl bg-white border shadow-soft-sm overflow-hidden cursor-pointer active:scale-[0.98] transition-all ${
        isMe 
          ? progressWidth >= 100 
            ? 'border-surface-200 grayscale opacity-80' 
            : 'border-primary-500 border-2 ring-1 ring-primary-500/20' 
          : 'border-surface-100'
      }`}
    >
      {/* 진행률 바 */}
      <div className="h-1 bg-surface-100">
        <div 
          className={`h-full transition-all duration-1000 ${
            isMe 
              ? progressWidth >= 100 
                ? 'bg-surface-400' 
                : 'bg-gradient-to-r from-primary-400 to-primary-600' 
              : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
          }`}
          style={{ width: `${progressWidth}%` }}
        />
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* 아바타 */}
            <div className={`relative h-10 w-10 rounded-full flex items-center justify-center overflow-hidden ${
              run.isBot ? 'bg-amber-100' : isMe ? (progressWidth >= 100 ? 'bg-surface-200' : 'bg-primary-100') : 'bg-surface-100'
            }`}>
              {run.avatarUrl ? (
                <img 
                  src={run.avatarUrl} 
                  alt={run.nickname} 
                  className={`h-full w-full object-cover ${isMe && progressWidth >= 100 ? 'grayscale' : ''}`}
                  loading="lazy"
                  decoding="async"
                />
              ) : run.isBot ? (
                <Bot className="h-5 w-5 text-amber-600" />
              ) : (
                <Users className={`h-5 w-5 ${isMe && progressWidth >= 100 ? 'text-surface-400' : 'text-primary-600'}`} />
              )}
              {/* 라이브 표시 */}
              {progressWidth < 100 && (
                <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white animate-pulse ${
                  isMe ? 'bg-primary-500' : 'bg-emerald-500'
                }`} />
              )}
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${isMe && progressWidth >= 100 ? 'text-surface-600' : 'text-surface-900'}`}>
                  {run.nickname}
                  {isMe && <span className={`ml-1 ${progressWidth >= 100 ? 'text-surface-500' : 'text-primary-600'}`}>(나)</span>}
                </span>
                {run.isBot && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">BOT</span>
                )}
              </div>
              <p className="text-xs text-surface-500 mt-0.5">{run.orderTitle}</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className={`text-sm font-medium ${
              isMe 
                ? progressWidth >= 100 ? 'text-surface-500' : 'text-primary-600' 
                : 'text-emerald-600'
            }`}>
              ${run.currentReward.toLocaleString()}
            </p>
            <p className="text-[10px] text-surface-400">
              {formatRelativeTime(run.startAt)} 시작
            </p>
          </div>
        </div>
        
        {/* 진행 정보 */}
        <div className="mt-3 flex items-center justify-between text-xs text-surface-500">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span className="truncate max-w-[120px]">{run.cargoName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span className={isMe && progressWidth >= 100 ? 'font-medium text-surface-600' : ''}>
              {Math.round(progressWidth)}% 완료
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ActiveRunCardSkeleton = () => (
  <div className="rounded-xl bg-white border border-surface-100 shadow-soft-sm overflow-hidden">
    <div className="h-1 bg-surface-100" />
    <div className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="text-right">
          <Skeleton className="h-4 w-16 mb-2 ml-auto" />
          <Skeleton className="h-3 w-12 ml-auto" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  </div>
);
