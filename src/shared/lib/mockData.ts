import type { Order } from '../api/types';

export const MOCK_ORDERS: Order[] = [
  {
    id: 'order-1',
    title: '편의점 도시락 배송',
    category: 'CONVENIENCE',
    cargoName: '프리미엄 도시락 세트',
    weight: 3.5,
    volume: 8,
    distance: 2.3,
    baseReward: 12,
    limitTimeMinutes: 45,
    requiredDocumentId: 'pod',
    requiredEquipmentType: 'BICYCLE',
    startPoint: [37.5665, 126.9780], // 서울시청
    endPoint: [37.5775, 126.9910],   // 종로 5가 인근 (직선 약 1.7km)
  },
  {
    id: 'order-2',
    title: '마트 생필품 배달',
    category: 'CONVENIENCE',
    cargoName: '생필품 박스',
    weight: 5.0,
    volume: 12,
    distance: 3.8,
    baseReward: 18,
    limitTimeMinutes: 60,
    requiredDocumentId: 'pod',
    requiredEquipmentType: 'BICYCLE',
    startPoint: [37.5550, 126.9700], // 서울역
    endPoint: [37.5750, 126.9850],   // 안국역 인근 (직선 약 2.9km)
  },
  {
    id: 'order-3',
    title: '공사장 소형 공구 배송',
    category: 'CONSTRUCTION',
    cargoName: '전동 드릴 세트',
    weight: 6.2,
    volume: 15,
    distance: 5.1,
    baseReward: 25,
    limitTimeMinutes: 80,
    requiredDocumentId: 'permit',
    requiredEquipmentType: 'VAN',
    startPoint: [37.5400, 126.9650], // 숙대입구역
    endPoint: [37.5650, 126.9950],   // 을지로4가역 인근 (직선 약 3.9km)
  },
  {
    id: 'order-4',
    title: '긴급 설비 부품 배송',
    category: 'EQUIPMENT',
    cargoName: '산업용 밸브 부품',
    weight: 4.8,
    volume: 6,
    distance: 7.2,
    baseReward: 35,
    limitTimeMinutes: 90,
    requiredDocumentId: 'receipt',
    requiredEquipmentType: 'VAN',
    startPoint: [37.5300, 126.9500], // 마포역
    endPoint: [37.5750, 126.9950],   // 동대문 인근 (직선 약 5.6km)
  },
  {
    id: 'order-5',
    title: '대륙간 항공 운송: 서울 - LA',
    category: 'INTERNATIONAL',
    cargoName: '첨단 반도체 부품',
    weight: 1200,
    volume: 500,
    distance: 9500,
    baseReward: 15000,
    limitTimeMinutes: 2880, // 2 days
    requiredDocumentId: 'customs_clearance',
    requiredEquipmentType: 'PLANE',
    startPoint: [37.4602, 126.4407], // Incheon Airport
    endPoint: [33.9416, -118.4085],  // LAX Airport
  },
  {
    id: 'order-6',
    title: '대륙 횡단 중량 운송: LA - 뉴욕',
    category: 'HEAVY_DUTY',
    cargoName: '산업용 발전기',
    weight: 15000,
    volume: 4500,
    distance: 4500,
    baseReward: 8500,
    limitTimeMinutes: 4320, // 3 days
    requiredDocumentId: 'oversize_permit',
    requiredEquipmentType: 'TRUCK',
    startPoint: [34.0522, -118.2437], // Los Angeles
    endPoint: [40.7128, -74.0060],   // New York
  },
  {
    id: 'order-7',
    title: '전략 물자 운송: 로켓 엔진',
    category: 'HEAVY_DUTY',
    cargoName: '스페이스X 멀린 엔진 복제품',
    weight: 8000,
    volume: 2500,
    distance: 2200,
    baseReward: 12000,
    limitTimeMinutes: 1440, // 1 day
    requiredDocumentId: 'federal_escort',
    requiredEquipmentType: 'HEAVY_TRUCK',
    startPoint: [28.5729, -80.6490], // Kennedy Space Center
    endPoint: [33.9207, -118.3278],  // Hawthorne, CA
  },
];

export const MAPBOX_TOKEN = 'pk.eyJ1Ijoia3dvbjIwMjYiLCJhIjoiY21rcTdxMjhsMHBmMjNsb2Z2N3NsdjRzOCJ9.ocd7LnJbKYOrMLnW0ygljg';

export const CATEGORY_LABELS: Record<string, string> = {
  CONVENIENCE: '편의점/마트',
  CONSTRUCTION: '공사장',
  EQUIPMENT: '건축자재/설비',
  INTERNATIONAL: '대륙간 운송',
  HEAVY_DUTY: '중량물/특수운송',
};

export const CATEGORY_COLORS: Record<string, string> = {
  CONVENIENCE: 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20',
  CONSTRUCTION: 'bg-accent-amber/10 text-accent-amber border-accent-amber/20',
  EQUIPMENT: 'bg-accent-blue/10 text-accent-blue border-accent-blue/20',
  INTERNATIONAL: 'bg-primary-600/10 text-primary-600 border-primary-600/20',
  HEAVY_DUTY: 'bg-accent-rose/10 text-accent-rose border-accent-rose/20',
};
