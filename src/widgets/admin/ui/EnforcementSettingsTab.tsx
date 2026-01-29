import { ShieldAlert, Percent, Info, Server, MousePointer2 } from 'lucide-react';

interface EnforcementSettingsTabProps {
  enforcementSettings: {
    baseEnforcementRate: number;
    speedingEnforcementMultiplier: number;
    baseFineAmount: number;
    evasionSuccessRate: number;
    enforcementBypassPenalty: number;
    maxEnforcementCount: number;
    enforcementCheckProbability: number;
    enforcementFineRate: number;
  };
  setEnforcementSettings: (settings: any) => void;
}

export const EnforcementSettingsTab = ({
  enforcementSettings,
  setEnforcementSettings
}: EnforcementSettingsTabProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* 백엔드 중심 시스템 안내 배너 */}
      <div className="rounded-2xl bg-primary-50 border border-primary-100 p-4 flex gap-3">
        <Server className="h-5 w-5 text-primary-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-primary-900">중앙 집중식 백엔드 단속 시스템</h3>
          <p className="text-xs text-primary-700 leading-relaxed">
            모든 단속 로직은 이제 클라이언트가 아닌 <b>서버(Cron)에서 통합 관리</b>됩니다. 
            유저가 앱을 종료해도 단속은 설정된 확률에 따라 공정하게 집행됩니다.
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-accent-rose" />
            <h2 className="text-base font-medium text-surface-900">단속 알고리즘 및 계약 정책</h2>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-soft-md border border-surface-100 space-y-8">
          {/* 1. 계약 수락 시 결정되는 정책 (결정론적) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-surface-50">
              <MousePointer2 className="h-4 w-4 text-primary-500" />
              <h3 className="text-sm font-semibold text-surface-800">1. 계약 생성 시점 정책 (결정론적)</h3>
            </div>
            <p className="text-[11px] text-surface-500 bg-surface-50 p-2 rounded-lg">
              유저가 계약을 수락하는 순간, 아래 설정 범위 내에서 해당 운행의 운명이 결정됩니다. 
              이 정보는 계약서에 기입되어 모든 유저에게 동일하게 적용됩니다.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-surface-700">최대 단속 가능 횟수</label>
                  <span className="text-sm font-bold text-primary-600">{enforcementSettings.maxEnforcementCount}회</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="10" step="1"
                  value={enforcementSettings.maxEnforcementCount}
                  onChange={(e) => setEnforcementSettings({...enforcementSettings, maxEnforcementCount: parseInt(e.target.value)})}
                  className="w-full h-2 bg-surface-100 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <p className="text-[10px] text-surface-400 mt-1">계약 수락 시 0 ~ {enforcementSettings.maxEnforcementCount}회 사이로 최대 횟수가 고정됩니다.</p>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-surface-700">단속 벌금 비율</label>
                  <span className="text-sm font-bold text-accent-rose">{Math.round(enforcementSettings.enforcementFineRate * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="1" step="0.01"
                  value={enforcementSettings.enforcementFineRate}
                  onChange={(e) => setEnforcementSettings({...enforcementSettings, enforcementFineRate: parseFloat(e.target.value)})}
                  className="w-full h-2 bg-surface-100 rounded-lg appearance-none cursor-pointer accent-accent-rose"
                />
                <p className="text-[10px] text-surface-400 mt-1">운행 전체 보상액에 대한 비율로 벌금이 계산됩니다. (예: $10,000 계약 시 {Math.round(enforcementSettings.enforcementFineRate * 100)}% = ${Math.round(10000 * enforcementSettings.enforcementFineRate).toLocaleString()})</p>
              </div>
            </div>
          </div>

          {/* 2. 서버 실행 시 적용되는 정책 (확률적) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-surface-50">
              <Server className="h-4 w-4 text-accent-amber" />
              <h3 className="text-sm font-semibold text-surface-800">2. 서버 실행 시점 정책 (확률적)</h3>
            </div>
            <p className="text-[11px] text-surface-500 bg-surface-50 p-2 rounded-lg">
              서버 크론(Cron)이 매 분 실행될 때, 위에서 고정된 횟수 내에서 실제로 단속을 집행할지 결정하는 확률입니다.
            </p>

            <div className="pt-2">
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-surface-700">단속 실행 확률 (Cron 당첨 확률)</label>
                <span className="text-sm font-bold text-accent-amber">{Math.round(enforcementSettings.enforcementCheckProbability * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0" max="1" step="0.05"
                value={enforcementSettings.enforcementCheckProbability}
                onChange={(e) => setEnforcementSettings({...enforcementSettings, enforcementCheckProbability: parseFloat(e.target.value)})}
                className="w-full h-2 bg-surface-100 rounded-lg appearance-none cursor-pointer accent-accent-amber"
              />
              <p className="text-[10px] text-surface-400 mt-1">매 분마다 해당 확률로 단속 이벤트가 발생합니다. (단, 계약서에 명시된 최대 횟수까지만 발생)</p>
            </div>
          </div>

          <div className="h-px bg-surface-50" />

          {/* 3. 기타 세부 설정 */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-surface-50">
              <Info className="h-4 w-4 text-surface-400" />
              <h3 className="text-sm font-semibold text-surface-800">3. 단속 대응 및 결과 설정</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-surface-400 uppercase">돌파(Evasion) 성공 확률 (%)</label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                  <input 
                    type="number" 
                    value={enforcementSettings.evasionSuccessRate}
                    onChange={(e) => setEnforcementSettings({...enforcementSettings, evasionSuccessRate: parseInt(e.target.value)})}
                    className="w-full rounded-xl border border-surface-200 bg-surface-50 pl-9 pr-4 py-2.5 text-sm font-medium focus:border-primary-500 outline-none"
                  />
                </div>
                <p className="text-[10px] text-surface-400">돌파 시도 시 성공하여 벌금을 면제받을 확률입니다.</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-surface-400 uppercase">우회(Bypass) 시간 패널티 (분)</label>
                <div className="relative">
                  <Info className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                  <input 
                    type="number" 
                    value={enforcementSettings.enforcementBypassPenalty}
                    onChange={(e) => setEnforcementSettings({...enforcementSettings, enforcementBypassPenalty: parseInt(e.target.value)})}
                    className="w-full rounded-xl border border-surface-200 bg-surface-50 pl-9 pr-4 py-2.5 text-sm font-medium focus:border-primary-500 outline-none"
                  />
                </div>
                <p className="text-[10px] text-surface-400">단속 우회 시 도착 예정 시간(ETA)에 추가되는 시간입니다.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 시스템 로그 시뮬레이션 (미리보기) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-medium text-surface-900">운행 로그 시뮬레이션</h2>
          <span className="text-[10px] font-medium text-surface-400">서버에서 생성되는 실제 이벤트 로그 예시</span>
        </div>
        <div className="rounded-2xl bg-surface-900 p-5 font-mono text-[11px] space-y-3 shadow-2xl border border-white/5">
          <div className="space-y-1">
            <p className="text-surface-500">[10:05:12] <span className="text-primary-400">SYSTEM</span> 운행 시작 (최대 단속 가능: {enforcementSettings.maxEnforcementCount}회)</p>
            <p className="text-surface-500">[10:08:45] <span className="text-accent-amber">EVENT</span> 단속 감지 (서버 확률 {Math.round(enforcementSettings.enforcementCheckProbability * 100)}% 당첨)</p>
            <p className="text-white ml-4">└ <span className="text-surface-400">선택:</span> <span className="text-primary-400 font-medium underline">돌파(Evasion)</span></p>
            <p className="text-accent-rose ml-4">└ <span className="font-medium">단속됨!</span> 벌금 <span className="underline">-${Math.round(15000 * enforcementSettings.enforcementFineRate).toLocaleString()}</span> (보상의 {Math.round(enforcementSettings.enforcementFineRate * 100)}%)</p>
          </div>
        </div>
      </section>
    </div>
  );
};
