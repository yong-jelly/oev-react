import { useNavigate } from 'react-router';
import { Bot, Users, Clock } from 'lucide-react';
import { Skeleton } from '../../../shared/ui/Skeleton';
import type { LeaderboardEntry } from '../../../entities/leaderboard/api';
import { getTimeDiff } from '../../../shared/lib/date';

export const CompetitorCard = ({ 
  entry, 
  isActive, 
  isMe = false 
}: { 
  entry: LeaderboardEntry; 
  isActive: boolean;
  isMe?: boolean;
}) => {
  const navigate = useNavigate();

  // 봇별 특성 설명
  const getBotDescription = (nickname: string) => {
    switch (nickname) {
      case 'Bot_Alpha': return '서울 강남권 퀵서비스 전문';
      case 'Bot_Beta': return '부산 해운대~서면 루트 마스터';
      case 'Bot_Gamma': return '대전-세종 행정타운 서류배송';
      case 'Bot_Delta': return '수도권 광역 장거리 전문';
      case 'Bot_Epsilon': return '전국 순회 프리랜서 라이더';
      default: return '배송 전문가';
    }
  };

  // 휴식 시간 표시 텍스트 생성
  const getRestTimeDisplay = (nextAvailableAt: number) => {
    const { totalHours, minutes, seconds } = getTimeDiff(nextAvailableAt);
    
    if (totalHours >= 1) return `${totalHours}시간 후 복귀`;
    if (minutes > 0) return `${minutes}분 ${seconds}초 후 복귀`;
    return `${seconds}초 후 복귀`;
  };

  const handleClick = () => {
    navigate(`/p/status/${entry.userId}`);
  };

  return (
    <div 
      onClick={handleClick}
      className={`relative rounded-xl p-4 transition-all cursor-pointer active:scale-[0.98] ${
        entry.isBot 
          ? 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200' 
          : isMe
            ? 'bg-gradient-to-br from-primary-50 to-blue-50 border-2 border-primary-500 shadow-soft-md'
            : 'bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-200'
      }`}
    >
      {/* 활성 표시 (운행 중) - 봇과 유저 모두 */}
      {isActive && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-medium">
          <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          운행 중
        </div>
      )}

      {/* 봇 전용 상태 표시 (실제 운행이 없는 경우) */}
      {entry.isBot && !isActive && (
        <>
          {/* 휴식 중 표시 (복귀 시간 표시) - RESTING 상태이고 복귀 시간이 있을 때만 */}
          {entry.botStatus === 'RESTING' && entry.botNextAvailableAt && (
            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-500 text-white text-[10px] font-medium">
              <Clock className="h-3 w-3" />
              {getRestTimeDisplay(entry.botNextAvailableAt)}
            </div>
          )}
          {/* 대기 중 표시 - RESTING이 아니거나, RESTING이지만 복귀 시간이 없는 경우 */}
          {!(entry.botStatus === 'RESTING' && entry.botNextAvailableAt) && (
            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-medium">
              <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              대기 중
            </div>
          )}
        </>
      )}

      {/* 유저 대기 중 표시 */}
      {!entry.isBot && !isActive && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-500 text-white text-[10px] font-medium">
          <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          대기 중
        </div>
      )}
      
      {/* 본인 표시 뱃지 */}
      {isMe && (
        <div className="absolute -top-2 -left-2 bg-primary-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10">
          나
        </div>
      )}
      
      <div className="flex items-center gap-3">
        {/* 아바타 */}
        <div className={`h-12 w-12 rounded-full flex items-center justify-center overflow-hidden ${
          entry.isBot ? 'bg-amber-200' : 'bg-primary-200'
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
            <Bot className="h-6 w-6 text-amber-700" />
          ) : (
            <Users className="h-6 w-6 text-primary-700" />
          )}
        </div>
        
        {/* 정보 */}
        <div className="flex-1 min-w-0 pr-16">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-surface-900 truncate">{entry.nickname}</span>
          </div>
          <p className="text-xs text-surface-600 mt-0.5 truncate">{getBotDescription(entry.nickname)}</p>
        </div>
      </div>
      
      {/* 스탯 */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="text-center">
          <p className="text-[10px] text-surface-500">평판</p>
          <p className="text-sm font-medium text-surface-900">{entry.reputation}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-surface-500">완료</p>
          <p className="text-sm font-medium text-surface-900">{entry.totalRuns}회</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-surface-500">수익</p>
          <p className="text-sm font-medium text-emerald-600">${entry.periodEarnings.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export const CompetitorCardSkeleton = () => (
  <div className="rounded-xl p-4 bg-white border border-surface-100">
    <div className="flex items-center gap-3">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
    <div className="mt-3 grid grid-cols-3 gap-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="text-center">
          <Skeleton className="h-2 w-8 mx-auto mb-1" />
          <Skeleton className="h-4 w-12 mx-auto" />
        </div>
      ))}
    </div>
  </div>
);
