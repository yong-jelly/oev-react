import { useState, useEffect, useMemo, useRef } from 'react';
import Map, { Source, Layer, Marker as MapboxMarker } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Maximize2, X } from 'lucide-react';
import { MAPBOX_TOKEN } from '../../shared/lib/mockData';
import type { Order } from '../../shared/api/types';

interface RoutePreviewMapProps {
  order: Order;
}

export const RoutePreviewMap = ({ order }: RoutePreviewMapProps) => {
  const [routeData, setRouteData] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const inlineMapRef = useRef<MapRef>(null);
  const fullMapRef = useRef<MapRef>(null);

  // 경로에 맞춰 지도 영역 조정 함수
  const fitToRoute = (mapRef: React.RefObject<MapRef | null>, padding = 40) => {
    if (!mapRef.current || !routeData) return;
    
    const coordinates = routeData.coordinates;
    if (!coordinates || coordinates.length === 0) return;

    const lats = coordinates.map((c: number[]) => c[1]);
    const lngs = coordinates.map((c: number[]) => c[0]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    mapRef.current.fitBounds(
      [[minLng, minLat], [maxLng, maxLat]],
      { padding, duration: 1000 }
    );
  };

  useEffect(() => {
    const fetchRoute = async () => {
      // 대륙간 운송은 도로 라우팅을 건너뛰고 바로 직선 경로 생성
      if (order.category === 'INTERNATIONAL') {
        const geometry = {
          type: 'LineString',
          coordinates: [
            [order.startPoint[1], order.startPoint[0]],
            [order.endPoint[1], order.endPoint[0]]
          ]
        };
        setRouteData(geometry);
        return;
      }

      try {
        const profile = order.category === 'HEAVY_DUTY' ? 'driving' : 'cycling';
        const query = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/${profile}/${order.startPoint[1]},${order.startPoint[0]};${order.endPoint[1]},${order.endPoint[0]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`,
          { method: 'GET' }
        );
        const json = await query.json();
        if (json.routes && json.routes[0]) {
          setRouteData(json.routes[0].geometry);
        }
      } catch (error) {
        console.error('미리보기 경로 로드 실패:', error);
      }
    };

    fetchRoute();
  }, [order]);

  // 데이터 로드 및 지도 로드 완료 시 인라인 지도 fit
  useEffect(() => {
    if (routeData && isMapLoaded) {
      fitToRoute(inlineMapRef);
    }
  }, [routeData, isMapLoaded]);

  // 확장 상태 변경 시 전체 화면 지도 리사이즈 및 fit
  useEffect(() => {
    if (isExpanded && routeData) {
      const timer = setTimeout(() => {
        fullMapRef.current?.resize();
        fitToRoute(fullMapRef, 80);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isExpanded, routeData]);

  const geojson = useMemo(() => ({
    type: 'Feature',
    properties: {},
    geometry: routeData
  }), [routeData]);

  return (
    <>
      {/* 1. 기본 인라인 뷰 (카드 형태) */}
      <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-surface-100 shadow-soft-sm bg-surface-50">
        <Map
          ref={inlineMapRef}
          onLoad={() => setIsMapLoaded(true)}
          initialViewState={{
            longitude: (order.startPoint[1] + order.endPoint[1]) / 2,
            latitude: (order.startPoint[0] + order.endPoint[0]) / 2,
            zoom: 13
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/light-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
          attributionControl={false}
        >
          {routeData && (
            <Source id="route-preview-inline" type="geojson" data={geojson as any}>
              <Layer
                id="route-preview-layer-inline"
                type="line"
                layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                paint={{ 'line-color': '#6366f1', 'line-width': 3, 'line-opacity': 0.6 }}
              />
            </Source>
          )}
          <MapboxMarker longitude={order.startPoint[1]} latitude={order.startPoint[0]}>
            <div className="rounded-full bg-white p-1 shadow-md border border-primary-100">
              <MapPin className="h-3 w-3 text-primary-500" />
            </div>
          </MapboxMarker>
          <MapboxMarker longitude={order.endPoint[1]} latitude={order.endPoint[0]}>
            <div className="rounded-full bg-white p-1 shadow-md border border-accent-emerald/20">
              <MapPin className="h-3 w-3 text-accent-emerald" />
            </div>
          </MapboxMarker>
        </Map>
        
        {/* 확대 버튼 */}
        <button
          onClick={() => setIsExpanded(true)}
          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 shadow-soft-lg border border-surface-100 active:scale-95"
        >
          <Maximize2 className="h-4 w-4 text-surface-600" />
        </button>
      </div>

      {/* 2. 전체 화면 모달 뷰 (모바일 UX 고려) */}
      {isExpanded && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white animate-in fade-in duration-200">
          {/* 모달 헤더 */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-surface-100 bg-white">
            <div className="flex flex-col">
              <h3 className="text-sm font-medium text-surface-900">{order.title}</h3>
              <p className="text-[10px] font-medium text-surface-400 uppercase tracking-widest">경로 미리보기 • {order.distance}km</p>
            </div>
            <button 
              onClick={() => setIsExpanded(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-100 text-surface-600 active:scale-90 transition-transform"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 전체 화면 지도 */}
          <div className="flex-1 relative">
            <Map
              ref={fullMapRef}
              initialViewState={{
                longitude: (order.startPoint[1] + order.endPoint[1]) / 2,
                latitude: (order.startPoint[0] + order.endPoint[0]) / 2,
                zoom: 13
              }}
              style={{ width: '100%', height: '100%' }}
              mapStyle="mapbox://styles/mapbox/light-v11"
              mapboxAccessToken={MAPBOX_TOKEN}
            >
              {routeData && (
                <Source id="route-preview-full" type="geojson" data={geojson as any}>
                  <Layer
                    id="route-preview-layer-full"
                    type="line"
                    layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                    paint={{ 'line-color': '#6366f1', 'line-width': 5, 'line-opacity': 0.7 }}
                  />
                </Source>
              )}
              <MapboxMarker longitude={order.startPoint[1]} latitude={order.startPoint[0]}>
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-white p-1.5 shadow-md border border-primary-100">
                    <MapPin className="h-5 w-5 text-primary-500" />
                  </div>
                  <span className="mt-1 rounded bg-white px-1.5 py-0.5 text-[10px] font-medium shadow-sm">출발지</span>
                </div>
              </MapboxMarker>
              <MapboxMarker longitude={order.endPoint[1]} latitude={order.endPoint[0]}>
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-white p-1.5 shadow-md border border-accent-emerald/20">
                    <MapPin className="h-5 w-5 text-accent-emerald" />
                  </div>
                  <span className="mt-1 rounded bg-white px-1.5 py-0.5 text-[10px] font-medium shadow-sm">도착지</span>
                </div>
              </MapboxMarker>
            </Map>

            {/* 안내 팁 */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-surface-900/90 px-4 py-2 rounded-full border border-white/10 shadow-2xl">
              <p className="text-white text-[10px] font-medium whitespace-nowrap">지도를 드래그하거나 확대하여 상세 경로를 확인하세요</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
