import { useParams, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Clock, Package, DollarSign, AlertTriangle, FileText, Shield, Wrench, Play, Info, Bike, ChevronRight, Check, Truck, Plane, Ship, Car, Loader2 } from 'lucide-react';
import { useGameStore } from '../app/store';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../shared/lib/mockData';
import { RoutePreviewMap } from '../widgets/order/RoutePreviewMap';
import { useUserProfile } from '../entities/user';
import { sendNotification } from '../shared/lib/notification';
import { createRun } from '../entities/run';
import { getOrderById } from '../entities/order';
import type { Order } from '../shared/api/types';
import { useUserEquipments, type UserEquipment } from '../entities/equipment';
import { getActiveRuns } from '../entities/run';
import { Assets } from '../shared/assets';
import { ContractDialog } from '../features/order/ui/ContractDialog';

const EQUIPMENT_ICONS: Record<string, any> = {
  BICYCLE: Bike,
  VAN: Car,
  TRUCK: Truck,
  HEAVY_TRUCK: Truck,
  PLANE: Plane,
  SHIP: Ship,
};

const EQUIPMENT_LABELS: Record<string, string> = {
  BICYCLE: '자전거',
  VAN: '밴',
  TRUCK: '트럭',
  HEAVY_TRUCK: '대형 트럭',
  PLANE: '화물기',
  SHIP: '컨테이너선',
};

export const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { slots } = useGameStore();
  const { data: profile } = useUserProfile();
  const [isContractOpen, setIsContractOpen] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeRuns, setActiveRuns] = useState<any[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<UserEquipment | null>(null);
  const [isEquipmentSheetOpen, setIsEquipmentSheetOpen] = useState(false);
  
  // 유저 보유 장비 조회
  const { data: userEquipments, isLoading: isEquipmentsLoading } = useUserEquipments(profile?.public_profile_id);
  
  // public_profile_id 사용 (auth 테이블과 독립적)
  const profileId = profile?.public_profile_id;

  // 페이지 진입 시 스크롤을 최상단으로 이동 및 데이터 로드
  useEffect(() => {
    window.scrollTo(0, 0);
    
    if (orderId) {
      Promise.all([
        getOrderById(orderId),
        profileId ? getActiveRuns(profileId) : Promise.resolve([])
      ])
        .then(([orderData, runsData]) => {
          setOrder(orderData);
          setActiveRuns(runsData);
        })
        .catch(err => console.error(err))
        .finally(() => setIsLoading(false));
    }
  }, [orderId, profileId]);

  // 유저 장비 로드 후 기본 장비 선택
  useEffect(() => {
    if (userEquipments && userEquipments.length > 0 && !selectedEquipment) {
      // is_equipped가 true인 장비 우선, 없으면 첫 번째 장비
      const equipped = userEquipments.find(e => e.isEquipped) || userEquipments[0];
      setSelectedEquipment(equipped);
    }
  }, [userEquipments, selectedEquipment]);

  const availableSlot = slots.find(s => !s.isLocked && !s.activeRunId);
  const isAlreadyRunning = activeRuns.length > 0;
  const canStartRun = availableSlot && !isAlreadyRunning;

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}시간 ${m}분`;
    return `${m}분`;
  };

  if (isLoading || isEquipmentsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-50 p-4 text-center">
        <div className="mb-4 rounded-full bg-surface-100 p-4">
          <Package className="h-8 w-8 text-surface-400" />
        </div>
        <h2 className="text-lg font-medium text-surface-900">주문을 찾을 수 없습니다</h2>
        <p className="mt-1 text-sm text-surface-500">이미 만료되었거나 존재하지 않는 주문입니다.</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-6 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-soft-md"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  };

  const handleStartDelivery = () => {
    setIsContractOpen(true);
  };

  const handleConfirmContract = async () => {
    if (!profileId || !order || !availableSlot || !selectedEquipment) return;

    try {
      // 최종 중복 체크: 최신 진행 중인 운행 목록 확인
      const latestActiveRuns = await getActiveRuns(profileId);
      if (latestActiveRuns.length > 0) {
        sendNotification(profileId, {
          title: "⚠️ 운행 시작 불가",
          message: "이미 진행 중인 운행이 있습니다. 한 번에 하나의 운행만 가능합니다.",
          type: "error"
        });
        navigate('/');
        return;
      }

      // 실제 DB에 Run 생성 (public_profile_id 사용)
      const newRun = await createRun({
        userId: profileId,
        orderId: order.id,
        slotId: availableSlot.id,
        selectedItems: {
          equipmentId: selectedEquipment.equipmentId,
          documentId: order.requiredDocumentId || undefined,
        }
      });

      sendNotification(profileId, {
        title: "🚚 운행 시작 안내",
        message: `[${order.cargoName}] 운행을 시작합니다.\n목적지까지 안전하게 운행하세요!`,
        type: "info"
      });

      setIsContractOpen(false);
      navigate(`/run/${newRun.id}`);
    } catch (error) {
      console.error('Failed to start delivery:', error);
      // 에러 발생 시 홈으로 이동 (사용자에게 부드러운 경험 제공)
      navigate('/');
    }
  };

  return (
// ...
    <div className="min-h-screen bg-surface-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-3 shadow-soft-xs">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-50"
          >
            <ArrowLeft className="h-5 w-5 text-surface-700" />
          </button>
          <h1 className="text-lg font-medium text-surface-900">주문 상세</h1>
        </div>

        {canStartRun ? (
          <button
            onClick={handleStartDelivery}
            className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-soft-sm transition-colors hover:bg-primary-700 active:bg-primary-800"
          >
            <Play className="h-4 w-4 fill-current" />
            운행 시작
          </button>
        ) : (
          <button
            disabled
            className="flex items-center gap-1.5 rounded-xl bg-surface-100 px-4 py-2 text-sm font-medium text-surface-400"
          >
            {isAlreadyRunning ? '이미 운행 중' : '슬롯 없음'}
          </button>
        )}
      </header>

      <div className="mx-auto max-w-2xl space-y-4 p-4">
        {/* 지도 미리보기 */}
        <RoutePreviewMap order={order} />

        {/* 주문 정보 카드 */}
        <div className="rounded-2xl bg-white p-5 shadow-soft-sm">
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[order.category]}`}>
            {CATEGORY_LABELS[order.category]}
          </span>
          
          <h2 className="mt-3 text-xl font-medium text-surface-900">{order.title}</h2>
          <p className="mt-1 text-sm text-surface-500">{order.cargoName}</p>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-surface-50 p-3">
              <div className="flex items-center gap-2 text-surface-500">
                <MapPin className="h-4 w-4" />
                <span className="text-xs">거리</span>
              </div>
              <p className="mt-1 text-lg font-medium text-surface-900">{(order.distance || 0).toLocaleString()}km</p>
            </div>
            <div className="rounded-xl bg-surface-50 p-3">
              <div className="flex items-center gap-2 text-surface-500">
                <Clock className="h-4 w-4" />
                <span className="text-xs">제한시간</span>
              </div>
              <p className="mt-1 text-lg font-medium text-surface-900">{formatDuration(order.limitTimeMinutes || 0)}</p>
            </div>
            <div className="rounded-xl bg-surface-50 p-3">
              <div className="flex items-center gap-2 text-surface-500">
                <Package className="h-4 w-4" />
                <span className="text-xs">무게/부피</span>
              </div>
              <p className="mt-1 text-sm font-medium text-surface-900">{(order.weight || 0).toLocaleString()}kg / {(order.volume || 0).toLocaleString()}L</p>
            </div>
            <div className="rounded-xl bg-surface-50 p-3">
              <div className="flex items-center gap-2 text-surface-500">
                {order.requiredEquipmentType ? (
                  (() => {
                    const Icon = EQUIPMENT_ICONS[order.requiredEquipmentType];
                    return Icon ? <Icon className="h-4 w-4" /> : <Bike className="h-4 w-4" />;
                  })()
                ) : <Bike className="h-4 w-4" />}
                <span className="text-xs">필요 장비</span>
              </div>
              <p className="mt-1 text-sm font-medium text-surface-900">
                {order.requiredEquipmentType ? (EQUIPMENT_LABELS[order.requiredEquipmentType] || order.requiredEquipmentType) : '자전거'}
              </p>
            </div>
            <div className="col-span-2 rounded-xl bg-primary-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary-600">
                  <DollarSign className="h-5 w-5" />
                  <span className="text-xs font-medium uppercase tracking-wider">보상</span>
                </div>
                <p className="text-2xl font-medium text-primary-600">${(order.baseReward || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 출발 전 세팅 카드 */}
        <div className="rounded-2xl bg-white p-5 shadow-soft-sm">
          <h3 className="flex items-center gap-2 text-base font-medium text-surface-900">
            <Wrench className="h-4 w-4" />
            출발 전 세팅
          </h3>
          <p className="mt-1 text-xs text-surface-500">출발하면 세팅 변경이 불가합니다.</p>

          <div className="mt-4 space-y-3">
            {/* 필수 서류 */}
            <div className="flex items-center justify-between rounded-xl border border-surface-200 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-amber/10">
                  <FileText className="h-4 w-4 text-accent-amber" />
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-900">필수 서류</p>
                  <p className="text-xs text-surface-500">배송 확인서 (POD)</p>
                </div>
              </div>
              <span className="rounded-full bg-accent-emerald/10 px-2 py-0.5 text-xs font-medium text-accent-emerald">
                보유중
              </span>
            </div>

            {/* 장비 선택 */}
            {selectedEquipment ? (
              <button 
                onClick={() => setIsEquipmentSheetOpen(true)}
                className="flex w-full items-center justify-between rounded-xl border border-surface-200 p-3 transition-colors hover:border-primary-300 hover:bg-primary-50/30"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 overflow-hidden">
                    <img 
                      src={Assets.images.basicBicycle} 
                      alt={selectedEquipment.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-surface-900">{selectedEquipment.name}</p>
                    <p className="text-xs text-primary-600 font-medium">
                      예상 소요: {Math.round((order.distance / selectedEquipment.baseSpeed) * 60)}분 (부스트 시 {Math.round((order.distance / selectedEquipment.maxSpeed) * 60)}분)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-primary-500 font-medium">
                  <span>변경</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              </button>
            ) : (
              <div className="flex items-center justify-center rounded-xl border border-dashed border-surface-300 p-3">
                <Loader2 className="h-4 w-4 animate-spin text-surface-400 mr-2" />
                <span className="text-sm text-surface-500">장비 불러오는 중...</span>
              </div>
            )}

            {/* 보험 선택 */}
            <button className="flex w-full items-center justify-between rounded-xl border border-dashed border-surface-300 p-3 transition-colors hover:border-primary-300 hover:bg-primary-50/30">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-100">
                  <Shield className="h-4 w-4 text-surface-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-surface-900">보험 선택</p>
                  <p className="text-xs text-surface-500">선택 안함 (기본)</p>
                </div>
              </div>
              <span className="text-xs text-primary-500">선택</span>
            </button>
          </div>
        </div>

        {/* 리스크 및 안내 사항 */}
        <div className="space-y-3">
          {order.category === 'INTERNATIONAL' && (
            <div className="flex items-start gap-3 rounded-2xl border border-primary-200 bg-primary-50/50 p-4">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100">
                <Info className="h-4 w-4 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-surface-900">항공 운송 안내</p>
                <p className="mt-1 text-xs text-surface-600 leading-relaxed">
                  이 주문은 대륙간 장거리 운송 건으로, **화물 비행기(Cargo Plane)** 라이선스 및 장비가 필수입니다. 
                  (현재 선박 운송은 지원되지 않습니다.)
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 rounded-2xl border border-accent-amber/30 bg-accent-amber/5 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-accent-amber" />
            <div>
              <p className="text-sm font-medium text-surface-900">리스크 안내</p>
              <p className="mt-1 text-xs text-surface-600">
                제한시간 초과 시 분당 2%씩 패널티가 적용됩니다. 
                패널티가 보상의 50%에 도달하면 운행이 자동 종료됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 여백 제거 */}
      <div className="h-8" />

      {/* 계약서 확인 다이얼로그 */}
      {order && (
        <ContractDialog
          isOpen={isContractOpen}
          onOpenChange={setIsContractOpen}
          order={order}
          selectedEquipment={selectedEquipment}
          onConfirm={handleConfirmContract}
        />
      )}

      {/* 장비 선택 바텀시트 */}
      {isEquipmentSheetOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4" 
          onClick={() => setIsEquipmentSheetOpen(false)}
        >
          <div 
            className="w-full max-w-lg rounded-t-[32px] bg-white p-6 shadow-2xl animate-slide-up max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-surface-200 shrink-0" />
            
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                  <Wrench className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-surface-900">내 장비 선택</h2>
                  <p className="text-xs text-surface-500">현재 운행에 사용할 장비를 선택하세요.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEquipmentSheetOpen(false)}
                className="text-sm font-medium text-surface-400 hover:text-surface-600"
              >
                닫기
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3 pr-1 pb-4">
              {userEquipments && userEquipments.length > 0 ? (
                userEquipments.map((eq) => {
                  const isSelected = selectedEquipment?.equipmentId === eq.equipmentId;
                  const isAllowed = eq.allowedCategories.includes(order.category);
                  const isTooHeavy = order.weight > eq.maxWeight;
                  const isTooLarge = order.volume > eq.maxVolume;
                  const isDisabled = !isAllowed || isTooHeavy || isTooLarge;
                  
                  const etaMinutes = Math.round((order.distance / eq.baseSpeed) * 60);
                  const boostEtaMinutes = Math.round((order.distance / eq.maxSpeed) * 60);

                  return (
                    <button
                      key={eq.equipmentId}
                      disabled={isDisabled}
                      onClick={() => {
                        setSelectedEquipment(eq);
                        setIsEquipmentSheetOpen(false);
                      }}
                      className={`w-full flex items-center justify-between rounded-2xl border p-4 transition-all ${
                        isSelected 
                          ? 'border-primary-500 bg-primary-50/50 ring-1 ring-primary-500' 
                          : isDisabled
                            ? 'border-surface-100 bg-surface-50 opacity-60 grayscale'
                            : 'border-surface-100 bg-white hover:border-primary-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden ${
                          isSelected ? 'ring-2 ring-primary-500' : 'bg-surface-100'
                        }`}>
                          <img 
                            src={Assets.images.basicBicycle} 
                            alt={eq.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-surface-900">{eq.name}</h3>
                            {isDisabled && (
                              <span className="text-[10px] font-medium text-accent-rose bg-accent-rose/10 px-1.5 py-0.5 rounded">
                                {!isAllowed ? '제한된 카테고리' : '용량 초과'}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-[11px] text-surface-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {etaMinutes}분 (부스트 {boostEtaMinutes}분)
                            </span>
                            <span className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {eq.maxWeight.toLocaleString()}kg
                            </span>
                          </div>
                          <div className="mt-1 text-[10px] text-surface-400">
                            기본 {eq.baseSpeed}km/h · 최대 {eq.maxSpeed}km/h
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-white">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-surface-50 flex items-center justify-center mb-4">
                    <Wrench className="h-8 w-8 text-surface-200" />
                  </div>
                  <p className="text-sm font-medium text-surface-400">보유한 장비가 없습니다</p>
                  <p className="text-xs text-surface-300 mt-1">창고에서 장비를 구매해보세요!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
