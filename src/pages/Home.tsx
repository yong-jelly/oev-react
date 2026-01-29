import { useNavigate } from 'react-router';
import { Package, ChevronRight, HelpCircle, Settings, UserCircle, Loader2, RefreshCw, PlayCircle, Bike, Truck, Car, Plane, History, Trophy, Globe } from 'lucide-react';
import { useGameStore } from '../app/store';
import { OrderCard } from '../entities/order/OrderCard';
import { useUserProfile, useUpsertProfile, type UserProfile } from '../entities/user/queries';
import { useUserStore } from '../entities/user';
import { useEffect, useState, useCallback } from 'react';
import { getOrders } from '../entities/order';
import { getUserSlots } from '../entities/slot';
import { getActiveRuns, type ActiveRun } from '../entities/run';
import type { Order } from '../shared/api/types';

// 로딩 컴포넌트
const LoadingScreen = ({ message }: { message: string }) => (
  <div className="flex min-h-screen items-center justify-center bg-surface-50">
    <div className="text-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary-500 mx-auto mb-4" />
      <p className="text-sm font-medium text-surface-500">{message}</p>
    </div>
  </div>
);

// 메인 대시보드 컴포넌트 (profile이 반드시 존재해야 함)
const Dashboard = ({ profile }: { profile: UserProfile }) => {
  const navigate = useNavigate();
  const { slots, setSlots } = useGameStore();
  const { isAuthenticated } = useUserStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeRuns, setActiveRuns] = useState<ActiveRun[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [isSlotsLoading, setIsSlotsLoading] = useState(true);
  const [isActiveRunsLoading, setIsActiveRunsLoading] = useState(true);

  // public_profile_id 사용 (auth 테이블과 독립적)
  const profileId = profile.public_profile_id;

  // 최후의 방어선: profile이 null이면 로딩 화면 표시
  if (!profile || typeof profile.balance !== 'number') {
    return <LoadingScreen message="프로필 로딩 중..." />;
  }

  // 슬롯 목록 로드 함수
  const fetchSlots = useCallback(async () => {
    if (!isAuthenticated || !profileId) return;
    
    try {
      console.log('Fetching slots for profile:', profileId);
      const userSlots = await getUserSlots(profileId);
      console.log('Fetched slots:', userSlots);
      
      // MVP 대응: 슬롯이 1개도 없거나 index 0이 없으면 강제로 기본 슬롯 생성 (클라이언트 사이드 보정)
      let finalSlots = [...userSlots];
      if (finalSlots.length === 0) {
        finalSlots = [
          { id: 'temp-0', index: 0, isLocked: false },
          { id: 'temp-1', index: 1, isLocked: true },
          { id: 'temp-2', index: 2, isLocked: true },
        ];
      }
      
      setSlots(finalSlots);
    } catch (err) {
      console.error('Failed to fetch slots:', err);
    } finally {
      setIsSlotsLoading(false);
    }
  }, [isAuthenticated, profileId, setSlots]);

  // 진행 중인 운행 목록 로드 함수
  const fetchActiveRuns = useCallback(async () => {
    if (!isAuthenticated || !profileId) return;
    
    try {
      const runs = await getActiveRuns(profileId);
      setActiveRuns(runs);
    } catch (err) {
      console.error('Failed to fetch active runs:', err);
    } finally {
      setIsActiveRunsLoading(false);
    }
  }, [isAuthenticated, profileId]);

  // 주문 목록 로드 함수
  const fetchOrders = useCallback(() => {
    if (!isAuthenticated || !profileId) return;
    
    setIsOrdersLoading(true);
    getOrders(profileId)
      .then(setOrders)
      .catch(err => console.error(err))
      .finally(() => setIsOrdersLoading(false));
  }, [isAuthenticated, profileId]);

  // 슬롯, 주문, 진행 중인 운행 목록 로드
  useEffect(() => {
    fetchSlots();
    fetchOrders();
    fetchActiveRuns();
    
    const interval = setInterval(() => {
      fetchOrders();
      fetchActiveRuns();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchSlots, fetchOrders, fetchActiveRuns]);

  const activeSlot = slots.find(s => s.index === 0 && !s.activeRunId);

  const getEquipmentIcon = (equipmentId: string | null | undefined) => {
    switch (equipmentId) {
      case 'VAN': return <Car className="h-4 w-4" />;
      case 'TRUCK': return <Truck className="h-4 w-4" />;
      case 'HEAVY_TRUCK': return <Truck className="h-4 w-4 text-primary-600" />;
      case 'PLANE': return <Plane className="h-4 w-4" />;
      default: return <Bike className="h-4 w-4" />;
    }
  };

  const getEquipmentName = (equipmentId: string | null | undefined) => {
    switch (equipmentId) {
      case 'VAN': return '소형 밴';
      case 'TRUCK': return '대형 트럭';
      case 'HEAVY_TRUCK': return '헤비 트럭';
      case 'PLANE': return '화물기';
      default: return '배달 자전거';
    }
  };

  // 데이터 로딩 중
  if (isSlotsLoading || isActiveRunsLoading) {
    return <LoadingScreen message="데이터 동기화 중..." />;
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="mx-auto">
        {/* 헤더 */}
        <header className="sticky top-0 z-10 bg-white px-4 py-4 border-b border-surface-100">
          <div className="flex flex-col gap-6 bg-white p-6 border border-surface-100 rounded-2xl">
            {/* 상단: 프로필 정보 */}
            <div className="flex items-center justify-between gap-3">
              <button 
                onClick={() => navigate('/profile')}
                className="flex items-center gap-4 flex-1 min-w-0 hover:opacity-80 transition-opacity"
              >
                <div className="relative shrink-0">
                  <div className="flex h-14 w-14 items-center justify-center bg-primary-50 text-primary-600 rounded-full overflow-hidden">
                    {profile.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt={profile.nickname} 
                        className="h-full w-full object-cover" 
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <UserCircle className="h-8 w-8" />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center bg-white border border-surface-100 rounded-full">
                    <Trophy className="h-3 w-3 text-amber-500" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-surface-900 truncate">{profile.nickname}</h2>
                    <span className="rounded-full bg-surface-100 px-2 py-0.5 text-[10px] font-bold text-surface-500 uppercase tracking-tight shrink-0">Level 1</span>
                  </div>
                  <div className="mt-1 flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <p className="text-[10px] font-medium text-surface-400 uppercase tracking-wider">평판</p>
                      <span className="text-xs font-bold text-primary-600">{profile.reputation.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </button>
              
              <div className="flex gap-2 shrink-0">
                <button 
                  onClick={() => navigate('/help')}
                  className="flex h-10 w-10 items-center justify-center bg-surface-50 text-surface-500 border border-surface-100 rounded-full"
                >
                  <HelpCircle className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => navigate('/super/admin/setting')}
                  className="flex h-10 w-10 items-center justify-center bg-surface-50 text-surface-500 border border-surface-100 rounded-full"
                >
                  <Settings className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* 중단: 잔액 정보 */}
            <div className="flex items-end justify-between border-t border-surface-50 pt-6">
              <div>
                <p className="text-[10px] font-bold text-surface-400 uppercase tracking-[0.2em] mb-1">보유 잔액</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-surface-400">$</span>
                  <span className="text-4xl font-black text-surface-900 tracking-tight">
                    {profile.balance.toLocaleString()}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => navigate('/transactions')}
                className="mb-1 flex items-center gap-1.5 bg-surface-900 px-4 py-2 text-xs font-bold text-white rounded-xl"
              >
                <History className="h-3.5 w-3.5" />
                내역
              </button>
            </div>
            
            {/* 하단: 슬롯 및 주요 액션 버튼 */}
            <div className="space-y-4 border-t border-surface-50 pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-surface-900 uppercase tracking-wider whitespace-nowrap">운행 슬롯</span>
                  <div className="flex gap-1.5">
                    {slots.map((slot) => {
                      const isMVPDisabled = slot.index > 0;
                      const isLocked = slot.isLocked || isMVPDisabled;
                      return (
                        <div 
                          key={slot.id} 
                          className={`h-2 w-6 rounded-full transition-all ${
                            isLocked 
                              ? 'bg-surface-100' 
                              : slot.activeRunId
                                ? 'bg-accent-emerald animate-pulse w-8'
                                : 'bg-primary-500'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigate('/hire')}
                    className="flex items-center gap-1.5 bg-surface-50 px-4 py-2.5 text-xs font-bold text-surface-700 border border-surface-100 rounded-xl"
                  >
                    고용
                  </button>
                  <button 
                    onClick={() => navigate('/garage')}
                    className="flex items-center gap-1.5 bg-surface-50 px-4 py-2.5 text-xs font-bold text-surface-700 border border-surface-100 rounded-xl"
                  >
                    창고
                  </button>
                  <button 
                    onClick={() => navigate('/leaderboard')}
                    className="flex items-center gap-1.5 bg-surface-50 px-4 py-2.5 text-xs font-bold text-surface-700 border border-surface-100 rounded-xl"
                  >
                    랭킹
                  </button>
                  <button 
                    onClick={() => navigate('/bts')}
                    className="flex items-center gap-1.5 bg-primary-50 px-4 py-2.5 text-xs font-bold text-primary-700 border border-primary-100 rounded-xl"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    BTS 연대기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <main className="mt-6 space-y-8 px-4">
          {/* 진행 중인 운행 */}
          {activeRuns.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-surface-900 flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-accent-emerald" />
                  진행 중인 운행
                </h2>
                <button 
                  onClick={fetchActiveRuns}
                  className="p-2 text-surface-400 hover:text-surface-600 transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 ${isActiveRunsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="space-y-3">
                {activeRuns.map((activeRun) => (
                  <button
                    key={activeRun.run.id}
                    onClick={() => navigate(`/run/${activeRun.run.id}`)}
                    className="w-full text-left overflow-hidden bg-white border border-accent-emerald/30 rounded-2xl"
                  >
                    <div className="bg-accent-emerald/5 px-4 py-2 flex items-center justify-between border-b border-accent-emerald/10">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-accent-emerald animate-pulse" />
                        <span className="text-[10px] font-medium text-accent-emerald uppercase tracking-widest">슬롯 {activeRun.slotIndex + 1} 운행 중</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-surface-500">
                        {getEquipmentIcon(activeRun.run.selectedItems.equipmentId)}
                        <span>{getEquipmentName(activeRun.run.selectedItems.equipmentId)}</span>
                      </div>
                    </div>
                    <div className="p-4 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-surface-900 leading-tight truncate">{activeRun.order.title}</h3>
                        <p className="text-[10px] font-medium text-surface-400 mt-1 truncate">
                          {activeRun.order.cargoName} · {activeRun.order.distance}km
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-medium text-surface-400 uppercase tracking-widest">현재 보상</p>
                        <p className="text-sm font-medium text-accent-emerald">${activeRun.run.currentReward.toLocaleString()}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 사용 가능한 주문 */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <h2 className="text-lg font-medium text-surface-900">사용 가능한 주문</h2>
                <span className="text-[10px] font-medium text-surface-400">
                  {isOrdersLoading ? '· 로딩 중...' : `· ${orders.length}개`}
                </span>
              </div>
              <button 
                onClick={fetchOrders}
                className="p-2 text-surface-400 hover:text-surface-600 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${isOrdersLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            <div className="space-y-3">
              {isOrdersLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-surface-300" />
                </div>
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onClick={() => navigate(`/order/${order.id}`)}
                    disabled={!activeSlot}
                    disabledReason={!activeSlot ? '사용 가능한 슬롯이 없습니다' : undefined}
                  />
                ))
              ) : (
                <div className="bg-white p-12 text-center border border-surface-100 rounded-2xl">
                  <Package className="h-12 w-12 text-surface-200 mx-auto mb-4" />
                  <p className="text-sm font-medium text-surface-400">현재 사용 가능한 주문이 없습니다</p>
                  <p className="text-xs text-surface-300 mt-1 mb-6">잠시 후 다시 확인해주세요</p>
                  <button 
                    onClick={fetchOrders}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-50 text-primary-600 border border-primary-100 text-sm font-medium rounded-xl"
                  >
                    <RefreshCw className={`h-4 w-4 ${isOrdersLoading ? 'animate-spin' : ''}`} />
                    새로고침
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* 추가 오퍼 안내 */}
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-surface-200 bg-white py-8 px-6 text-center rounded-2xl">
            <p className="text-sm text-surface-500">
              더 많은 오퍼는 평판을 올리면 해금됩니다
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

// 메인 HomePage 컴포넌트 (상태 관리 및 라우팅)
export const HomePage = () => {
  const navigate = useNavigate();
  const { data: profile, isLoading: isProfileLoading } = useUserProfile();
  const { user, isAuthenticated, isSyncing, isHydrated } = useUserStore();
  const { mutate: upsertProfile, isPending: isCreating } = useUpsertProfile();

  // 디버깅용 로그
  useEffect(() => {
    console.log('Home State:', { isHydrated, isAuthenticated, isSyncing, isProfileLoading, hasProfile: !!profile });
  }, [isHydrated, isAuthenticated, isSyncing, isProfileLoading, profile]);

  // 인증 상태 체크 및 리다이렉트
  useEffect(() => {
    if (isHydrated && !isSyncing && !isAuthenticated) {
      navigate('/onboarding');
    }
  }, [isHydrated, isAuthenticated, isSyncing, navigate]);

  const handleCreateProfile = () => {
    if (!user) return;
    const defaultNickname = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Trucker';
    upsertProfile({
      nickname: defaultNickname.slice(0, 20),
      avatar_url: user.user_metadata?.avatar_url || null,
    });
  };

  // 1. Hydration 및 세션 동기화 대기
  if (!isHydrated || isSyncing) {
    return <LoadingScreen message="시스템 준비 중..." />;
  }

  // 2. 미인증 상태
  if (!isAuthenticated) {
    return <LoadingScreen message="인증 확인 중..." />;
  }

  // 3. 프로필 로딩 중
  if (isProfileLoading) {
    return <LoadingScreen message="프로필 불러오는 중..." />;
  }

  // 4. 프로필 없음 (신규 유저)
  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-white">
        <div className="w-20 h-20 bg-primary-50 border border-primary-100 flex items-center justify-center mb-6 rounded-full">
          <UserCircle className="h-10 w-10 text-primary-600" />
        </div>
        <h2 className="text-2xl font-medium text-surface-900 mb-2 leading-tight">새로운 트럭커를 환영합니다!</h2>
        <p className="text-sm text-surface-500 mb-8 leading-relaxed">
          도로에 나갈 준비가 거의 다 되었습니다.<br/>
          계정 정보를 바탕으로 프로필을 생성할까요?
        </p>
        <button
          onClick={handleCreateProfile}
          disabled={isCreating}
          className="w-full max-w-xs py-4 bg-primary-600 text-white font-medium text-lg flex items-center justify-center gap-2 disabled:opacity-50 rounded-xl"
        >
          {isCreating ? <Loader2 className="h-5 w-5 animate-spin" /> : '프로필 생성하고 시작하기'}
          {!isCreating && <ChevronRight className="h-5 w-5" />}
        </button>
      </div>
    );
  }

  // 5. 프로필이 존재하는 경우에만 Dashboard 렌더링
  // TypeScript가 이 시점에서 profile이 null이 아님을 보장
  return <Dashboard profile={profile} />;
};
