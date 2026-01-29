import { Trophy, HelpCircle, X, Zap, Bot, Clock } from 'lucide-react';

export const HelpModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-900/60">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <h3 className="text-lg font-medium text-surface-900 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary-500" />
            리더보드 가이드
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-surface-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-surface-400" />
          </button>
        </div>
        
        <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
          <section className="space-y-3">
            <h4 className="text-sm font-medium text-surface-900 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              랭킹 산정 기준
            </h4>
            <div className="space-y-2.5">
              <div className="flex gap-3">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-surface-800">수익</p>
                  <p className="text-xs text-surface-500 leading-relaxed">선택한 기간(오늘/주간/월간) 동안 배달 완료로 벌어들인 총 금액입니다.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-surface-800">평판</p>
                  <p className="text-xs text-surface-500 leading-relaxed">배달 성공 시 상승하며, 랭킹 동점자 발생 시 우선 순위 기준이 됩니다.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-surface-800">완료 횟수</p>
                  <p className="text-xs text-surface-500 leading-relaxed">지금까지 완료한 총 배달 횟수입니다.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-medium text-surface-900 flex items-center gap-2">
              <Bot className="h-4 w-4 text-amber-500" />
              봇(Bot) 상태 안내
            </h4>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="mt-0.5 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-medium shrink-0 h-fit">
                  운행 중
                </div>
                <p className="text-xs text-surface-500 leading-relaxed">
                  봇이 현재 배송을 진행하고 있는 상태입니다. 배송이 완료되면 자동으로 휴식 상태로 전환됩니다.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="mt-0.5 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-medium shrink-0 h-fit">
                  대기 중
                </div>
                <p className="text-xs text-surface-500 leading-relaxed">
                  봇이 현재 배송 가능한 주문을 탐색하고 있는 상태입니다. 관리자가 설정한 확률에 따라 주문을 수락하고 운행을 시작합니다.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="mt-0.5 px-2 py-0.5 rounded-full bg-surface-500 text-white text-[10px] font-medium flex items-center gap-1 shrink-0 h-fit">
                  <Clock className="h-3 w-3" />
                  N분 후 복귀
                </div>
                <p className="text-xs text-surface-500 leading-relaxed">
                  배송을 완료한 봇이 휴식을 취하고 있는 상태입니다. 휴식 시간은 배송 완료 후 랜덤하게 결정되며(최소 10분~최대 60분), 표시된 시간이 지나면 자동으로 대기 상태로 복귀합니다.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-medium text-surface-900 flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-500" />
              실시간 데이터
            </h4>
            <p className="text-xs text-surface-500 leading-relaxed">
              리더보드는 30초마다 자동으로 갱신됩니다. 현재 도로 위에서 운행 중인 다른 트럭커와 봇들의 위치와 진행률을 실시간으로 확인할 수 있습니다.
            </p>
          </section>
        </div>

        <div className="p-4 bg-surface-50 border-t border-surface-100">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-white border border-surface-200 text-surface-700 rounded-xl text-sm font-medium hover:bg-surface-100 transition-colors"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
};
