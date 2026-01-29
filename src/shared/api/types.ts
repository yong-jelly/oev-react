/**
 * 트럭커 게임의 핵심 데이터 모델 정의
 */

// 1. 카테고리 정의
export type OrderCategory = 'CONVENIENCE' | 'CONSTRUCTION' | 'EQUIPMENT' | 'INTERNATIONAL' | 'HEAVY_DUTY';

// 2. 아이템 타입 (장비, 서류, 보험)
export type ItemType = 'EQUIPMENT' | 'DOCUMENT' | 'INSURANCE';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  effectDescription: string;
  isComingSoon: boolean;
  // 게임 로직용 수치들 (필요시 확장)
  stats?: {
    etaModifier?: number; // -0.05 (5% 단축)
    riskModifier?: number; // -0.05 (5%p 감소)
    penaltyModifier?: number; // -0.5 (50% 감면)
  };
}

// 3. 주문 (Order/Offer)
export interface Order {
  id: string;
  title: string;
  category: OrderCategory;
  cargoName: string;
  weight: number; // kg
  volume: number; // L
  distance: number; // km
  baseReward: number; // $
  limitTimeMinutes: number; // 제한 시간
  requiredDocumentId?: string;
  requiredEquipmentType?: 'BICYCLE' | 'VAN' | 'TRUCK' | 'HEAVY_TRUCK' | 'PLANE' | 'SHIP';
  startPoint: [number, number];
  endPoint: [number, number];
}

// 4. 운행 상태 (Run/Shipment)
export type RunStatus = 'IN_TRANSIT' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface Run {
  id: string;
  orderId: string;
  slotId: string;
  status: RunStatus;
  startAt: number; // timestamp
  completedAt?: number | null; // 완료 시각
  etaSeconds: number; // 최초 계산된 예상 소요 시간
  deadlineAt: number; // 마감 시각 (startAt + limitTime)
  
  // 현재 세팅 (출발 시 확정)
  selectedItems: {
    equipmentId?: string;
    documentId?: string;
    insuranceId?: string;
  };

  // 단속 관련 결정론적 설정
  maxEnforcementCount: number;
  enforcementProbability: number;
  fineRate: number;

  // 실시간 변동 수치
  currentReward: number;
  accumulatedPenalty: number;
  accumulatedBonus: number;
  currentRisk: number; // 0 ~ 1
  currentDurability: number; // 0 ~ 100
}

// 5. 이벤트 로그 (영수증 라인 아이템)
export type EventType = 'SYSTEM' | 'POLICE' | 'ACCIDENT' | 'MAINTENANCE' | 'BONUS' | 'PENALTY';

export interface EventLog {
  id: string;
  runId: string;
  type: EventType;
  title: string;
  description: string;
  amount: number; // ± 금액
  etaChangeSeconds: number; // ± 시간
  isEstimated: boolean;
  timestamp: number;
}

// 6. 슬롯 (Slot)
export interface Slot {
  id: string;
  index: number;
  activeRunId?: string;
  reservedOrderId?: string;
  isLocked: boolean;
  driverId?: string; // 고용된 드라이버 ID
}

// 7. 드라이버 페르소나 (Driver Persona)
export interface DriverStat {
  label: string;
  value: string;
  description?: string;
}

export interface DriverPersona {
  id: string;
  name: string;
  avatarFilename: string; // 파일명만 저장 (예: '01_jack_harlow.png')
  appearance: string;
  bio: string;
  archetype: string;
  age: string;
  outfit: string;
  palette: string;
  prop: string;
  mood: string;
  shot: string;
  baseCommissionMin: number;
  baseCommissionMax: number;
  stats: DriverStat[];
  createdAt: number;
  updatedAt: number;
}

// 8. 드라이버 (Driver)
export interface Driver {
  id: string;
  personaId?: string; // NPC 드라이버일 경우 참조
  name: string;
  commission: number;
  hiredAt: number;
  totalRuns: number;
  status: 'IDLE' | 'BUSY' | 'RESTING';
}
