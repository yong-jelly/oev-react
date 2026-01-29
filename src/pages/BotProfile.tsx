import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  ArrowLeft, Bot, History, PlayCircle, 
  Loader2, Bike, Truck, Car, Plane, MapPin, Clock
} from 'lucide-react';
import { getLeaderboard, type LeaderboardEntry } from '../entities/leaderboard/api';
import { getActiveRuns, type ActiveRun, getRunHistory, type RunHistory } from '../entities/run';
import { getTimeDiff, formatDate } from '../shared/lib/date';

export const BotProfilePage = () => {
  const { botId } = useParams<{ botId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [botInfo, setBotInfo] = useState<LeaderboardEntry | null>(null);
  const [activeRuns, setActiveRuns] = useState<ActiveRun[]>([]);
  const [history, setHistory] = useState<RunHistory[]>([]);

  useEffect(() => {
    const fetchBotData = async () => {
      if (!botId) return;
      setIsLoading(true);
      try {
        // 1. 봇 기본 정보 (리더보드 데이터에서 추출)
        const leaderboard = await getLeaderboard('all');
        const bot = leaderboard.find(b => b.userId === botId);
        if (bot) {
          setBotInfo(bot);
          
          // 2. 봇의 현재 운행 정보 및 히스토리 (병렬 로드)
          const [activeData, historyData] = await Promise.all([
            getActiveRuns(botId),
            getRunHistory({ userId: botId, limit: 10 })
          ]);
          
          setActiveRuns(activeData);
          setHistory(historyData);
        }
      } catch (error) {
        console.error('봇 정보를 불러오는데 실패했습니다:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBotData();
  }, [botId]);

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

  // 휴식 시간 표시 텍스트 생성
  const getRestTimeDisplay = (nextAvailableAt: number) => {
    const { totalHours, minutes, seconds } = getTimeDiff(nextAvailableAt);
    
    if (totalHours >= 1) return `${totalHours}시간 후 복귀`;
    if (minutes > 0) return `${minutes}분 ${seconds}초 후 복귀`;
    return `${seconds}초 후 복귀`;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!botInfo) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-50 p-6 text-center">
        <p className="text-surface-500 mb-4">봇 정보를 찾을 수 없습니다.</p>
        <button onClick={() => navigate(-1)} className="text-primary-600 font-medium">돌아가기</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 pb-12">
      <header className="sticky top-0 z-10 bg-white border-b border-surface-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-surface-50 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5 text-surface-700" />
          </button>
          <h1 className="text-lg font-medium text-surface-900">봇 프로필</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* 프로필 헤더 */}
        <section className="bg-white rounded-2xl p-6 border border-surface-100 shadow-soft-sm flex flex-col items-center text-center">
          <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center mb-4 overflow-hidden">
            {botInfo.avatarUrl ? (
              <img 
                src={botInfo.avatarUrl} 
                alt={botInfo.nickname} 
                className="h-full w-full object-cover" 
                loading="lazy"
                decoding="async"
              />
            ) : (
              <Bot className="h-10 w-10 text-amber-600" />
            )}
          </div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-medium text-surface-900">{botInfo.nickname}</h2>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">BOT</span>
          </div>
          
          {/* 휴식 상태 표시 */}
          {botInfo.botStatus === 'RESTING' && botInfo.botNextAvailableAt && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-100 text-surface-600 text-xs font-medium mb-4 animate-pulse">
              <Clock className="h-3.5 w-3.5" />
              {getRestTimeDisplay(botInfo.botNextAvailableAt)}
            </div>
          )}
          
          <p className="text-sm text-surface-500 mb-6">시스템 자동 운행 드라이버</p>
          
          <div className="grid grid-cols-3 w-full gap-4 border-t border-surface-50 pt-6">
            <div>
              <p className="text-[10px] text-surface-400 uppercase tracking-widest mb-1">평판</p>
              <p className="text-lg font-medium text-surface-900">{botInfo.reputation.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-surface-400 uppercase tracking-widest mb-1">완료</p>
              <p className="text-lg font-medium text-surface-900">{botInfo.totalRuns}회</p>
            </div>
            <div>
              <p className="text-[10px] text-surface-400 uppercase tracking-widest mb-1">총 수익</p>
              <p className="text-lg font-medium text-emerald-600">${botInfo.totalEarnings.toLocaleString()}</p>
            </div>
          </div>
        </section>

        {/* 현재 운행 정보 */}
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-surface-900 flex items-center gap-2 px-1">
            <PlayCircle className="h-4 w-4 text-emerald-500" />
            현재 운행 정보
          </h3>
          {activeRuns.length > 0 ? (
            <div className="space-y-3">
              {activeRuns.map((active) => (
                <div key={active.run.id} className="bg-white rounded-2xl border border-emerald-100 shadow-soft-sm overflow-hidden">
                  <div className="bg-emerald-50/50 px-4 py-2 border-b border-emerald-50 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-emerald-600 uppercase tracking-widest">운행 중</span>
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-surface-500">
                      {getEquipmentIcon(active.run.selectedItems.equipmentId)}
                      <span>{getEquipmentName(active.run.selectedItems.equipmentId)}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="text-sm font-medium text-surface-900 mb-1">{active.order.title}</h4>
                    <div className="flex items-center justify-between text-xs text-surface-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {active.order.cargoName}</span>
                        <span>{active.order.distance}km</span>
                      </div>
                      <span className="text-emerald-600 font-medium">${active.run.currentReward.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-surface-100 shadow-soft-xs">
              <p className="text-sm text-surface-400">현재 대기 중입니다.</p>
            </div>
          )}
        </section>

        {/* 최근 운행 히스토리 */}
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-surface-900 flex items-center gap-2 px-1">
            <History className="h-4 w-4 text-primary-500" />
            최근 운행 기록
          </h3>
          <div className="bg-white rounded-2xl border border-surface-100 shadow-soft-sm divide-y divide-surface-50">
            {history.length > 0 ? (
              history.map((item) => (
                <div key={item.runId} className="p-4 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-surface-900 truncate">{item.orderTitle}</p>
                    <p className="text-[10px] text-surface-400 mt-0.5">
                      {formatDate(item.completedAt || item.startAt)} · {item.orderDistance}km
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-medium text-surface-700">${item.currentReward.toLocaleString()}</p>
                    <p className="text-[10px] text-emerald-600 font-medium uppercase tracking-tighter">완료</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm text-surface-400">기록이 없습니다.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
