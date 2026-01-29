import { Skeleton } from '../../../shared/ui/Skeleton';
import type { HourlyActivity } from '../../../entities/leaderboard/api';

interface HourlyActivityChartProps {
  data: HourlyActivity[];
  isLoading?: boolean;
}

export const HourlyActivityChart = ({ data, isLoading }: HourlyActivityChartProps) => {
  const levelColors = [
    'bg-surface-100',
    'bg-emerald-200',
    'bg-emerald-400',
    'bg-emerald-500',
    'bg-emerald-600',
  ];

  // 24시간을 4개씩 6줄로 표시하거나, 12개씩 2줄로 표시 (모바일 대응)
  // 여기서는 24개를 한 줄로 표시하되 스크롤 가능하게 하거나, 
  // 사용자 요청대로 "연간 활동과 동일하게 구성하되 약간은 표현이 다르게" 하기 위해 
  // 24개의 세로 바 또는 블록 형태로 구성

  return (
    <div className="rounded-xl bg-white border border-surface-100 p-4 shadow-soft-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-surface-900">시간대별 활동</h3>
        <div className="flex items-center gap-1 text-xs text-surface-500">
          <span>적음</span>
          {levelColors.map((color, i) => (
            <div key={i} className={`h-3 w-3 rounded-sm ${color}`} />
          ))}
          <span>많음</span>
        </div>
      </div>
      
      <div 
        className="overflow-x-auto pb-2"
        style={{ 
          willChange: 'scroll-position',
          WebkitOverflowScrolling: 'touch',
          transform: 'translateZ(0)',
        }}
      >
        {isLoading ? (
          <div className="flex gap-1.5 min-w-[500px] h-32 items-end">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3">
                <Skeleton className="w-full h-16 rounded-md" />
                <Skeleton className="h-3 w-4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-1.5 min-w-[500px] h-32 items-end px-1">
            {data.map((item) => (
              <div key={item.hour} className="flex-1 flex flex-col items-center gap-3 group relative">
                {/* 툴팁 - 막대 중앙에 위치하도록 조정 */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden group-hover:block z-20 pointer-events-none">
                  <div className="bg-surface-900/90 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap shadow-xl border border-white/10">
                    {item.hour}시: {item.runs_count}회 ($ {item.earnings.toLocaleString()})
                  </div>
                </div>
                
                {/* 바/블록 */}
                <div 
                  className={`w-full rounded-md ${levelColors[item.level]} ${
                    item.level > 0 ? 'shadow-sm' : ''
                  }`}
                  style={{ 
                    height: `${Math.max(12, (item.level + 1) * 16)}px`,
                    opacity: item.level === 0 ? 0.5 : 1
                  }}
                />
                
                {/* 시간 라벨 */}
                <div className="h-4 flex items-center">
                  <span className="text-[10px] font-medium text-surface-400">
                    {item.hour % 6 === 0 ? `${item.hour}h` : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <p className="mt-2 text-[10px] text-surface-400 text-center">
        최근 30일간의 운행 완료 시간을 기준으로 집계되었습니다 (KST)
      </p>
    </div>
  );
};
