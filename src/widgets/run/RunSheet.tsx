import { useState } from 'react';
import { Receipt, Info, AlertCircle, Settings, ChevronUp, ChevronDown } from 'lucide-react';
import { SettlementTab } from './tabs/SettlementTab';
import { OverviewTab } from './tabs/OverviewTab';
import { EventsTab } from './tabs/EventsTab';
import { SettingsTab } from './tabs/SettingsTab';

type TabType = 'settlement' | 'overview' | 'events' | 'settings';
type SheetHeight = 'collapsed' | 'medium' | 'full';

// RunSheet에서 필요한 Order 속성만 정의
interface OrderInfo {
  title: string;
  category: string;
  cargoName: string;
  distance: number;
  baseReward: number;
  limitTimeMinutes: number;
  weight: number;
  endPoint: [number, number];
}

interface RunSheetProps {
  order: OrderInfo;
  elapsedSeconds: number;
  etaSeconds: number;
  runId: string;
}

const TABS = [
  { id: 'settlement' as const, label: '정산', icon: Receipt },
  { id: 'overview' as const, label: '개요', icon: Info },
  { id: 'events' as const, label: '이벤트', icon: AlertCircle },
  { id: 'settings' as const, label: '세팅', icon: Settings },
];

export const RunSheet = ({ order, elapsedSeconds, etaSeconds, runId }: RunSheetProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('settlement');
  const [sheetHeight, setSheetHeight] = useState<SheetHeight>('medium');

  const heightClasses = {
    collapsed: 'h-20',
    medium: 'h-72',
    full: 'h-[70vh]',
  };

  const toggleHeight = () => {
    const sequence: SheetHeight[] = ['collapsed', 'medium', 'full'];
    const currentIndex = sequence.indexOf(sheetHeight);
    const nextIndex = (currentIndex + 1) % sequence.length;
    setSheetHeight(sequence[nextIndex]);
  };

  return (
    <div 
      className={`absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)] transition-all duration-300 ${heightClasses[sheetHeight]}`}
    >
      {/* 드래그 핸들 */}
      <button 
        onClick={toggleHeight}
        className="flex w-full flex-col items-center py-3"
      >
        <div className="h-1 w-10 rounded-full bg-surface-300" />
        <div className="mt-1 flex items-center gap-1 text-xs text-surface-400">
          {sheetHeight === 'collapsed' ? (
            <>펼치기 <ChevronUp className="h-3 w-3" /></>
          ) : sheetHeight === 'full' ? (
            <>접기 <ChevronDown className="h-3 w-3" /></>
          ) : (
            <>더보기 <ChevronUp className="h-3 w-3" /></>
          )}
        </div>
      </button>

      {/* 탭 네비게이션 */}
      {sheetHeight !== 'collapsed' && (
        <>
          <div className="flex border-b border-surface-100 px-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${
                    isActive 
                      ? 'text-primary-600 border-b-2 border-primary-500 -mb-px' 
                      : 'text-surface-400 hover:text-surface-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* 탭 콘텐츠 */}
          <div 
            className="h-[calc(100%-5.5rem)] overflow-y-auto px-4 py-3 scrollbar-hide"
            style={{ 
              willChange: 'scroll-position',
              WebkitOverflowScrolling: 'touch',
              transform: 'translateZ(0)',
            }}
          >
            {activeTab === 'settlement' && (
              <SettlementTab order={order} elapsedSeconds={elapsedSeconds} etaSeconds={etaSeconds} runId={runId} />
            )}
            {activeTab === 'overview' && (
              <OverviewTab 
                order={order} 
                elapsedSeconds={elapsedSeconds} 
                etaSeconds={etaSeconds} 
                remainingSeconds={Math.max(etaSeconds - elapsedSeconds, 0)} 
              />
            )}
            {activeTab === 'events' && (
              <EventsTab />
            )}
            {activeTab === 'settings' && (
              <SettingsTab runId={runId} />
            )}
          </div>
        </>
      )}
    </div>
  );
};
