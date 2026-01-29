import { useNavigate } from 'react-router';
import { Bot, Users } from 'lucide-react';
import { Skeleton } from '../../../shared/ui/Skeleton';
import type { TransactionEntry } from '../../../entities/leaderboard/api';
import { formatKSTTime } from '../../../shared/lib/date';

export const TransactionItem = ({ tx }: { tx: TransactionEntry }) => {
  const navigate = useNavigate();
  const isPositive = tx.amount > 0;
  
  const handleClick = () => {
    navigate(`/p/status/${tx.userId}`);
  };

  return (
    <div 
      onClick={handleClick}
      className="flex items-center gap-3 py-3 border-b border-surface-100 last:border-0 cursor-pointer active:opacity-70 transition-opacity"
    >
      {/* 아바타 추가 */}
      <div className={`h-8 w-8 rounded-full flex items-center justify-center overflow-hidden shrink-0 ${
        tx.isBot ? 'bg-amber-100' : 'bg-primary-100'
      }`}>
        {tx.avatarUrl ? (
          <img 
            src={tx.avatarUrl} 
            alt={tx.nickname} 
            className="h-full w-full object-cover" 
            loading="lazy"
            decoding="async"
          />
        ) : tx.isBot ? (
          <Bot className="h-4 w-4 text-amber-600" />
        ) : (
          <Users className="h-4 w-4 text-primary-600" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-surface-900 truncate">{tx.nickname}</span>
          {tx.isBot && (
            <span className="px-1 py-0.5 rounded text-[8px] font-medium bg-amber-100 text-amber-700">BOT</span>
          )}
        </div>
        <p className="text-xs text-surface-500 truncate">{tx.description || tx.orderTitle}</p>
      </div>
      
      <div className="text-right">
        <p className={`text-sm font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
          {isPositive ? '+' : ''}{tx.amount.toLocaleString()}
        </p>
        <p className="text-[10px] text-surface-400">
          {formatKSTTime(tx.createdAt)}
        </p>
      </div>
    </div>
  );
};

export const TransactionItemSkeleton = () => (
  <div className="flex items-center gap-3 py-3 border-b border-surface-100 last:border-0">
    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
    <div className="flex-1">
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-3 w-40" />
    </div>
    <div className="text-right">
      <Skeleton className="h-4 w-12 mb-2 ml-auto" />
      <Skeleton className="h-2 w-10 ml-auto" />
    </div>
  </div>
);
