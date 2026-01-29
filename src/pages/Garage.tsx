import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Package, Wrench, Shield, FileText, ArrowLeft, Info, ChevronRight, PlayCircle, Clock, Bike, Loader2, History } from 'lucide-react';
import { COMING_SOON_ITEMS } from '../shared/lib/constants';
import { Assets } from '../shared/assets';
import { useUserProfile } from '../entities/user';
import { getActiveRuns, getRunHistory, type ActiveRun, type RunHistory } from '../entities/run';
import { EquipmentHistorySheet } from '../entities/equipment';
import type { Item } from '../shared/api/types';
import { formatKSTTime } from '../shared/lib/date';

export const GaragePage = () => {
  const navigate = useNavigate();
  const { data: profile } = useUserProfile();
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [activeRuns, setActiveRuns] = useState<ActiveRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [equipmentHistory, setEquipmentHistory] = useState<RunHistory[] | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);

  // public_profile_id 사용 (auth 테이블과 독립적)
  const profileId = profile?.public_profile_id;

  // 진행 중인 운행 조회
  const fetchActiveRuns = useCallback(async () => {
    if (!profileId) return;
    
    try {
      const runs = await getActiveRuns(profileId);
      setActiveRuns(runs);
    } catch (err) {
      console.error('Failed to fetch active runs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchActiveRuns();
  }, [fetchActiveRuns]);

  // 장비 히스토리 조회
  const fetchEquipmentHistory = useCallback(async (equipmentId: string) => {
    if (!profileId) return;
    
    setIsHistoryLoading(true);
    setSelectedEquipmentId(equipmentId);
    try {
      const history = await getRunHistory({
        userId: profileId,
        equipmentId: equipmentId === 'BICYCLE' ? 'BICYCLE' : equipmentId, // 기본 자전거 처리
      });
      setEquipmentHistory(history);
    } catch (err) {
      console.error('Failed to fetch equipment history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [profileId]);

  // 기본 자전거 사용 여부 확인 (selected_equipment_id가 null 또는 'BICYCLE'인 운행)
  const bicycleInUse = activeRuns.find(
    ar => !ar.run.selectedItems.equipmentId || ar.run.selectedItems.equipmentId === 'BICYCLE'
  );

  const categories = [
    { id: 'EQUIPMENT', label: '장비', icon: Wrench, color: 'text-accent-blue', char: Assets.images.characters.mechanic },
    { id: 'DOCUMENT', label: '서류', icon: FileText, color: 'text-accent-amber', char: Assets.images.characters.driver },
    { id: 'INSURANCE', label: '보험', icon: Shield, color: 'text-accent-rose', char: Assets.images.characters.trucker },
  ];

  return (
    <div className="min-h-screen bg-surface-50 pb-24">
      <div className="mx-auto max-w-2xl bg-white min-h-screen">
        {/* 헤더 */}
        <header className="sticky top-0 z-50 bg-white px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/')} 
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-50 hover:bg-surface-100 active:scale-90"
              >
                <ArrowLeft className="h-5 w-5 text-surface-700" />
              </button>
              <h1 className="text-xl font-medium text-surface-900 tracking-tight">창고 및 상점</h1>
            </div>
            <div className="rounded-full bg-primary-50 px-4 py-1.5 border border-primary-100">
              <span className="text-sm font-medium text-primary-600">
                ${profile?.balance.toLocaleString() ?? '0'}
              </span>
            </div>
          </div>
        </header>

        <div className="p-4 space-y-8">
          {/* 로딩 상태 */}
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          )}

          {/* 실시간 운행 상태 섹션 */}
          {!isLoading && activeRuns.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-medium text-surface-900 flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-primary-500" />
                  실시간 운행 정보
                </h2>
              </div>
              
              <div className="grid gap-3">
                {activeRuns.map(({ run, order, slotIndex }) => {
                  // 진행률 계산 (시작 시간 ~ 현재 / ETA)
                  const elapsed = (Date.now() - run.startAt) / 1000;
                  const progress = Math.min(100, Math.round((elapsed / run.etaSeconds) * 100));
                  
                  return (
                    <button
                      key={run.id}
                      onClick={() => navigate(`/run/${run.id}`)}
                      className="group relative overflow-hidden rounded-3xl bg-white p-5 border border-primary-100 hover:border-primary-300 active:scale-[0.98]"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Package className="h-16 w-16" />
                      </div>
                      
                      <div className="relative z-10 flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded-lg bg-surface-900 px-2 py-0.5 text-[10px] font-medium text-white uppercase tracking-tighter">
                              슬롯 {slotIndex + 1}
                            </span>
                            <h3 className="text-sm font-medium text-surface-900">{order.title}</h3>
                          </div>
                          <p className="text-xs text-surface-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            운행 시작: {formatKSTTime(run.startAt)}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-[10px] font-medium text-surface-400 uppercase tracking-widest">현재 보상</p>
                          <p className="text-lg font-medium text-primary-600">${run.currentReward.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-surface-100 overflow-hidden">
                          <div 
                            className="h-full bg-primary-500" 
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-surface-400">{progress}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* 캐릭터 가이드 섹션 */}
          <section className="relative overflow-hidden rounded-[32px] bg-white p-6 border border-surface-100">
            <div className="flex items-center gap-6">
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-surface-50">
                <img 
                  src={Assets.images.characters.mechanic} 
                  alt="정비사" 
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-primary-500 uppercase tracking-widest">차고 마스터</span>
                </div>
                <h2 className="text-xl font-medium text-surface-900 mt-1 tracking-tight">"장비 점검은 필수라고!"</h2>
                <p className="text-sm text-surface-500 mt-2 leading-relaxed font-medium">
                  안녕! 난 이곳의 정비를 책임지는 마스터야. 
                  자전거부터 비행기까지, 네가 벌어온 돈으로 최고의 장비를 맞춰줄게.
                </p>
              </div>
            </div>
          </section>

          {/* 카테고리 탭 */}
          <div className="grid grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="group flex flex-col items-center gap-3 rounded-3xl bg-white p-5 border border-surface-100 hover:border-primary-200 cursor-pointer active:scale-95">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-50 ${cat.color} group-hover:bg-white`}>
                  <cat.icon className="h-7 w-7" />
                </div>
                <span className="text-xs font-medium text-surface-700 tracking-tight">{cat.label}</span>
              </div>
            ))}
          </div>

          {/* 현재 보유 중인 아이템 (기본) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-medium text-surface-900 tracking-tight">보유 중인 기본 장비</h2>
            </div>
            <div 
              className={`overflow-hidden rounded-[32px] bg-white border hover:border-primary-300 cursor-pointer active:scale-[0.99] ${
                bicycleInUse 
                  ? 'border-accent-emerald/50 ring-4 ring-accent-emerald/10' 
                  : 'border-surface-100'
              }`}
              onClick={() => fetchEquipmentHistory('BICYCLE')}
            >
              {/* 사용중 배지 */}
              {bicycleInUse && (
                <div className="bg-accent-emerald/5 px-6 py-3 flex items-center justify-between border-b border-accent-emerald/10">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-accent-emerald animate-pulse" />
                    <span className="text-[10px] font-medium text-accent-emerald uppercase tracking-[0.2em]">사용 중</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/run/${bicycleInUse.run.id}`);
                    }}
                    className="flex items-center gap-1.5 rounded-full bg-accent-emerald px-3 py-1 text-[10px] font-medium text-white hover:bg-accent-emerald-600"
                  >
                    <span>{bicycleInUse.order.cargoName} 배송 중</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              <div className="relative h-56 w-full bg-surface-50 p-6 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/30" />
                {bicycleInUse && (
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full bg-accent-emerald/90 px-3 py-1.5 text-[10px] font-medium text-white">
                    <PlayCircle className="h-3.5 w-3.5" />
                    운행중
                  </div>
                )}
                <img 
                  src={Assets.images.basicBicycle} 
                  alt="기본 배달 자전거" 
                  className="relative z-0 h-full w-full object-contain transform -scale-x-100" 
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute bottom-4 right-4 rounded-2xl bg-white/90 p-3 border border-white/20">
                  <History className="h-5 w-5 text-surface-400" />
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-medium text-surface-900 tracking-tight">기본 배달 자전거</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-600 uppercase tracking-tight">티어 1</span>
                      <span className="text-[10px] font-medium text-surface-400 uppercase tracking-widest">기본 장비</span>
                    </div>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    bicycleInUse ? 'bg-accent-emerald/10' : 'bg-primary-50'
                  }`}>
                    <Bike className={`h-6 w-6 ${bicycleInUse ? 'text-accent-emerald' : 'text-primary-500'}`} />
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-surface-50 p-3 text-center border border-surface-100/50">
                    <p className="text-[9px] font-medium text-surface-400 uppercase tracking-[0.2em] mb-1">적재량</p>
                    <p className="text-base font-medium text-surface-900">10kg</p>
                  </div>
                  <div className="rounded-2xl bg-surface-50 p-3 text-center border border-surface-100/50">
                    <p className="text-[9px] font-medium text-surface-400 uppercase tracking-[0.2em] mb-1">용량</p>
                    <p className="text-base font-medium text-surface-900">20L</p>
                  </div>
                  <div className="rounded-2xl bg-surface-50 p-3 text-center border border-surface-100/50">
                    <p className="text-[9px] font-medium text-surface-400 uppercase tracking-[0.2em] mb-1">속도</p>
                    <p className="text-base font-medium text-surface-900">15km/h</p>
                  </div>
                </div>
                
                {/* 운행중일 때 상세 정보 표시 */}
                {bicycleInUse && (
                  <div className="mt-6 w-full rounded-2xl bg-accent-emerald/5 p-4 border border-accent-emerald/10">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-[9px] font-medium text-accent-emerald uppercase tracking-[0.2em] mb-1">현재 운행</p>
                        <p className="text-sm font-medium text-surface-900">{bicycleInUse.order.title}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-medium text-surface-400 uppercase tracking-[0.2em] mb-1">예상 보상</p>
                        <p className="text-base font-medium text-accent-emerald">${bicycleInUse.run.currentReward.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 준비중 아이템 리스트 */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-medium text-surface-900">신규 아이템 (준비중)</h2>
            </div>
            
            <div className="grid gap-3">
              {COMING_SOON_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="group flex items-center justify-between rounded-2xl bg-white p-4 text-left border border-surface-100 hover:border-primary-200 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-50 text-surface-400 group-hover:bg-primary-50 group-hover:text-primary-500">
                      {item.type === 'EQUIPMENT' && <Wrench className="h-5 w-5" />}
                      {item.type === 'DOCUMENT' && <FileText className="h-5 w-5" />}
                      {item.type === 'INSURANCE' && <Shield className="h-5 w-5" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-surface-900">{item.name}</h3>
                      <p className="text-xs text-surface-500 mt-0.5 line-clamp-1">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-surface-300 group-hover:text-primary-400" />
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* 장비 운영 히스토리 바텀시트 */}
      <EquipmentHistorySheet
        isOpen={!!selectedEquipmentId}
        onClose={() => setSelectedEquipmentId(null)}
        isLoading={isHistoryLoading}
        history={equipmentHistory}
      />

      {/* 아이템 상세 바텀시트 모달 (단순 구현) */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4" onClick={() => setSelectedItem(null)}>
          <div 
            className="w-full max-w-lg rounded-t-[32px] bg-white p-8 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-surface-200" />
            
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                {selectedItem.type === 'EQUIPMENT' && <Wrench className="h-8 w-8" />}
                {selectedItem.type === 'DOCUMENT' && <FileText className="h-8 w-8" />}
                {selectedItem.type === 'INSURANCE' && <Shield className="h-8 w-8" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-medium text-surface-900">{selectedItem.name}</h2>
                  <span className="rounded-full bg-surface-100 px-2 py-0.5 text-[10px] font-medium text-surface-500">준비중</span>
                </div>
                <p className="text-sm font-medium text-primary-600 mt-1">{selectedItem.effectDescription}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl bg-surface-50 p-5">
                <h4 className="text-xs font-medium text-surface-400 uppercase tracking-widest mb-2">아이템 설명</h4>
                <p className="text-sm text-surface-700 leading-relaxed">{selectedItem.description}</p>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-primary-100 bg-primary-50/30 p-4">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary-500" />
                <div>
                  <p className="text-sm font-medium text-surface-900">업데이트 예정</p>
                  <p className="mt-1 text-xs text-surface-600 leading-relaxed">
                    이 아이템은 다음 업데이트에서 실제 구매 및 장착이 가능해집니다. 
                    현재는 설명만 확인하실 수 있습니다.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedItem(null)}
                className="w-full rounded-2xl bg-surface-900 py-4 text-base font-medium text-white active:scale-[0.98]"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
