import { useState } from 'react';
import { AlertTriangle, Shield, CheckCircle, XCircle } from 'lucide-react';

interface GameEvent {
  id: string;
  type: 'police' | 'accident' | 'bonus';
  title: string;
  description: string;
  timestamp: Date;
  resolved: boolean;
  result?: {
    choice: string;
    etaChange: number;
    moneyChange: number;
  };
}

export const EventsTab = () => {
  const [events] = useState<GameEvent[]>([
    // 현재는 이벤트 없음 상태
  ]);

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-100">
          <Shield className="h-8 w-8 text-surface-300" />
        </div>
        <p className="mt-4 text-sm font-medium text-surface-900">아직 이벤트가 없습니다</p>
        <p className="mt-1 text-center text-xs text-surface-500">
          운행 중 단속, 사고, 보너스 등의<br/>이벤트가 여기에 표시됩니다
        </p>

        {/* 이벤트 예시 카드 */}
        <div className="mt-6 w-full space-y-3 opacity-50">
          <p className="text-xs font-medium text-surface-400">이벤트 예시</p>
          
          <div className="rounded-xl border border-dashed border-surface-300 p-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-amber/10">
                <AlertTriangle className="h-4 w-4 text-accent-amber" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-surface-700">단속 감지</p>
                <p className="text-xs text-surface-400">전방에 경찰 검문이 있습니다</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button disabled className="flex-1 rounded-lg bg-surface-100 py-2 text-xs font-medium text-surface-400">
                서류 제시
              </button>
              <button disabled className="flex-1 rounded-lg bg-surface-100 py-2 text-xs font-medium text-surface-400">
                우회
              </button>
              <button disabled className="flex-1 rounded-lg bg-surface-100 py-2 text-xs font-medium text-surface-400">
                돌파
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getEventIcon = (type: GameEvent['type']) => {
    switch (type) {
      case 'police':
        return <AlertTriangle className="h-4 w-4" />;
      case 'accident':
        return <XCircle className="h-4 w-4" />;
      case 'bonus':
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getEventColors = (type: GameEvent['type']) => {
    switch (type) {
      case 'police':
        return 'bg-accent-amber/10 text-accent-amber';
      case 'accident':
        return 'bg-accent-rose/10 text-accent-rose';
      case 'bonus':
        return 'bg-accent-emerald/10 text-accent-emerald';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-surface-900">이벤트 타임라인</h4>
        <span className="text-xs text-surface-400">{events.length}건</span>
      </div>

      {events.map((event) => (
        <div key={event.id} className="rounded-xl border border-surface-200 p-4">
          <div className="flex items-start gap-3">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${getEventColors(event.type)}`}>
              {getEventIcon(event.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-surface-900">{event.title}</p>
                {event.resolved && (
                  <span className="rounded bg-surface-100 px-1.5 py-0.5 text-[10px] text-surface-500">처리됨</span>
                )}
              </div>
              <p className="text-xs text-surface-500">{event.description}</p>
            </div>
            <span className="text-xs text-surface-400">
              {event.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {event.result && (
            <div className="mt-3 rounded-lg bg-surface-50 p-2 text-xs">
              <p className="text-surface-600">
                선택: <span className="font-medium">{event.result.choice}</span>
              </p>
              <div className="mt-1 flex gap-3">
                {event.result.etaChange !== 0 && (
                  <span className={event.result.etaChange > 0 ? 'text-accent-rose' : 'text-accent-emerald'}>
                    ETA {event.result.etaChange > 0 ? '+' : ''}{event.result.etaChange}분
                  </span>
                )}
                {event.result.moneyChange !== 0 && (
                  <span className={event.result.moneyChange < 0 ? 'text-accent-rose' : 'text-accent-emerald'}>
                    ${event.result.moneyChange > 0 ? '+' : ''}{event.result.moneyChange}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
