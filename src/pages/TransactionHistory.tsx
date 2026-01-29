import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, History, Loader2 } from 'lucide-react';
import { useUserStore } from '../entities/user';
import { Navigate } from 'react-router';

export const TransactionHistoryPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isSyncing, isHydrated } = useUserStore();

  // 페이지 마운트 시 window 스크롤 초기화
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  if (!isHydrated || isSyncing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-surface-50 pb-12">
      <header className="sticky top-0 z-50 flex items-center gap-3 bg-white px-4 py-4 shadow-soft-sm border-b border-surface-100">
        <button 
          onClick={() => navigate(-1)} 
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-surface-700" />
        </button>
        <h1 className="text-xl font-medium text-surface-900 tracking-tight">거래 내역</h1>
      </header>

      <div className="mx-auto max-w-2xl p-4">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-100 mb-4">
            <History className="h-8 w-8 text-surface-400" />
          </div>
          <p className="text-surface-400 font-medium">거래 내역이 없습니다.</p>
          <p className="text-sm text-surface-300 mt-2">고용, 해고, 수수료, 예치금 등 모든 금전적 흐름이 여기에 표시됩니다.</p>
        </div>
      </div>
    </div>
  );
};
