import { MapPin, Clock, Package, Navigation } from 'lucide-react';
import { CATEGORY_LABELS } from '../../../shared/lib/mockData';

interface OrderInfo {
  title: string;
  category: string;
  cargoName: string;
  distance: number;
  baseReward: number;
  weight: number;
  endPoint: [number, number];
  limitTimeMinutes: number;
}

interface OverviewTabProps {
  order: OrderInfo;
  elapsedSeconds: number;
  etaSeconds: number;
  remainingSeconds: number;
}

export const OverviewTab = ({ order, elapsedSeconds, etaSeconds }: OverviewTabProps) => {
  const progress = Math.min((elapsedSeconds / etaSeconds) * 100, 100);
  const remainingSeconds = Math.max(etaSeconds - elapsedSeconds, 0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 예상 진행 거리 (단순 비율 계산)
  const estimatedDistance = (order.distance * progress / 100).toFixed(1);

  return (
    <div className="space-y-4">
      {/* 경로 진행 상황 */}
      <div className="rounded-xl bg-surface-50 p-4">
        <div className="flex items-center justify-between text-xs text-surface-500">
          <span>출발</span>
          <span>도착</span>
        </div>
        <div className="relative mt-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-200">
            <div 
              className="h-full bg-primary-500 transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div 
            className="absolute -top-1 h-4 w-4 rounded-full border-2 border-white bg-primary-500 shadow-sm transition-all duration-1000"
            style={{ left: `calc(${progress}% - 8px)` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm">
            <Navigation className="h-3.5 w-3.5 text-primary-500" />
            <span className="font-medium text-surface-900">{estimatedDistance}km</span>
            <span className="text-surface-400">/ {order.distance}km</span>
          </div>
          <div className="text-sm">
            <span className="font-medium text-surface-900">{progress.toFixed(0)}%</span>
            <span className="text-surface-400"> 진행</span>
          </div>
        </div>
      </div>

      {/* 주문 정보 */}
      <div className="rounded-xl border border-surface-200 bg-white p-4">
        <h4 className="text-sm font-medium text-surface-900">주문 정보</h4>
        <div className="mt-3 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50">
              <Package className="h-4 w-4 text-primary-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-900">{order.cargoName}</p>
              <p className="text-xs text-surface-500">{CATEGORY_LABELS[order.category]} · {order.weight}kg</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-emerald/10">
              <MapPin className="h-4 w-4 text-accent-emerald" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-900">도착지</p>
              <p className="text-xs text-surface-500">
                {order.endPoint[0].toFixed(4)}, {order.endPoint[1].toFixed(4)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-amber/10">
              <Clock className="h-4 w-4 text-accent-amber" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-900">남은 시간</p>
              <p className="text-xs text-surface-500">
                {formatTime(remainingSeconds)} / {order.limitTimeMinutes}분
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 예약된 다음 주문 (없음) */}
      <div className="rounded-xl border border-dashed border-surface-300 bg-white p-4 text-center">
        <p className="text-sm text-surface-500">예약된 다음 주문이 없습니다</p>
        <p className="mt-1 text-xs text-surface-400">예약 슬롯은 추후 업데이트 예정</p>
      </div>
    </div>
  );
};
