import { useNavigate } from 'react-router';
import { ChevronRight, Calendar, Clock } from 'lucide-react';
import { ActivityHeatmap } from './ui/ActivityHeatmap';
import { HourlyActivityChart } from './ui/HourlyActivityChart';
import { TransactionItem, TransactionItemSkeleton } from './ui/TransactionItem';
import type { ActivityDay, TransactionEntry, HourlyActivity } from '../../entities/leaderboard/api';
import { getHourlyActivity } from '../../entities/leaderboard/api';
import { useEffect, useState } from 'react';

interface ActivityTabProps {
  isLoading: boolean;
  heatmap: ActivityDay[];
  transactions: TransactionEntry[];
}

export const ActivityTab = ({
  isLoading,
  heatmap,
  transactions,
}: ActivityTabProps) => {
  const navigate = useNavigate();
  const [activityMode, setActivityMode] = useState<'yearly' | 'hourly'>('yearly');
  const [hourlyData, setHourlyData] = useState<HourlyActivity[]>([]);
  const [isHourlyLoading, setIsHourlyLoading] = useState(false);

  useEffect(() => {
    if (activityMode === 'hourly' && hourlyData.length === 0) {
      const fetchHourly = async () => {
        setIsHourlyLoading(true);
        try {
          const data = await getHourlyActivity();
          setHourlyData(data);
        } catch (error) {
          console.error('Failed to fetch hourly activity:', error);
        } finally {
          setIsHourlyLoading(false);
        }
      };
      fetchHourly();
    }
  }, [activityMode, hourlyData.length]);

  return (
    <div className="space-y-6">
      {/* 활동 섹션 헤더 및 토글 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex bg-surface-100 p-1 rounded-lg">
            <button
              onClick={() => setActivityMode('yearly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activityMode === 'yearly'
                  ? 'bg-white text-surface-900 shadow-sm'
                  : 'text-surface-500 hover:text-surface-700'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              연간
            </button>
            <button
              onClick={() => setActivityMode('hourly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activityMode === 'hourly'
                  ? 'bg-white text-surface-900 shadow-sm'
                  : 'text-surface-500 hover:text-surface-700'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              시간대별
            </button>
          </div>
        </div>

        {/* 활동 차트 */}
        {activityMode === 'yearly' ? (
          <ActivityHeatmap data={heatmap} isLoading={isLoading} />
        ) : (
          <HourlyActivityChart data={hourlyData} isLoading={isLoading || isHourlyLoading} />
        )}
      </div>

      {/* 최근 거래 내역 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-surface-900">최근 거래 내역</h2>
          <button 
            onClick={() => navigate('/transactions')}
            className="text-xs text-primary-600 flex items-center gap-1"
          >
            전체 보기
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        
        <div className="rounded-xl bg-white border border-surface-100 px-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <TransactionItemSkeleton key={i} />)
          ) : transactions.length > 0 ? (
            transactions.slice(0, 15).map((tx) => (
              <TransactionItem key={tx.id} tx={tx} />
            ))
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-surface-500">거래 내역이 없습니다</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
