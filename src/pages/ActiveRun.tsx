import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Map, { Source, Layer, Marker as MapboxMarker, NavigationControl } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useParams, useNavigate } from 'react-router';
import { Map as MapIcon, List, ArrowLeft, MapPin, TrendingUp, Zap, Loader2 } from 'lucide-react';
import { MAPBOX_TOKEN } from '../shared/lib/mockData';
import { RunSheet } from '../widgets/run/RunSheet';
import { useGameStore } from '../app/store';
import { getRunById, completeRun, type RunDetail } from '../entities/run';
import { formatDuration, formatKSTTime } from '../shared/lib/date';

type ViewMode = 'map' | 'info';

export const ActiveRunPage = () => {
  const { runId } = useParams();
  const navigate = useNavigate();
  const { addEventLog } = useGameStore();
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [runDetail, setRunDetail] = useState<RunDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [routeData, setRouteData] = useState<any>(null);
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
  const [isSpeeding, setIsOverSpeed] = useState(false);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0);
  const [fuel, setFuel] = useState(100);
  const [tick, setTick] = useState(0); // 실시간 갱신용
  const mapRef = useRef<MapRef>(null);

  // DB에서 운행 데이터 로드
  const fetchRunDetail = useCallback(async () => {
    if (!runId) return;
    
    try {
      const detail = await getRunById(runId);
      if (detail) {
        if (detail.run.status !== 'IN_TRANSIT') {
          // 이미 완료된 경우 홈으로
          navigate('/');
          return;
        }
        setRunDetail(detail);
        setFuel(detail.run.currentDurability); // currentDurability를 연료로 사용
      }
    } catch (err) {
      console.error('Failed to fetch run detail:', err);
    } finally {
      setIsLoading(false);
    }
  }, [runId, navigate]);

  useEffect(() => {
    fetchRunDetail();
  }, [fetchRunDetail]);

  // 경과 시간 계산 (start_at 기준)
  const elapsedSeconds = useMemo(() => {
    if (!runDetail) return 0;
    return Math.floor((Date.now() - runDetail.run.startAt) / 1000);
  }, [runDetail, tick]);

  // 주문 및 ETA 정보
  const order = runDetail?.order;
  const etaSeconds = runDetail?.run.etaSeconds || 0;
  
  // 실제 도로 거리
  const totalDistanceKm = order?.distance || 0;
  
  // 장비별 기본 속도 (km/h)
  const EQUIPMENT_SPEEDS: Record<string, number> = {
    'BICYCLE': 15,      // 자전거
    'VAN': 60,          // 밴
    'TRUCK': 80,        // 트럭
    'HEAVY_TRUCK': 70,  // 헤비트럭
    'PLANE': 500,       // 비행기
  };
  
  // 현재 장비 유형 (없으면 기본 자전거)
  const equipmentType = runDetail?.run.selectedItems?.equipmentId || order?.requiredEquipmentType || 'BICYCLE';
  
  // 장비 기반 속도 설정
  const equipmentBaseSpeed = EQUIPMENT_SPEEDS[equipmentType] || 15;
  const fuelPenaltyMultiplier = fuel <= 0 ? 0.2 : 1.0; // 연료 고갈 시 80% 감속
  const baseSpeedKmh = equipmentBaseSpeed * fuelPenaltyMultiplier;
  const maxSpeedKmh = baseSpeedKmh * 1.5; // 가속 시 최대 1.5배 (자전거: 22.5km/h)
  const acceleration = 2.0; // 초당 가속도 (빠르게 목표 속도 도달)

  // 경과 시간 기반 이동 거리 계산
  const distanceCovered = useMemo(() => {
    if (!totalDistanceKm || !etaSeconds) return 0;
    // 기본 속도로 이동한 거리 (과속 상태 고려하지 않은 단순 계산)
    const baseDistance = (elapsedSeconds / etaSeconds) * totalDistanceKm;
    return Math.min(baseDistance, totalDistanceKm);
  }, [elapsedSeconds, etaSeconds, totalDistanceKm]);

  // 현재 진행률 계산
  const progress = totalDistanceKm > 0 ? Math.min((distanceCovered / totalDistanceKm) * 100, 100) : 0;
  
  // 거리 정보 계산
  const distanceRemaining = (totalDistanceKm - distanceCovered).toFixed(2);
  
  // 현재 속도 기준 도착 예상 시간 (ETA)
  const estimatedRemainingSeconds = currentSpeedKmh > 0 
    ? (parseFloat(distanceRemaining) / currentSpeedKmh) * 3600 
    : etaSeconds - elapsedSeconds;

  // 운행 데이터 로드 시 속도 초기화
  useEffect(() => {
    if (runDetail && currentSpeedKmh === 0) {
      setCurrentSpeedKmh(baseSpeedKmh);
    }
  }, [runDetail, baseSpeedKmh, currentSpeedKmh]);

  const isOvertime = elapsedSeconds > etaSeconds;

  const handleComplete = useCallback(async () => {
    if (!order || !runId || isCompleting) return;
    
    setIsCompleting(true);
    const penaltyAmount = isOvertime 
      ? Math.floor(Math.max(order.baseReward * 0.5, Math.floor((elapsedSeconds - etaSeconds) / 60) * 0.2))
      : 0;
    const finalReward = order.baseReward - penaltyAmount;
    
    try {
      // DB에 완료 처리 및 보상 지급
      const result = await completeRun({
        runId,
        finalReward,
        penaltyAmount,
        elapsedSeconds
      });

      // 이미 완료된 경우 (cron에 의해 처리됨) 홈으로 부드럽게 이동
      if (result.alreadyCompleted) {
        navigate('/', { replace: true });
        return;
      }

      navigate('/settlement', { 
        state: { 
          order, 
          elapsedSeconds, 
          finalReward, 
          penalty: penaltyAmount 
        } 
      });
    } catch (err) {
      console.error('Failed to complete run:', err);
      // 에러 발생 시에도 홈으로 부드럽게 이동 (반복 에러 방지)
      navigate('/', { replace: true });
    } finally {
      setIsCompleting(false);
    }
  }, [order, runId, isCompleting, isOvertime, elapsedSeconds, etaSeconds, navigate]);

  // Mapbox 라우팅 데이터 가져오기 및 초기 위치 설정
  useEffect(() => {
    if (!order) return;

    const fetchRoute = async () => {
      // 대륙간 운송은 도로 라우팅을 건너뛰고 바로 직선 경로 생성
      if (order.category === 'INTERNATIONAL') {
        const fallbackGeometry = {
          type: 'LineString',
          coordinates: [
            [order.startPoint[1], order.startPoint[0]],
            [order.endPoint[1], order.endPoint[0]]
          ]
        };
        setRouteData(fallbackGeometry);
        setCurrentPos(order.startPoint);
        
        if (mapRef.current) {
          mapRef.current.fitBounds(
            [[order.startPoint[1], order.startPoint[0]], [order.endPoint[1], order.endPoint[0]]],
            { padding: 100, duration: 1000 }
          );
        }
        return;
      }

      try {
        const profile = order.category === 'HEAVY_DUTY' ? 'driving' : 'cycling';
        const query = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/${profile}/${order.startPoint[1]},${order.startPoint[0]};${order.endPoint[1]},${order.endPoint[0]}?steps=true&geometries=geojson&access_token=${MAPBOX_TOKEN}`,
          { method: 'GET' }
        );
        const json = await query.json();
        const data = json.routes[0];
        setRouteData(data.geometry);
        setCurrentPos(order.startPoint);

        // 경로에 맞춰 지도 줌 조정
        if (mapRef.current) {
          const coordinates = data.geometry.coordinates;
          const lats = coordinates.map((c: number[]) => c[1]);
          const lngs = coordinates.map((c: number[]) => c[0]);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);

          mapRef.current.fitBounds(
            [[minLng, minLat], [maxLng, maxLat]],
            { padding: 100, duration: 1000 }
          );
        }
      } catch (error) {
        console.error('라우팅 실패, 직선으로 대체:', error);
        setRouteData({
          type: 'LineString',
          coordinates: [[order.startPoint[1], order.startPoint[0]], [order.endPoint[1], order.endPoint[0]]]
        });
      }
    };

    fetchRoute();
  }, [order]);

  // 실시간 갱신 타이머 (1초마다 tick 증가로 경과 시간 재계산)
  useEffect(() => {
    if (!runDetail || runDetail.run.status !== 'IN_TRANSIT') return;

    const timer = setInterval(() => {
      // 이미 도착한 경우 타이머 중지 및 자동 완료 처리
      if (progress >= 100) {
        clearInterval(timer);
        handleComplete();
        return;
      }

      setTick(prev => prev + 1);
      
      // 연료 소모 로직
      setFuel(prev => {
        if (progress >= 100) return prev;
        const consumption = isSpeeding ? 0.15 : 0.05; // 과속 시 3배 소모
        return Math.max(0, prev - consumption);
      });

      // 가속/감속 로직
      setCurrentSpeedKmh(prev => {
        const targetSpeed = isSpeeding ? maxSpeedKmh : baseSpeedKmh;
        if (prev < targetSpeed) return Math.min(prev + acceleration, targetSpeed);
        if (prev > targetSpeed) return Math.max(prev - acceleration, targetSpeed);
        return prev;
      });

      // NOTE: 클라이언트 사이드 단속 로직 제거됨.
      // 이제 모든 단속 및 정산은 서버(Cron)에서 백엔드 로직으로 처리됩니다.
      // 사용자는 운행 중 발생하는 이벤트 로그를 통해 결과를 확인하게 됩니다.
    }, 1000);
    return () => clearInterval(timer);
  }, [runDetail, isSpeeding, baseSpeedKmh, maxSpeedKmh, elapsedSeconds, progress, runId, addEventLog, handleComplete]);

  // 경로 위의 현재 위치 계산 (progress에 따라)
  useEffect(() => {
    if (!routeData || !routeData.coordinates) return;
    
    const coords = routeData.coordinates;
    const pointIndex = Math.floor((coords.length - 1) * (progress / 100));
    const nextPointIndex = Math.min(pointIndex + 1, coords.length - 1);
    
    // 두 점 사이의 보간 (Interpolation)
    const segmentProgress = ((progress / 100) * (coords.length - 1)) - pointIndex;
    const currentLng = coords[pointIndex][0] + (coords[nextPointIndex][0] - coords[pointIndex][0]) * segmentProgress;
    const currentLat = coords[pointIndex][1] + (coords[nextPointIndex][1] - coords[pointIndex][1]) * segmentProgress;
    
    setCurrentPos([currentLat, currentLng]);
  }, [progress, routeData]);

  const remainingSeconds = Math.max(etaSeconds - elapsedSeconds, 0);

  // 도착 예정 시각 (현재 시각 + 남은 예상 초)
  const arrivalTime = new Date(Date.now() + estimatedRemainingSeconds * 1000);

  const geojson = useMemo(() => ({
    type: 'Feature',
    properties: {},
    geometry: routeData
  }), [routeData]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-sm font-medium text-surface-500">운행 정보 로딩 중...</p>
        </div>
      </div>
    );
  }

  // 운행 정보 없음
  if (!runDetail || !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-50 p-4 text-center">
        <div className="mb-4 rounded-full bg-surface-100 p-4">
          <MapPin className="h-8 w-8 text-surface-400" />
        </div>
        <h2 className="text-lg font-medium text-surface-900">운행 정보를 찾을 수 없습니다</h2>
        <p className="mt-1 text-sm text-surface-500">이미 완료되었거나 존재하지 않는 운행입니다.</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-6 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-soft-md"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-surface-50">
      <div className="mx-auto max-w-2xl bg-white h-full relative shadow-2xl">
        {/* 상단 헤더 */}
        <header className="absolute left-0 right-0 top-0 z-30 bg-white px-4 py-4 border-b border-surface-100/50 shadow-soft-xl">
          <div className="mx-auto max-w-2xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/')} 
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-soft-sm border border-surface-100 hover:bg-surface-50 active:scale-90"
              >
                <ArrowLeft className="h-5 w-5 text-surface-700" />
              </button>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
                  <p className="text-[10px] font-bold text-primary-600 uppercase tracking-[0.2em]">운행 중</p>
                </div>
                <h1 className="text-base font-bold text-surface-900 leading-tight tracking-tight mt-0.5">{order.title}</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* 뷰 모드 토글 */}
              <div className="flex rounded-xl bg-surface-100/50 p-1 border border-surface-200/50">
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    viewMode === 'map' ? 'bg-white text-primary-600 shadow-soft-md' : 'text-surface-400'
                  }`}
                >
                  <MapIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('info')}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    viewMode === 'info' ? 'bg-white text-primary-600 shadow-soft-md' : 'text-surface-400'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
              <button 
                onClick={handleComplete}
                disabled={isCompleting}
                className="flex h-11 items-center justify-center rounded-2xl bg-surface-900 px-6 text-sm font-bold text-white shadow-soft-lg hover:bg-black active:scale-95 disabled:opacity-50"
              >
                {isCompleting ? <Loader2 className="h-5 w-5 animate-spin" /> : '도착'}
              </button>
            </div>
          </div>
        </header>

        {/* 대시보드 (상태 바) */}
        <div className="absolute left-0 right-0 top-[84px] z-20 bg-white px-4 py-4 border-b border-surface-100/30 shadow-soft-sm">
          <div className="mx-auto max-w-2xl">
            <div className="flex items-center justify-between gap-6">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-surface-400 uppercase tracking-[0.2em] mb-1">남은 시간</span>
                <span className={`text-xl font-black tabular-nums tracking-tight ${isOvertime ? 'text-accent-rose' : 'text-surface-900'}`}>
                  {isOvertime ? '지연 ' : ''}{formatDuration(Math.abs(isOvertime ? elapsedSeconds - etaSeconds : remainingSeconds), true)}
                </span>
              </div>
              
              <div className="flex flex-col items-center flex-1">
                <span className="text-[9px] font-bold text-surface-400 uppercase tracking-[0.2em] mb-1">현재 속도</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-primary-600 leading-none tabular-nums tracking-tighter">{currentSpeedKmh.toFixed(1)}</span>
                  <span className="text-[10px] font-bold text-surface-400 uppercase">km/h</span>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-[9px] font-bold text-surface-400 uppercase tracking-[0.2em] mb-1">예상 보상</span>
                <span className={`text-xl font-black tabular-nums tracking-tight ${isOvertime ? 'text-accent-rose' : 'text-primary-600'}`}>
                  ${isOvertime ? Math.max(order.baseReward * 0.5, order.baseReward - Math.floor((elapsedSeconds - etaSeconds) / 60) * 0.2).toFixed(2) : order.baseReward.toFixed(2)}
                </span>
              </div>
            </div>

            {/* 하단 프로그레스 & 거리 정보 */}
            <div className="mt-5 flex items-center gap-4">
              <span className="text-[10px] font-bold text-primary-600 tabular-nums">{distanceCovered.toFixed(2)}km</span>
              <div className="relative flex-1 h-2 rounded-full bg-surface-200/30 overflow-hidden shadow-inner">
                <div 
                  className={`absolute left-0 top-0 h-full transition-all duration-1000 rounded-full ${isSpeeding ? 'bg-accent-rose shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-primary-500'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-surface-400 tabular-nums">-{distanceRemaining}km</span>
            </div>
            
            {/* 도착 예정 시각 & 연료 정보 */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-surface-400 uppercase tracking-[0.2em]">연료</span>
                  <div className="w-20 h-1.5 bg-surface-100 rounded-full overflow-hidden border border-surface-200/50">
                    <div 
                      className={`h-full transition-all duration-500 ${fuel > 20 ? 'bg-accent-amber' : 'bg-accent-rose animate-pulse'}`}
                      style={{ width: `${fuel}%` }}
                    />
                  </div>
                </div>
                <span className={`text-[10px] font-bold tabular-nums ${fuel > 20 ? 'text-surface-600' : 'text-accent-rose'}`}>
                  {Math.ceil(fuel)}%
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 border border-primary-100">
                <span className="text-[9px] font-bold text-primary-400 uppercase tracking-[0.1em]">도착 예정</span>
                <span className="text-[10px] font-bold text-primary-700">{formatKSTTime(arrivalTime)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 과속 및 연료 버튼 (우측 하단) */}
        <div className="absolute right-4 bottom-20 z-40 flex flex-col items-center gap-3">
          <div className={`text-[10px] font-medium px-2 py-0.5 rounded bg-white shadow-soft-sm border border-surface-100 transition-opacity duration-300 ${isSpeeding ? 'opacity-100 text-accent-rose' : 'opacity-0'}`}>
            과속 운행 중
          </div>
          
          {/* 과속 버튼 */}
          <button
            onClick={() => setIsOverSpeed(!isSpeeding)}
            className={`flex h-16 w-16 items-center justify-center rounded-full shadow-soft-2xl active:scale-90 border-4 ${
              isSpeeding 
                ? 'bg-accent-rose text-white animate-pulse border-white shadow-accent-rose/40 scale-110' 
                : 'bg-white text-surface-400 hover:text-accent-rose border-surface-50'
            }`}
          >
            <div className="flex flex-col items-center">
              <TrendingUp className={`h-7 w-7 ${isSpeeding ? 'text-white' : ''}`} />
              <span className="text-[10px] font-medium uppercase tracking-tighter mt-0.5">가속</span>
            </div>
          </button>

          {/* 연료 보충 버튼 */}
          <button
            onClick={() => setFuel(prev => Math.min(100, prev + 15))}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-soft-lg border border-surface-100 text-accent-amber hover:bg-accent-amber hover:text-white active:scale-95 group"
          >
            <div className="flex flex-col items-center">
              <Zap className="h-6 w-6 group-hover:animate-bounce" />
              <span className="text-[8px] font-medium uppercase mt-0.5">보충</span>
            </div>
          </button>
        </div>

        {/* 메인 콘텐츠 영역 */}
        {viewMode === 'map' ? (
          <div className="h-full w-full pt-[220px] pb-72 relative">
            <Map
              ref={mapRef}
              initialViewState={{
                longitude: (order.startPoint[1] + order.endPoint[1]) / 2,
                latitude: (order.startPoint[0] + order.endPoint[0]) / 2,
                zoom: 15
              }}
              style={{ width: '100%', height: '100%' }}
              mapStyle="mapbox://styles/mapbox/light-v11"
              mapboxAccessToken={MAPBOX_TOKEN}
            >
              <div className="absolute right-4 bottom-4 z-10">
                <NavigationControl showCompass={false} />
              </div>
              
              {routeData && (
                <Source id="route" type="geojson" data={geojson as any}>
                  <Layer
                    id="route"
                    type="line"
                    layout={{
                      'line-join': 'round',
                      'line-cap': 'round'
                    }}
                    paint={{
                      'line-color': '#6366f1',
                      'line-width': 4,
                      'line-opacity': 0.3 // 라우트 라인 연하게
                    }}
                  />
                </Source>
              )}

              {/* 현재 위치 (반짝이는 점) */}
              {currentPos && (
                <MapboxMarker longitude={currentPos[1]} latitude={currentPos[0]}>
                  <div className="relative flex h-6 w-6 items-center justify-center">
                    <div className="absolute h-full w-full animate-ping rounded-full bg-primary-400 opacity-75"></div>
                    <div className="relative h-3 w-3 rounded-full border-2 border-white bg-primary-600 shadow-sm"></div>
                  </div>
                </MapboxMarker>
              )}

              <MapboxMarker longitude={order.startPoint[1]} latitude={order.startPoint[0]}>
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-white p-1 shadow-md">
                    <MapPin className="h-5 w-5 text-primary-500" />
                  </div>
                  <span className="mt-1 rounded bg-white px-1 text-[10px] font-medium shadow-sm">출발</span>
                </div>
              </MapboxMarker>

              <MapboxMarker longitude={order.endPoint[1]} latitude={order.endPoint[0]}>
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-white p-1 shadow-md">
                    <MapPin className="h-5 w-5 text-accent-emerald" />
                  </div>
                  <span className="mt-1 rounded bg-white px-1 text-[10px] font-medium shadow-sm">도착</span>
                </div>
              </MapboxMarker>
            </Map>
          </div>
        ) : (
          <div 
            className="h-full overflow-y-auto pt-[220px] pb-72 px-4"
            style={{ 
              willChange: 'scroll-position',
              WebkitOverflowScrolling: 'touch',
              transform: 'translateZ(0)',
            }}
          >
            <div className="mx-auto max-w-2xl space-y-4">
              {/* 경로 요약 */}
              <div className="rounded-2xl bg-white p-5 shadow-soft-sm">
                <h3 className="text-sm font-medium text-surface-900">경로 정보</h3>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-600">A</div>
                  <div className="h-px flex-1 bg-surface-200" />
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-emerald/20 text-xs font-medium text-accent-emerald">B</div>
                </div>
                <div className="mt-2 flex justify-between text-xs text-surface-500">
                  <span>출발지</span>
                  <span>{order.distance}km</span>
                  <span>도착지</span>
                </div>
              </div>

              {/* 운행 세팅 */}
              <div className="rounded-2xl bg-white p-5 shadow-soft-sm">
                <h3 className="text-sm font-medium text-surface-900">적용된 세팅</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-surface-500">서류</span>
                    <span className="font-medium text-surface-900">배송 확인서 (POD)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-500">장비</span>
                    <span className="font-medium text-surface-400">없음</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-500">보험</span>
                    <span className="font-medium text-surface-400">없음</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 하단 시트 */}
        <RunSheet 
          order={order} 
          elapsedSeconds={elapsedSeconds}
          etaSeconds={etaSeconds}
          runId={runId || 'temp'}
        />
      </div>
    </div>
  );
};
