import { Bot, Clock, Play } from 'lucide-react';
import { useNavigate } from 'react-router';
import { type BotStatus } from '../../../entities/admin/api.ts';
import { getTimeDiff } from '../../../shared/lib/date';

interface BotStatusCardProps {
  bot: BotStatus;
  onTrigger?: () => void;
  isTriggering?: boolean;
}

export const BotStatusCard = ({ bot, onTrigger, isTriggering }: BotStatusCardProps) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERING': return 'bg-emerald-500 text-white';
      case 'RESTING': return 'bg-surface-500 text-white';
      default: return 'bg-amber-500 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DELIVERING': return '운행 중';
      case 'RESTING': return getRestTimeDisplay(bot.nextAvailableAt || 0);
      default: return '휴식 중';
    }
  };

  const getRestTimeDisplay = (nextAvailableAt: number) => {
    const { totalHours, minutes, seconds } = getTimeDiff(nextAvailableAt);
    if (totalHours >= 1) return `${totalHours}시간 후 복귀`;
    if (minutes > 0) return `${minutes}분 ${seconds}초 후 복귀`;
    return `${seconds}초 후 복귀`;
  };

  const handleCardClick = () => {
    navigate(`/p/status/${bot.botId}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200 shadow-soft-sm cursor-pointer hover:border-amber-300 transition-all active:scale-[0.98]"
    >
      {/* 상태 표시 뱃지 */}
      <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(bot.status)}`}>
        {bot.status === 'RESTING' ? <Clock className="h-3 w-3" /> : <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
        {getStatusText(bot.status)}
      </div>

      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-amber-200 overflow-hidden flex items-center justify-center border border-amber-300">
          {bot.avatarUrl ? (
            <img 
              src={bot.avatarUrl} 
              alt={bot.nickname} 
              className="h-full w-full object-cover" 
              loading="lazy"
              decoding="async"
            />
          ) : (
            <Bot className="h-6 w-6 text-amber-700" />
          )}
        </div>
        <div className="flex-1 min-w-0 pr-16">
          <p className="text-sm font-medium text-surface-900 truncate">{bot.nickname}</p>
          <p className="text-[10px] text-surface-500 mt-0.5">배송 전문가</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="text-center py-1.5 bg-white/50 rounded-lg border border-amber-100/50">
          <p className="text-[10px] text-surface-500">완료 횟수</p>
          <p className="text-sm font-medium text-surface-900">{bot.totalDeliveries}회</p>
        </div>
        <div className="flex items-center justify-center">
          {bot.status === 'IDLE' && onTrigger && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTrigger();
              }}
              disabled={isTriggering}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-[10px] font-bold hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              {isTriggering ? <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Play className="h-3 w-3 fill-current" />}
              활동 트리거
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
