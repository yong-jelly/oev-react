import { cn } from "@/shared/lib/utils";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

interface Tab {
  id: string;
  label: string;
}

interface PageHeaderProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  title?: string;
  showBackButton?: boolean;
}

export function PageHeader({ tabs, activeTab, onTabChange, title, showBackButton = true }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 bg-white border-b border-surface-100">
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3 mb-4">
          {showBackButton && (
            <button 
              onClick={() => navigate("/")} 
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-50 transition-colors -ml-2"
            >
              <ArrowLeft className="h-6 w-6 text-surface-700" />
            </button>
          )}
          {title && (
            <h1 className="text-xl font-medium text-surface-900">{title}</h1>
          )}
        </div>
        <div className="flex gap-6 overflow-x-auto scrollbar-hide -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative py-3 text-sm font-medium transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "text-primary-600"
                  : "text-surface-400 hover:text-surface-600"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
