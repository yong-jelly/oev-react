import { MapPin, Clock, Package, DollarSign, ChevronRight, Bike, Truck, Plane, Anchor } from 'lucide-react';
import type { Order } from '../../shared/api/types';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../../shared/lib/mockData';

interface OrderCardProps {
  order: Order;
  onClick: () => void;
  disabled?: boolean;
  disabledReason?: string;
}

const EQUIPMENT_ICONS: Record<string, any> = {
  BICYCLE: Bike,
  VAN: Truck,
  TRUCK: Truck,
  HEAVY_TRUCK: Truck,
  PLANE: Plane,
  SHIP: Anchor,
};

const EQUIPMENT_LABELS: Record<string, string> = {
  BICYCLE: '자전거',
  VAN: '소형 밴',
  TRUCK: '대형 트럭',
  HEAVY_TRUCK: '특수 중량 트럭',
  PLANE: '화물 비행기',
  SHIP: '컨테이너선',
};

export const OrderCard = ({ order, onClick, disabled, disabledReason }: OrderCardProps) => {
  const EquipmentIcon = order.requiredEquipmentType ? EQUIPMENT_ICONS[order.requiredEquipmentType] : Bike;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full bg-white p-4 text-left border border-surface-100 transition-all rounded-2xl ${
        disabled 
          ? 'opacity-60 cursor-not-allowed' 
          : 'active:bg-surface-50'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            {/* 카테고리 배지 */}
            <span className={`inline-flex items-center border px-2.5 py-0.5 text-xs font-medium rounded-full ${CATEGORY_COLORS[order.category]}`}>
              {CATEGORY_LABELS[order.category]}
            </span>

            {/* 최소 가용 장비 표시 */}
            <div className="flex items-center gap-1.5 bg-surface-50 px-2 py-1 text-[10px] font-medium text-surface-600 border border-surface-100 rounded-full">
              <EquipmentIcon className="h-3 w-3" />
              <span>{order.requiredEquipmentType ? EQUIPMENT_LABELS[order.requiredEquipmentType] : '자전거'}</span>
            </div>
          </div>

          {/* 제목 */}
          <h3 className="text-base font-medium text-surface-900">{order.title}</h3>

          {/* 대륙간 운송 가이드 (아이콘/메시지) */}
          {order.category === 'INTERNATIONAL' && (
            <div className="flex items-center gap-2 bg-primary-50/50 p-2 border border-primary-100 rounded-xl">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center bg-primary-100 rounded-full">
                <Plane className="h-3.5 w-3.5 text-primary-600" />
              </div>
              <p className="text-[10px] font-medium text-primary-700 leading-tight">
                항공 + 트럭 연계 운송이 필요한 주문입니다.
              </p>
            </div>
          )}

          {/* 정보 그리드 */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1.5 text-surface-500">
              <MapPin className="h-3.5 w-3.5" />
              <span>{order.distance.toLocaleString()}km</span>
            </div>
            <div className="flex items-center gap-1.5 text-surface-500">
              <Clock className="h-3.5 w-3.5" />
              <span>{order.limitTimeMinutes.toLocaleString()}분</span>
            </div>
            <div className="flex items-center gap-1.5 text-surface-500">
              <Package className="h-3.5 w-3.5" />
              <span>{order.weight.toLocaleString()}kg</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-primary-600">
              <DollarSign className="h-3.5 w-3.5" />
              <span>${order.baseReward.toLocaleString()}</span>
            </div>
          </div>

          {/* 비활성 사유 */}
          {disabled && disabledReason && (
            <p className="text-xs text-accent-rose">{disabledReason}</p>
          )}
        </div>

        {/* 화살표 */}
        <div className={`flex h-8 w-8 items-center justify-center border rounded-full ${disabled ? 'bg-surface-100 border-surface-200' : 'bg-primary-50 border-primary-100'}`}>
          <ChevronRight className={`h-4 w-4 ${disabled ? 'text-surface-400' : 'text-primary-500'}`} />
        </div>
      </div>
    </button>
  );
};
