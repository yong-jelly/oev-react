import { useState, useMemo, useRef, useEffect } from 'react';
import MapGL, { Marker as MapboxMarker, NavigationControl, Source, Layer } from 'react-map-gl/mapbox';
import type { MapRef, LayerProps } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, ExternalLink, Globe, Newspaper, Navigation, ChevronDown, ChevronUp, LayoutGrid, Eye, EyeOff, Flame, Droplets, Snowflake, Sword, Shield, History, Music, AlertTriangle } from 'lucide-react';
import { MAPBOX_TOKEN } from '../shared/lib/mockData';

// 카테고리별 스타일 정의
const CATEGORY_STYLES: Record<string, { color: string; icon: any }> = {
  // 재난 (Calamity)
  WILDFIRE: { color: '#ef4444', icon: Flame },
  FLOOD: { color: '#3b82f6', icon: Droplets },
  FLOOD_MUDSLIDE: { color: '#3b82f6', icon: Droplets },
  WINTER_STORM: { color: '#06b6d4', icon: Snowflake },
  // 역사 (History)
  DYNASTY_FOUNDING: { color: '#f59e0b', icon: History },
  CAPITAL_RELOCATION: { color: '#8b5cf6', icon: Navigation },
  CULTURE_WRITING_SYSTEM: { color: '#10b981', icon: Globe },
  WAR_IMJIN: { color: '#b91c1c', icon: Sword },
  COUP: { color: '#4b5563', icon: Shield },
  FOREIGN_INVASION: { color: '#b91c1c', icon: Sword },
  FOREIGN_INTERVENTION: { color: '#b91c1c', icon: Sword },
  PEASANT_REVOLT: { color: '#d97706', icon: AlertTriangle },
  ASSASSINATION_PALACE: { color: '#7c3aed', icon: AlertTriangle },
  // 기본값
  DEFAULT: { color: '#6366f1', icon: MapPin },
  BTS: { color: '#a855f7', icon: Music },
  MJ: { color: '#ec4899', icon: Music }
};

const getCategoryStyle = (loc: any, groupId: string | undefined) => {
  const code = loc.category?.code;
  if (code && CATEGORY_STYLES[code]) return CATEGORY_STYLES[code];
  
  if (groupId === 'bts-chronicle') return CATEGORY_STYLES.BTS;
  if (groupId === 'mj-chronicle') return CATEGORY_STYLES.MJ;
  
  return CATEGORY_STYLES.DEFAULT;
};

// 그룹 데이터 타입 정의
interface Group {
  id: string;
  title: string;
  description: string;
  dataPath: string;
  icon: string;
}

export const BtsChroniclePage = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [expandedNews, setExpandedNews] = useState<Record<string, boolean>>({});
  const [isListVisible, setIsListVisible] = useState(true); // 전체 뉴스 목록 표시 여부
  const mapRef = useRef<MapRef>(null);

  // 1. 그룹 목록 로드
  useEffect(() => {
    fetch('/data/group.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setGroups(data);
        if (data.length > 0) {
          setSelectedGroup(data[0]);
        }
      })
      .catch(err => console.error('그룹 로드 실패:', err));
  }, []);

  // 2. 선택된 그룹의 상세 데이터 로드
  useEffect(() => {
    if (!selectedGroup) return;

    fetch(`/${selectedGroup.dataPath}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.text().then(text => {
          if (!text) throw new Error('Empty response');
          return JSON.parse(text);
        });
      })
      .then(data => {
        setLocations(data);
        setSelectedLocation(null); // 그룹 변경 시 선택 위치 초기화
      })
      .catch(err => {
        console.error('데이터 로드 실패:', err);
        setLocations([]); // 에러 발생 시 데이터 초기화
      });
  }, [selectedGroup]);

  const processedNews = useMemo(() => {
    const allNews: any[] = [];
    locations.forEach((loc: any) => {
      // news_list 또는 wiki_list 등 목록 필드 확인
      const list = loc.news_list || loc.wiki_list || [];
      list.forEach((news: any) => {
        allNews.push({
          ...news,
          locationName: loc.location.name,
          venue: loc.location.venue,
          coordinates: loc.location.coordinates,
          parentLocation: loc
        });
      });
    });

    // 좌표(위경도)를 키로 사용하여 뉴스 그룹화
    const locationNewsMap = new Map();
    allNews.forEach(news => {
      const coordKey = `${news.coordinates[0]},${news.coordinates[1]}`;
      if (!locationNewsMap.has(coordKey)) {
        locationNewsMap.set(coordKey, {
          ...news,
          news_list: [news], // 해당 좌표의 모든 뉴스 목록
          duplicateCount: 0
        });
      } else {
        const existing = locationNewsMap.get(coordKey);
        existing.news_list.push(news);
        existing.duplicateCount = existing.news_list.length - 1;
      }
    });

    return Array.from(locationNewsMap.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [locations]);

  const handleMarkerClick = (location: any) => {
    setSelectedLocation(location);
    setIsListVisible(true); // 마커 클릭 시 목록 강제 표시
    
    // 폴리곤 데이터인 경우 중심점 또는 적절한 위치로 이동
    const center = location.location.coordinates;
    mapRef.current?.flyTo({
      center: center,
      zoom: 5,
      duration: 2000
    });
  };

  const polygonLayer: LayerProps = useMemo(() => {
    const color = locations.find(l => l.geojson)?.category?.code 
      ? CATEGORY_STYLES[locations.find(l => l.geojson).category.code]?.color || '#ef4444'
      : '#ef4444';

    return {
      id: 'polygon-layer',
      type: 'fill',
      paint: {
        'fill-color': color,
        'fill-opacity': 0.2,
        'fill-outline-color': color
      }
    };
  }, [locations]);

  const polygonOutlineLayer: LayerProps = useMemo(() => {
    const color = locations.find(l => l.geojson)?.category?.code 
      ? CATEGORY_STYLES[locations.find(l => l.geojson).category.code]?.color || '#ef4444'
      : '#ef4444';

    return {
      id: 'polygon-outline-layer',
      type: 'line',
      paint: {
        'line-color': color,
        'line-width': 2
      }
    };
  }, [locations]);

  const geojsonData = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: locations
        .filter(loc => loc.geojson)
        .map((loc, idx) => ({
          ...loc.geojson,
          id: idx,
          properties: {
            ...loc.geojson.properties,
            locationIndex: idx
          }
        }))
    };
  }, [locations]);

  const moveToLocation = (coordinates: [number, number]) => {
    mapRef.current?.flyTo({
      center: coordinates,
      zoom: 12,
      duration: 1500
    });
  };

  const toggleNews = (newsTitle: string) => {
    setExpandedNews(prev => ({
      ...prev,
      [newsTitle]: prev[newsTitle] === false ? true : false // 기본값 true(열림)로 처리하기 위해
    }));
  };

  const isExpanded = (newsTitle: string) => {
    return expandedNews[newsTitle] !== false; // undefined거나 true면 열림
  };

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* 헤더 */}
      <header className="px-4 py-4 border-b border-surface-100 flex items-center justify-between bg-white z-30 shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-primary-50 p-2 rounded-lg">
            <Globe className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-surface-900">
              {selectedGroup ? selectedGroup.title : '글로벌 연대기'}
            </h1>
            <p className="text-[10px] font-medium text-surface-400 uppercase tracking-widest">Omniscient Earth View</p>
          </div>
        </div>
        
        {/* 그룹 선택 (카테고리) */}
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-surface-400" />
          <select 
            className="text-xs font-bold text-surface-700 bg-surface-50 border-none rounded-lg px-2 py-1 focus:ring-0 cursor-pointer"
            value={selectedGroup?.id || ''}
            onChange={(e) => {
              const group = groups.find(g => g.id === e.target.value);
              if (group) setSelectedGroup(group);
            }}
          >
            {groups.map(group => (
              <option key={group.id} value={group.id}>{group.title}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* 지도 영역 (목록이 숨겨지면 전체 높이 차지) */}
        <div className={`relative shrink-0 border-b border-surface-100 transition-all duration-300 ${isListVisible ? 'h-[40%]' : 'h-full'}`}>
          <MapGL
            ref={mapRef}
            initialViewState={{
              longitude: 0,
              latitude: 20,
              zoom: 1.5
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/light-v11"
            mapboxAccessToken={MAPBOX_TOKEN}
            interactiveLayerIds={['polygon-layer']}
            onClick={(e) => {
              const feature = e.features && e.features[0];
              if (feature && feature.layer.id === 'polygon-layer') {
                const locIndex = (feature.properties as any).locationIndex;
                const loc = locations.filter(l => l.geojson)[locIndex];
                if (loc) handleMarkerClick(loc);
              }
            }}
          >
            <NavigationControl position="top-right" />
            
            {/* GeoJSON Polygon 레이어 */}
            <Source type="geojson" data={geojsonData as any}>
              <Layer {...polygonLayer} />
              <Layer {...polygonOutlineLayer} />
            </Source>
            
            {locations.map((loc: any, idx: number) => {
              const style = getCategoryStyle(loc, selectedGroup?.id);
              const Icon = style.icon;
              const isSelected = selectedLocation === loc;
              
              return (
                <MapboxMarker 
                  key={idx}
                  longitude={loc.location.coordinates[0]} 
                  latitude={loc.location.coordinates[1]}
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    handleMarkerClick(loc);
                  }}
                >
                  <div className="cursor-pointer transition-transform hover:scale-110">
                    <div 
                      className={`rounded-full p-1.5 shadow-lg border-2 transition-all ${
                        isSelected 
                          ? 'scale-125 border-white' 
                          : 'border-white'
                      }`}
                      style={{ 
                        backgroundColor: isSelected ? style.color : 'white',
                        borderColor: isSelected ? 'white' : style.color
                      }}
                    >
                      <Icon 
                        className={`h-4 w-4 transition-colors ${
                          isSelected ? 'text-white' : ''
                        }`} 
                        style={{ color: isSelected ? 'white' : style.color }}
                      />
                    </div>
                  </div>
                </MapboxMarker>
              );
            })}
          </MapGL>

          {/* 목록 보이기 버튼 (숨겨졌을 때만 노출) */}
          {!isListVisible && (
            <button 
              onClick={() => setIsListVisible(true)}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-surface-900 text-white px-6 py-3 rounded-full shadow-2xl z-40 animate-in fade-in slide-in-from-bottom-4 duration-300"
            >
              <Eye className="h-4 w-4" />
              <span className="text-sm font-bold">뉴스 목록 보기</span>
            </button>
          )}
        </div>

        {/* 하단 기사 목록 영역 */}
        <div className={`flex-1 overflow-hidden flex flex-col bg-surface-50 transition-all duration-300 ${isListVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
          <div className="px-4 py-3 bg-white border-b border-surface-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-surface-500" />
              <h2 className="text-sm font-bold text-surface-900">
                {selectedLocation ? `${selectedLocation.location.name} 뉴스` : '전체 뉴스 목록'}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {selectedLocation && (
                <button 
                  onClick={() => setSelectedLocation(null)}
                  className="text-[10px] font-bold text-primary-600 hover:text-primary-700"
                >
                  전체 보기
                </button>
              )}
              <button 
                onClick={() => setIsListVisible(false)}
                className="p-1.5 hover:bg-surface-100 rounded-lg transition-colors text-surface-400"
                title="목록 숨기기"
              >
                <EyeOff className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {(selectedLocation 
              ? processedNews.filter(news => news.locationName === selectedLocation.location.name)
              : processedNews
            ).map((news: any, idx: number) => {
              const expanded = isExpanded(news.title);
              return (
                <div 
                  key={`${news.title}-${idx}`}
                  className="bg-white rounded-xl border border-surface-100 shadow-soft-sm overflow-hidden flex flex-col"
                >
                  {/* 카드 헤더 (클릭 시 토글) */}
                  <div 
                    className="p-4 flex-1 cursor-pointer hover:bg-surface-50/50 transition-colors"
                    onClick={() => toggleNews(news.title)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-100 text-[10px] font-bold text-surface-500 uppercase">
                          {news.publisher}
                        </span>
                        {news.duplicateCount > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary-50 text-[10px] font-bold text-primary-600">
                            +{news.duplicateCount}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-surface-400">
                          {news.date}
                        </span>
                        {expanded ? <ChevronUp className="h-3.5 w-3.5 text-surface-300" /> : <ChevronDown className="h-3.5 w-3.5 text-surface-300" />}
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-surface-900 leading-snug mb-1">
                      {news.title}
                    </h3>
                    <p className="text-[10px] text-surface-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {news.locationName} · {news.venue}
                    </p>
                  </div>
                  
                  {/* 카드 액션 (열려있을 때만 노출) */}
                  {expanded && (
                    <div className="flex border-t border-surface-50 bg-surface-50/50 animate-in slide-in-from-top-2 duration-200">
                      <button 
                        onClick={() => moveToLocation(news.coordinates)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[11px] font-bold text-surface-600 hover:bg-surface-100 transition-colors border-r border-surface-50"
                      >
                        <Navigation className="h-3.5 w-3.5 text-primary-500" />
                        위치 보기
                      </button>
                      <a 
                        href={news.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[11px] font-bold text-surface-600 hover:bg-surface-100 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-accent-emerald" />
                        기사 보기
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
