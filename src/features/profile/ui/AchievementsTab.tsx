import { Target, Zap, ShieldCheck, DollarSign } from "lucide-react";
import { cn } from "../../../shared/lib/utils";

const ACHIEVEMENTS = [
  {
    id: "first-delivery",
    title: "첫 배달의 설렘",
    description: "첫 번째 배달 주문을 성공적으로 완료했습니다.",
    icon: <Zap className="h-6 w-6" />,
    color: "bg-yellow-100 text-yellow-600",
    unlocked: true,
    date: "2026-01-20",
  },
  {
    id: "punctual-trucker",
    title: "시간은 금이다",
    description: "정시 도착 10회를 달성했습니다.",
    icon: <Target className="h-6 w-6" />,
    color: "bg-blue-100 text-blue-600",
    unlocked: true,
    date: "2026-01-25",
  },
  {
    id: "safety-first",
    title: "무사고 베테랑",
    description: "단속 적발 없이 5회 연속 운행에 성공했습니다.",
    icon: <ShieldCheck className="h-6 w-6" />,
    color: "bg-emerald-100 text-emerald-600",
    unlocked: false,
    progress: 80,
  },
  {
    id: "rich-trucker",
    title: "자산가 트럭커",
    description: "보유 자금 $10,000를 돌파했습니다.",
    icon: <DollarSign className="h-6 w-6" />,
    color: "bg-purple-100 text-purple-600",
    unlocked: false,
    progress: 45,
  },
];

export function AchievementsTab() {
  return (
    <div className="space-y-4 px-4 py-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-surface-900 uppercase tracking-widest">획득한 업적</h3>
        <span className="text-[10px] font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">2 / 4</span>
      </div>

      <div className="grid gap-3">
        {ACHIEVEMENTS.map((achievement) => (
          <div 
            key={achievement.id}
            className={cn(
              "relative overflow-hidden rounded-3xl p-5 border transition-all",
              achievement.unlocked 
                ? "bg-white border-surface-100 shadow-soft-md" 
                : "bg-surface-50 border-transparent opacity-60"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm",
                achievement.unlocked ? achievement.color : "bg-surface-200 text-surface-400"
              )}>
                {achievement.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-medium text-surface-900">{achievement.title}</h4>
                  {achievement.unlocked && (
                    <span className="text-[10px] font-medium text-surface-400">{achievement.date}</span>
                  )}
                </div>
                <p className="text-xs text-surface-500 mt-0.5 leading-relaxed">{achievement.description}</p>
                
                {!achievement.unlocked && achievement.progress !== undefined && (
                  <div className="mt-3">
                    <div className="flex justify-between text-[9px] font-medium text-surface-400 mb-1 uppercase">
                      <span>진행도</span>
                      <span>{achievement.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-500 transition-all duration-500"
                        style={{ width: `${achievement.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
