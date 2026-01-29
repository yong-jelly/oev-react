import { useState, useEffect, useMemo, useRef } from 'react';
import Map, { Source, Layer, Marker as MapboxMarker, NavigationControl } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, MapPin, Loader2, Package, Clock, Bike, Car, Truck, Plane, RefreshCw, Navigation, Timer } from 'lucide-react';
import { MAPBOX_TOKEN } from '../shared/lib/mockData';
import { getRunById, type RunDetail } from '../entities/run';
import { formatDuration } from '../shared/lib/date';

export const PublicRunPage = () => {
  const { runId } = useParams();
  const navigate = useNavigate();
  const [runDetail, setRunDetail] = useState<RunDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [routeData, setRouteData] = useState<any>(null);
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
  const [tick, setTick] = useState(0);
  const mapRef = useRef<MapRef>(null);

  // DB에서 운행 데이터 로드
  const fetchRunDetail = async (silent = false) => {
    if (!runId) return;
    
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const detail = await getRunById(runId);
      if (detail) {
        setRunDetail(detail);
      }
    } catch (err) {
      console.error('Failed to fetch run detail:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRunDetail();
  }, [runId]);

  const handleRefresh = () => {
    fetchRunDetail(true);
  };

  // 실시간 갱신 타이머 (10초마다)
  useEffect(() => {
    if (!runDetail || runDetail.run.status !== 'IN_TRANSIT') return;

    const timer = setInterval(() => {
      fetchRunDetail(true);
      setTick(prev => prev + 1);
    }, 10000);

    return () => clearInterval(timer);
  }, [runDetail]);

  const order = runDetail?.order;
  const etaSeconds = runDetail?.run.etaSeconds || 0;
  const totalDistanceKm = order?.distance || 0;

  // 경과 시간 계산
  const elapsedSeconds = useMemo(() => {
    if (!runDetail) return 0;
    if (runDetail.run.status === 'COMPLETED' && runDetail.run.completedAt) {
      return Math.floor((runDetail.run.completedAt - runDetail.run.startAt) / 1000);
    }
    return Math.floor((Date.now() - runDetail.run.startAt) / 1000);
  }, [runDetail, tick]);

  // 진행률 계산
  const progress = useMemo(() => {
    if (runDetail?.run.status === 'COMPLETED') return 100;
    if (!etaSeconds) return 0;
    return Math.min((elapsedSeconds / etaSeconds) * 100, 100);
  }, [runDetail, elapsedSeconds, etaSeconds]);

  const distanceCovered = (totalDistanceKm * progress) / 100;
  const distanceRemaining = totalDistanceKm - distanceCovered;
  const isOvertime = elapsedSeconds > etaSeconds;
  const remainingSeconds = Math.max(etaSeconds - elapsedSeconds, 0);

  // 장비 아이콘/이름
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

  // Mapbox 라우팅 데이터 가져오기
  useEffect(() => {
    if (!order) return;

    const fetchRoute = async () => {
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

        if (mapRef.current) {
          const coordinates = data.geometry.coordinates;
          const lats = coordinates.map((c: number[]) => c[1]);
          const lngs = coordinates.map((c: number[]) => c[0]);
          mapRef.current.fitBounds(
            [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
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

  // 경로 위의 현재 위치 계산
  useEffect(() => {
    if (!routeData || !routeData.coordinates) return;
    
    const coords = routeData.coordinates;
    const pointIndex = Math.floor((coords.length - 1) * (progress / 100));
    const nextPointIndex = Math.min(pointIndex + 1, coords.length - 1);
    
    const segmentProgress = ((progress / 100) * (coords.length - 1)) - pointIndex;
    const currentLng = coords[pointIndex][0] + (coords[nextPointIndex][0] - coords[pointIndex][0]) * segmentProgress;
    const currentLat = coords[pointIndex][1] + (coords[nextPointIndex][1] - coords[pointIndex][1]) * segmentProgress;
    
    setCurrentPos([currentLat, currentLng]);
  }, [progress, routeData]);

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
        <p className="mt-1 text-sm text-surface-500">존재하지 않는 운행입니다.</p>
        <button 
          onClick={() => navigate(-1)}
          className="mt-6 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-soft-md"
        >
          돌아가기
        </button>
      </div>
    );
  }

  const isCompleted = runDetail.run.status === 'COMPLETED';
  const isCancelled = runDetail.run.status === 'CANCELLED';

  return (
    <div className="relative h-screen w-full overflow-hidden bg-surface-50">
      {/* 상단 헤더 */}
      <header className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between bg-white px-4 py-3 border-b border-surface-100 shadow-soft-sm">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate(-1)} 
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-surface-700" />
          </button>
          <div className="flex flex-col">
            <p className="text-[10px] font-medium text-surface-400 uppercase tracking-tight">
              {isCompleted ? '완료된 운행' : isCancelled ? '취소된 운행' : '운행 조회'}
            </p>
            <p className="text-sm font-medium text-surface-900 leading-tight">{order.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 새로고침 버튼 */}
          {!isCompleted && !isCancelled && (
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-50 hover:bg-surface-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 text-surface-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}

          {/* 상태 뱃지 */}
          <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            isCompleted 
              ? 'bg-emerald-100 text-emerald-700' 
              : isCancelled 
                ? 'bg-surface-100 text-surface-500'
                : 'bg-primary-100 text-primary-700'
          }`}>
            {isCompleted ? '완료' : isCancelled ? '취소됨' : '운행 중'}
          </div>
        </div>
      </header>

      {/* 대시보드 (상태 바) */}
      <div className="absolute left-0 right-0 top-[60px] z-20 bg-white px-4 py-3 border-b border-surface-100/50 shadow-soft-xs">
        <div className="mx-auto max-w-2xl flex items-center justify-between gap-4">
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-medium text-surface-400 uppercase tracking-widest">
              {isCompleted ? '소요 시간' : isCancelled ? '취소 시각' : '남은 시간'}
            </span>
            <div className="flex items-center gap-1">
              <Timer className={`h-3 w-3 ${isOvertime && !isCompleted ? 'text-accent-rose' : 'text-surface-400'}`} />
              <span className={`text-base font-medium tabular-nums ${isOvertime && !isCompleted ? 'text-accent-rose' : 'text-surface-900'}`}>
                {isCompleted 
                  ? formatDuration(elapsedSeconds, true)
                  : isCancelled 
                    ? '취소됨'
                    : isOvertime 
                      ? `지연 ${formatDuration(elapsedSeconds - etaSeconds, true)}`
                      : formatDuration(remainingSeconds, true)
                }
              </span>
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-medium text-surface-400 uppercase tracking-widest">장비</span>
            <div className="flex items-center gap-1.5 text-sm font-medium text-surface-700">
              {getEquipmentIcon(runDetail.run.selectedItems?.equipmentId)}
              <span>{getEquipmentName(runDetail.run.selectedItems?.equipmentId)}</span>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[9px] font-medium text-surface-400 uppercase tracking-widest">보상</span>
            <span className={`text-base font-medium tabular-nums ${isOvertime && !isCompleted ? 'text-accent-rose' : 'text-primary-600'}`}>
              ${runDetail.run.currentReward.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 프로그레스 바 */}
        <div className="mx-auto max-w-2xl mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Navigation className="h-3 w-3 text-primary-500" />
              <span className="text-[10px] font-bold text-primary-600 uppercase">
                {progress.toFixed(1)}% 완료
              </span>
            </div>
            <span className="text-[10px] font-medium text-surface-400">
              남은 거리: <span className="text-surface-900 font-bold">{isCompleted ? '0.00' : distanceRemaining.toFixed(2)}km</span> / {totalDistanceKm}km
            </span>
          </div>
          <div className="relative flex-1 h-2 rounded-full bg-surface-100 overflow-hidden">
            <div 
              className={`absolute left-0 top-0 h-full transition-all duration-1000 ${
                isCompleted ? 'bg-emerald-500' : 'bg-primary-500'
              }`}
              style={{ width: `${isCompleted ? 100 : progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] font-medium text-surface-400">이동: {distanceCovered.toFixed(2)}km</span>
            <span className="text-[9px] font-medium text-surface-400">목표: {totalDistanceKm}km</span>
          </div>
        </div>
      </div>

      {/* 지도 */}
      <div className="h-full w-full pt-[185px] pb-[180px] relative">
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
                  'line-color': isCompleted ? '#10b981' : '#6366f1',
                  'line-width': 4,
                  'line-opacity': 0.4
                }}
              />
            </Source>
          )}

          {/* 현재 위치 */}
          {currentPos && !isCompleted && !isCancelled && (
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

      {/* 하단 정보 카드 */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-white border-t border-surface-100 rounded-t-3xl shadow-soft-lg px-4 py-5 pb-8">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-50">
              <Package className="h-6 w-6 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-medium text-surface-900 truncate">{order.title}</h3>
              <p className="text-sm text-surface-500 mt-0.5">{order.cargoName} · {order.distance}km</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-surface-50">
            <div className="text-center">
              <p className="text-[10px] text-surface-400 uppercase tracking-widest mb-1">카테고리</p>
              <p className="text-sm font-medium text-surface-700">{order.category}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-surface-400 uppercase tracking-widest mb-1">제한 시간</p>
              <p className="text-sm font-medium text-surface-700 flex items-center justify-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {order.limitTimeMinutes}분
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-surface-400 uppercase tracking-widest mb-1">보상</p>
              <p className="text-sm font-medium text-emerald-600">${order.baseReward.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
