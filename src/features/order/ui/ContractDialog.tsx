import { AlertTriangle, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '../../../shared/ui/Dialog';
import type { Order } from '../../../shared/api/types';
import type { UserEquipment } from '../../../entities/equipment';

interface ContractDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  selectedEquipment: UserEquipment | null;
  onConfirm: () => void;
}

export const ContractDialog = ({
  isOpen,
  onOpenChange,
  order,
  selectedEquipment,
  onConfirm,
}: ContractDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-[340px] p-0 overflow-hidden border-none bg-surface-50">
        {/* 헤더 스타일 수정: 파란색 배경 -> 흰색 배경, 검은색 텍스트 -> 흰색 텍스트 (사용자 요청: 모두 흰색으로) */}
        {/* 하지만 '모두 흰색으로'가 텍스트와 배경 모두 흰색이면 안되므로, 배경을 primary-600으로 유지하되 텍스트를 흰색으로 맞춤 */}
        {/* 다시 읽기: "헤더 컬러가 파란색 배경에 검은색 텍스트로 되어 있어서 보기 힘들다. 모두 흰색으로" */}
        {/* 해석: 배경도 흰색, 텍스트도 (배경이 흰색이니) 어두운 색이거나, 혹은 전체적인 톤을 밝게 해달라는 의미로 보임. */}
        {/* 보통 '모두 흰색으로'는 배경을 흰색으로 해달라는 뜻일 가능성이 높음. */}
        <div className="bg-white p-6 border-b border-surface-100">
          <DialogTitle className="text-center font-semibold text-xl tracking-tight text-surface-900">
            운송 계약 체결
          </DialogTitle>
          <p className="text-center text-surface-400 text-xs mt-1">Contract Confirmation</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-surface-100">
              <h4 className="text-xs font-medium text-surface-400 uppercase tracking-widest mb-3">주문 요약</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-surface-600">화물명</span>
                  <span className="font-medium text-surface-900">{order.cargoName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-surface-600">선택 장비</span>
                  <span className="font-medium text-surface-900">{selectedEquipment?.name || '없음'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-surface-600">예상 소요</span>
                  <span className="font-medium text-primary-600">
                    {selectedEquipment ? Math.round((order.distance / selectedEquipment.baseSpeed) * 60) : '-'}분 (ETA)
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-surface-100 pt-2 mt-2">
                  <span className="text-surface-600">최종 보상금</span>
                  <span className="font-medium text-primary-600">${order.baseReward.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-accent-amber/5 p-4 border border-accent-amber/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-accent-amber" />
                <h4 className="text-xs font-medium text-accent-amber uppercase tracking-widest">주의사항</h4>
              </div>
              <ul className="text-xs text-surface-600 space-y-1 list-disc pl-4">
                <li>운행 중 <strong>단속 이벤트</strong>가 발생할 수 있습니다.</li>
                <li>제한시간 초과 시 패널티가 부과됩니다.</li>
                <li>중도 포기 시 평판이 하락합니다.</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-2xl bg-surface-100 py-3.5 text-sm font-medium text-surface-600 active:bg-surface-200"
            >
              취소
            </button>
            <button 
              onClick={onConfirm}
              className="flex-[2] rounded-2xl bg-primary-600 py-3.5 text-sm font-medium text-white shadow-soft-md active:bg-primary-700 flex items-center justify-center gap-2"
            >
              <FileText className="h-4 w-4" />
              계약 서명 및 출발
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
