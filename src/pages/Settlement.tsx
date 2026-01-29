import { useNavigate, useLocation } from 'react-router';
import { CheckCircle2, Clock, MapPin, Share2, Home } from 'lucide-react';
import { CATEGORY_LABELS } from '../shared/lib/mockData';
import { useEffect } from 'react';
import { useUserStore, useUserProfile } from '../entities/user';
import { sendNotification } from '../shared/lib/notification';

export const SettlementPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUserStore();
  const { refetch: refetchProfile } = useUserProfile();
  const { order, elapsedSeconds, finalReward, penalty } = location.state || {};

  // 정산 완료 시 알림 발송 및 프로필 갱신
  useEffect(() => {
    if (user && order && finalReward !== undefined) {
      // 1. 알림 발송
      sendNotification(user.id, {
        title: "🚚 운행 정산 완료",
        message: `[${order.cargoName || order.cargo_name}] 운행이 완료되었습니다.\n최종 정산 금액: $${finalReward.toFixed(2)}\n획득 평판: +${penalty > 0 ? 5 : 10}`,
        type: "success"
      });

      // 2. 프로필(잔액) 갱신
      refetchProfile();
    }
  }, [user, order, finalReward, penalty, refetchProfile]);

  // 데이터가 없는 경우 홈으로 리다이렉트
  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <button onClick={() => navigate('/')} className="text-primary-600 font-medium">홈으로 이동</button>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    const parts = [];
    if (d > 0) parts.push(`${d.toLocaleString()}일`);
    if (h > 0) parts.push(`${h.toLocaleString()}시간`);
    if (m > 0) parts.push(`${m.toLocaleString()}분`);
    parts.push(`${s.toLocaleString()}초`);

    return parts.join(' ');
  };

  return (
    <div className="min-h-screen bg-surface-50 pb-24">
      {/* 성공 헤더 */}
      <div className="bg-white px-4 pt-10 pb-6 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-accent-emerald/10">
          <CheckCircle2 className="h-8 w-8 text-accent-emerald" />
        </div>
        <h1 className="text-xl font-medium text-surface-900">운행 완료</h1>
        <p className="mt-1 text-sm text-surface-500">수고하셨습니다. 정산이 완료되었습니다.</p>
      </div>

      <div className="mx-auto max-w-md space-y-4 p-4">
        {/* 최종 수익 카드 (영수증 스타일로 변경) */}
        <div className="rounded-2xl bg-white p-6 shadow-soft-sm border border-surface-100 relative overflow-hidden">
          {/* 영수증 상단 장식선 */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary-600/20" />
          
          <div className="text-center">
            <p className="text-xs font-medium text-surface-400 uppercase tracking-wider">Total Settlement</p>
            <h2 className="mt-2 text-4xl font-medium text-surface-900">${finalReward.toFixed(2)}</h2>
          </div>

          <div className="mt-6 space-y-3 border-t border-dashed border-surface-200 pt-6">
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">보상</span>
              <span className="text-surface-900">${order.baseReward.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">지각 패널티</span>
              <span className="text-accent-rose">-${penalty.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-surface-100 pt-3">
              <span className="text-sm font-medium text-surface-500">획득 평판</span>
              <span className="text-sm font-medium text-accent-emerald">+{penalty > 0 ? 5 : 10} LP</span>
            </div>
          </div>
        </div>

        {/* 운행 상세 내역 */}
        <div className="rounded-2xl bg-white p-6 shadow-soft-sm border border-surface-100">
          <h3 className="text-xs font-medium text-surface-400 uppercase tracking-wider">Delivery Details</h3>
          
          <div className="mt-4 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <Clock className="h-4 w-4 text-surface-400 mt-0.5" />
                <div>
                  <p className="text-xs text-surface-500">운행 시간</p>
                  <p className="text-sm text-surface-900">{formatDuration(elapsedSeconds)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-surface-500">제한 시간</p>
                <p className="text-sm text-surface-900">{order.limitTimeMinutes}분</p>
              </div>
            </div>

            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <MapPin className="h-4 w-4 text-surface-400 mt-0.5" />
                <div>
                  <p className="text-xs text-surface-500">운행 거리</p>
                  <p className="text-sm text-surface-900">{order.distance}km</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-surface-500">카테고리</p>
                <p className="text-sm text-surface-900">{CATEGORY_LABELS[order.category]}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-surface-100 bg-white p-4">
        <div className="mx-auto flex max-w-2xl gap-3">
          <button 
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-100 text-surface-600 transition-colors hover:bg-surface-200"
          >
            <Share2 className="h-5 w-5" />
          </button>
          <button 
            onClick={() => navigate('/')}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary-600 text-base font-medium text-white shadow-soft-md transition-colors hover:bg-primary-700 active:bg-primary-800"
          >
            <Home className="h-5 w-5" />
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};
