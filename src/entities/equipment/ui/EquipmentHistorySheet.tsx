import { History, Loader2, Package, TrendingUp, MapPin, CheckCircle2, XCircle } from 'lucide-react';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../../../shared/lib/mockData';
import { formatDate, formatKSTTime } from '../../../shared/lib/date';
import type { RunHistory } from '../../run/api';
import { cn } from '../../../shared/lib/utils';

interface EquipmentHistorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  history: RunHistory[] | null;
}

export const EquipmentHistorySheet = ({
  isOpen,
  onClose,
  isLoading,
  history,
}: EquipmentHistorySheetProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4" onClick={onClose}>
      <div 
        className="w-full max-w-lg rounded-t-[32px] bg-white p-6 animate-slide-up max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 핸들바 */}
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-surface-200 shrink-0" />
        
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
              <History className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-surface-900 tracking-tight">운영 히스토리</h2>
              <p className="text-xs text-surface-500 font-medium">최근 20건의 운행 기록</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-surface-50 text-surface-400 hover:text-surface-600 active:scale-90 transition-transform"
          >
            <span className="sr-only">닫기</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 요약 정보 (간단하게 추가) */}
        {!isLoading && history && history.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-3 shrink-0">
            <div className="rounded-2xl bg-accent-emerald/5 p-4 border border-accent-emerald/10">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-accent-emerald" />
                <span className="text-[10px] font-bold text-accent-emerald uppercase tracking-wider">총 수익</span>
              </div>
              <p className="text-lg font-bold text-surface-900">
                ${history.reduce((acc, h) => acc + h.currentReward, 0).toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl bg-primary-50 p-4 border border-primary-100">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary-500" />
                <span className="text-[10px] font-bold text-primary-500 uppercase tracking-wider">완료 횟수</span>
              </div>
              <p className="text-lg font-bold text-surface-900">
                {history.filter(h => h.status === 'COMPLETED').length}회
              </p>
            </div>
          </div>
        )}

        {/* 목록 영역 */}
        <div 
          className="overflow-y-auto flex-1 space-y-4 pr-1 scrollbar-hide pb-4"
          style={{ 
            willChange: 'scroll-position',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary-500 mb-4" />
              <p className="text-sm font-medium text-surface-400">기록을 불러오는 중입니다...</p>
            </div>
          ) : history && history.length > 0 ? (
            history.map((h) => (
              <div 
                key={h.runId} 
                className="group relative overflow-hidden rounded-[24px] border border-surface-100 bg-white p-5 hover:border-primary-200 transition-colors shadow-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight",
                        CATEGORY_COLORS[h.orderCategory] || "bg-surface-100 text-surface-600"
                      )}>
                        {CATEGORY_LABELS[h.orderCategory] || h.orderCategory}
                      </span>
                      <span className="text-[10px] font-medium text-surface-400">
                        {formatDate(h.completedAt || h.startAt)} {formatKSTTime(h.completedAt || h.startAt)}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-surface-900 line-clamp-1">{h.orderTitle}</h4>
                  </div>
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    h.status === 'COMPLETED' ? "bg-accent-emerald/10 text-accent-emerald" : "bg-accent-rose/10 text-accent-rose"
                  )}>
                    {h.status === 'COMPLETED' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 rounded-xl bg-surface-50 p-3">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-surface-400 uppercase tracking-widest">수익</p>
                    <p className={cn(
                      "text-sm font-bold",
                      h.status === 'COMPLETED' ? "text-accent-emerald" : "text-surface-400"
                    )}>
                      ${h.currentReward.toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-surface-400 uppercase tracking-widest">거리</p>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-surface-300" />
                      <p className="text-sm font-bold text-surface-700">{h.orderDistance}km</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-surface-400 uppercase tracking-widest">결과</p>
                    <p className={cn(
                      "text-sm font-bold",
                      h.status === 'COMPLETED' ? "text-primary-600" : "text-accent-rose"
                    )}>
                      {h.status === 'COMPLETED' ? '성공' : '실패'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-20 w-20 rounded-3xl bg-surface-50 flex items-center justify-center mb-6">
                <Package className="h-10 w-10 text-surface-200" />
              </div>
              <h3 className="text-base font-bold text-surface-900 mb-2">아직 기록이 없어요</h3>
              <p className="text-sm text-surface-400 leading-relaxed">
                이 장비로 첫 번째 배송을<br />
                완료하고 기록을 남겨보세요!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
