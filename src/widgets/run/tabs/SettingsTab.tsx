import { FileText, Wrench, Shield, Lock, Info, ScrollText, ShieldAlert, Percent, Target } from 'lucide-react';
import { getRunById, type RunDetail } from '../../../entities/run';
import { useEffect, useState } from 'react';

interface SettingsTabProps {
  runId?: string;
}

export const SettingsTab = ({ runId }: SettingsTabProps) => {
  const [runDetail, setRunDetail] = useState<RunDetail | null>(null);
  const [, setIsLoading] = useState(false);

  useEffect(() => {
    if (runId && runId !== 'temp') {
      const fetchDetail = async () => {
        setIsLoading(true);
        try {
          const detail = await getRunById(runId);
          setRunDetail(detail);
        } catch (err) {
          console.error('Failed to fetch run detail for settings:', err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchDetail();
    }
  }, [runId]);

  return (
    <div className="space-y-6 pb-8">
      {/* 안내 메시지 */}
      <div className="flex items-start gap-2 rounded-xl bg-surface-50 p-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-surface-400" />
        <p className="text-xs text-surface-500">
          운행 중에는 세팅을 변경할 수 없습니다. 계약서에 명시된 단속 정책과 적용된 장비를 확인하세요.
        </p>
      </div>

      {/* 계약서 상세 (단속 정책) */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <ScrollText className="h-4 w-4 text-primary-500" />
          <h4 className="text-sm font-semibold text-surface-900">운행 계약서 상세</h4>
        </div>
        
        <div className="overflow-hidden rounded-2xl border border-surface-100 bg-white shadow-soft-sm">
          <table className="w-full text-left text-xs">
            <tbody className="divide-y divide-surface-50">
              <tr>
                <td className="bg-surface-50/50 px-4 py-3 font-medium text-surface-500 w-1/3">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-accent-rose" />
                    최대 단속 횟수
                  </div>
                </td>
                <td className="px-4 py-3 font-bold text-surface-900 text-right">
                  {runDetail ? `${runDetail.run.maxEnforcementCount}회` : '-'}
                </td>
              </tr>
              <tr>
                <td className="bg-surface-50/50 px-4 py-3 font-medium text-surface-500">
                  <div className="flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-accent-amber" />
                    단속 발생 확률
                  </div>
                </td>
                <td className="px-4 py-3 font-bold text-surface-900 text-right">
                  {runDetail ? `${Math.round(runDetail.run.enforcementProbability * 100)}%` : '-'}
                </td>
              </tr>
              <tr>
                <td className="bg-surface-50/50 px-4 py-3 font-medium text-surface-500">
                  <div className="flex items-center gap-1.5">
                    <Percent className="h-3.5 w-3.5 text-accent-rose" />
                    단속 벌금 비율
                  </div>
                </td>
                <td className="px-4 py-3 font-bold text-accent-rose text-right">
                  {runDetail ? `${Math.round(runDetail.run.fineRate * 100)}%` : '-'}
                </td>
              </tr>
              <tr>
                <td className="bg-surface-50/50 px-4 py-3 font-medium text-surface-500">
                  <div className="flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-surface-400" />
                    정책 적용 시점
                  </div>
                </td>
                <td className="px-4 py-3 text-surface-500 text-right">
                  계약 수락 시 확정
                </td>
              </tr>
            </tbody>
          </table>
          <div className="bg-surface-50 p-2.5">
            <p className="text-[10px] text-surface-400 leading-relaxed text-center">
              * 단속은 서버 크론(Cron)에 의해 위 확률에 따라 자동으로 집행됩니다.
            </p>
          </div>
        </div>
      </section>

      {/* 현재 적용된 세팅 */}
      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-surface-900 px-1">적용된 장비 및 서류</h4>
        <div className="space-y-2">
          {/* 서류 */}
          <div className="flex items-center justify-between rounded-xl border border-surface-100 bg-white p-3 shadow-soft-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-amber/10">
                <FileText className="h-4 w-4 text-accent-amber" />
              </div>
              <div>
                <p className="text-sm font-medium text-surface-900">서류</p>
                <p className="text-xs text-surface-500">
                  {runDetail?.run.selectedItems?.documentId === 'POD' ? '배송 확인서 (POD)' : '기본 서류'}
                </p>
              </div>
            </div>
            <Lock className="h-4 w-4 text-surface-300" />
          </div>

          {/* 장비 */}
          <div className="flex items-center justify-between rounded-xl border border-surface-100 bg-white p-3 shadow-soft-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50">
                <Wrench className="h-4 w-4 text-primary-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-surface-900">장비</p>
                <p className="text-xs text-surface-500">
                  {runDetail?.run.selectedItems?.equipmentId || '기본 장비'}
                </p>
              </div>
            </div>
            <Lock className="h-4 w-4 text-surface-300" />
          </div>

          {/* 보험 */}
          <div className="flex items-center justify-between rounded-xl border border-surface-100 bg-white p-3 shadow-soft-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-50">
                <Shield className="h-4 w-4 text-surface-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-surface-900">보험</p>
                <p className="text-xs text-surface-400">
                  {runDetail?.run.selectedItems?.insuranceId || '선택 안함'}
                </p>
              </div>
            </div>
            <Lock className="h-4 w-4 text-surface-300" />
          </div>
        </div>
      </section>
    </div>
  );
};
