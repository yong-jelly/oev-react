import { Activity } from 'lucide-react';

interface BotSettingsTabProps {
  botSettings: {
    restMinMinutes: number;
    restMaxMinutes: number;
    acceptProbability: number;
  };
  setBotSettings: (settings: any) => void;
  botStatuses: any[];
  isResetting: boolean;
  handleResetBots: () => void;
  renderBotCard: (bot: any) => React.ReactNode;
}

export const BotSettingsTab = ({
  botSettings,
  setBotSettings,
  botStatuses,
  isResetting,
  handleResetBots,
  renderBotCard
}: BotSettingsTabProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* 봇 활동 파라미터 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary-600" />
            <h2 className="text-base font-medium text-surface-900">봇 활동 파라미터</h2>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-soft-md border border-surface-100 space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-surface-700">휴식 시간 범위 (분)</label>
              <span className="text-sm font-medium text-primary-600">
                {botSettings.restMinMinutes}분 ~ {botSettings.restMaxMinutes}분
              </span>
            </div>
            <div className="flex gap-4 items-center">
              <input 
                type="range" 
                min="5" max="30" step="5"
                value={botSettings.restMinMinutes}
                onChange={(e) => setBotSettings({
                  ...botSettings, 
                  restMinMinutes: parseInt(e.target.value),
                  restMaxMinutes: Math.max(parseInt(e.target.value), botSettings.restMaxMinutes)
                })}
                className="flex-1 h-2 bg-surface-100 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <input 
                type="range" 
                min="30" max="120" step="10"
                value={botSettings.restMaxMinutes}
                onChange={(e) => setBotSettings({
                  ...botSettings, 
                  restMaxMinutes: parseInt(e.target.value),
                  restMinMinutes: Math.min(parseInt(e.target.value), botSettings.restMinMinutes)
                })}
                className="flex-1 h-2 bg-surface-100 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
            </div>
            <p className="text-[10px] text-surface-400 mt-1">배달 완료 후 다음 배달까지의 대기 시간입니다.</p>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-surface-700">주문 수락 확률</label>
              <span className="text-sm font-medium text-primary-600">
                {(botSettings.acceptProbability * 100).toFixed(0)}%
              </span>
            </div>
            <input 
              type="range" 
              min="0.1" max="1.0" step="0.1"
              value={botSettings.acceptProbability}
              onChange={(e) => setBotSettings({...botSettings, acceptProbability: parseFloat(e.target.value)})}
              className="w-full h-2 bg-surface-100 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <p className="text-[10px] text-surface-400 mt-1">매 분마다 봇이 새로운 주문을 수락할 확률입니다.</p>
          </div>
        </div>
      </section>

      {/* 봇 상태 모니터링 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <BotIcon className="h-5 w-5 text-surface-900" />
            <h2 className="text-base font-medium text-surface-900">실시간 봇 상태</h2>
          </div>
          <button 
            onClick={handleResetBots}
            disabled={isResetting}
            className="text-xs text-rose-500 flex items-center gap-1 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshIcon className={`h-3 w-3 ${isResetting ? 'animate-spin' : ''}`} /> 
            {isResetting ? '초기화 중...' : '시스템 초기화'}
          </button>
        </div>

        <div className="space-y-3">
          {botStatuses.map((bot) => renderBotCard(bot))}
        </div>
      </section>
    </div>
  );
};

import { Bot as BotIcon, RefreshCcw as RefreshIcon } from 'lucide-react';
