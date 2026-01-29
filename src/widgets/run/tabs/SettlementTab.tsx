import { useState, useMemo } from 'react';
import { DollarSign, Clock, TrendingDown, TrendingUp, AlertTriangle, ArrowUp } from 'lucide-react';
import { useGameStore } from '../../../app/store';

interface OrderInfo {
  title: string;
  baseReward: number;
}

interface SettlementTabProps {
  order: OrderInfo;
  elapsedSeconds: number;
  etaSeconds: number;
  runId: string;
}

interface SettlementItem {
  id: string;
  type: 'base' | 'bonus' | 'penalty' | 'cost' | 'event';
  title: string;
  amount: number;
  isEstimated: boolean;
  timestamp: Date;
}

const EMPTY_ARRAY: any[] = [];

export const SettlementTab = ({ order, elapsedSeconds, etaSeconds, runId }: SettlementTabProps) => {
  const [showScrollTop] = useState(false);
  const eventLogs = useGameStore((state) => state.eventLogs[runId] || EMPTY_ARRAY);

  const isOvertime = elapsedSeconds > etaSeconds;
  const overtimeMinutes = isOvertime ? Math.floor((elapsedSeconds - etaSeconds) / 60) : 0;
  const penaltyAmount = overtimeMinutes * 0.2;

  // 실시간 정산 계산
  const baseReward = order.baseReward;
  const totalPenalty = penaltyAmount + eventLogs.reduce((acc, log) => acc + (log.amount < 0 ? Math.abs(log.amount) : 0), 0);
  const totalBonus = eventLogs.reduce((acc, log) => acc + (log.amount > 0 ? log.amount : 0), 0);
  const currentTotal = Math.max(baseReward - totalPenalty + totalBonus, baseReward * 0.5);

  // 영수증 아이템 계산 (render 시점에 계산하여 무한 루프 방지)
  const items = useMemo(() => {
    const baseItems: SettlementItem[] = [
      {
        id: 'base',
        type: 'base',
        title: '보상',
        amount: baseReward,
        isEstimated: false,
        timestamp: new Date(Date.now() - elapsedSeconds * 1000),
      },
    ];

    // 이벤트 로그 추가
    eventLogs.forEach(log => {
      baseItems.unshift({
        id: log.id,
        type: log.type === 'PENALTY' ? 'penalty' : log.type === 'BONUS' ? 'bonus' : 'event',
        title: log.title,
        amount: log.amount,
        isEstimated: log.isEstimated,
        timestamp: new Date(log.timestamp),
      });
    });

    if (isOvertime && overtimeMinutes > 0) {
      baseItems.unshift({
        id: `penalty-overtime`,
        type: 'penalty',
        title: `지각 패널티 (${overtimeMinutes}분 초과)`,
        amount: -penaltyAmount,
        isEstimated: true,
        timestamp: new Date(),
      });
    }

    return baseItems;
  }, [baseReward, isOvertime, overtimeMinutes, penaltyAmount, elapsedSeconds, eventLogs]);

  const getItemIcon = (type: SettlementItem['type']) => {
    switch (type) {
      case 'base':
        return <DollarSign className="h-4 w-4" />;
      case 'bonus':
        return <TrendingUp className="h-4 w-4" />;
      case 'penalty':
        return <TrendingDown className="h-4 w-4" />;
      case 'cost':
        return <Clock className="h-4 w-4" />;
      case 'event':
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getItemColors = (type: SettlementItem['type'], isEstimated: boolean) => {
    const opacity = isEstimated ? 'opacity-70' : '';
    switch (type) {
      case 'base':
        return `bg-primary-50 text-primary-600 ${opacity}`;
      case 'bonus':
        return `bg-accent-emerald/10 text-accent-emerald ${opacity}`;
      case 'penalty':
        return `bg-accent-rose/10 text-accent-rose ${opacity}`;
      case 'cost':
        return `bg-accent-amber/10 text-accent-amber ${opacity}`;
      case 'event':
        return `bg-surface-100 text-surface-600 ${opacity}`;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      {/* 현재 예상 정산 요약 */}
      <div className="rounded-xl bg-surface-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-surface-500">현재 예상 정산</p>
            <p className={`text-2xl font-medium ${isOvertime ? 'text-accent-rose' : 'text-surface-900'}`}>
              ${currentTotal.toFixed(2)}
            </p>
          </div>
          <div className="text-right text-xs text-surface-500">
            <p>보상: ${baseReward}</p>
            {totalPenalty > 0 && <p className="text-accent-rose">패널티: -${totalPenalty.toFixed(2)}</p>}
          </div>
        </div>
      </div>

      {/* 영수증 타임라인 (역순) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-surface-900">영수증</h4>
          <span className="text-xs text-surface-400">{items.length}건</span>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                item.isEstimated ? 'border-dashed border-surface-300' : 'border-surface-200'
              }`}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${getItemColors(item.type, item.isEstimated)}`}>
                {getItemIcon(item.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-surface-900">{item.title}</p>
                  {item.isEstimated && (
                    <span className="rounded bg-surface-100 px-1.5 py-0.5 text-[10px] text-surface-500">예상</span>
                  )}
                </div>
                <p className="text-xs text-surface-400">{formatTime(item.timestamp)}</p>
              </div>
              <span className={`text-sm font-medium ${item.amount >= 0 ? 'text-surface-900' : 'text-accent-rose'}`}>
                {item.amount >= 0 ? '+' : ''}${item.amount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 스크롤 맨 위로 버튼 */}
      {showScrollTop && (
        <button 
          className="fixed bottom-80 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 text-white shadow-soft-md"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
