import { useMemo } from 'react';
import { Skeleton } from '../../../shared/ui/Skeleton';
import type { ActivityDay } from '../../../entities/leaderboard/api';

export const ActivityHeatmap = ({ data, isLoading }: { data: ActivityDay[]; isLoading?: boolean }) => {
  const levelColors = [
    'bg-surface-100',
    'bg-emerald-200',
    'bg-emerald-400',
    'bg-emerald-500',
    'bg-emerald-600',
  ];

  // 주 단위로 그룹화 (최근 52주)
  const weeks = useMemo(() => {
    if (isLoading || data.length === 0) return [];
    
    const result: ActivityDay[][] = [];
    let currentWeek: ActivityDay[] = [];
    
    // 시작 요일 맞추기
    const startDate = new Date(data[0]?.date || new Date());
    const startDay = startDate.getDay();
    
    // 첫 주 앞부분 빈 셀 채우기
    for (let i = 0; i < startDay; i++) {
      currentWeek.push({ date: '', runsCount: 0, earnings: 0, level: -1 });
    }
    
    data.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });
    
    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }
    return result;
  }, [data, isLoading]);

  return (
    <div className="rounded-xl bg-white border border-surface-100 p-4 shadow-soft-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-surface-900">연간 활동</h3>
        <div className="flex items-center gap-1 text-xs text-surface-500">
          <span>적음</span>
          {levelColors.map((color, i) => (
            <div key={i} className={`h-3 w-3 rounded-sm ${color}`} />
          ))}
          <span>많음</span>
        </div>
      </div>
      
      <div 
        className="overflow-x-auto"
        style={{ 
          willChange: 'scroll-position',
          WebkitOverflowScrolling: 'touch',
          transform: 'translateZ(0)',
        }}
      >
        {isLoading ? (
          <div className="flex gap-0.5" style={{ minWidth: '680px' }}>
            {Array.from({ length: 52 }).map((_, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {Array.from({ length: 7 }).map((_, di) => (
                  <Skeleton key={di} className="h-3 w-3 rounded-sm" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-0.5" style={{ minWidth: '680px' }}>
            {weeks.slice(-52).map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={`h-3 w-3 rounded-sm transition-colors ${
                      day.level === -1 ? 'bg-transparent' : levelColors[day.level]
                    }`}
                    title={day.date ? `${day.date}: ${day.runsCount}회 운행, $${day.earnings}` : ''}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
