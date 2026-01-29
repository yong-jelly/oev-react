import { useEffect } from "react";
import { ProfileHeader } from "../features/profile/ui/ProfileHeader";
import { AchievementsTab } from "../features/profile/ui/AchievementsTab";
import { useUserProfile } from "../entities/user/queries";
import { useUserStore } from "../entities/user";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams, Navigate } from "react-router";
import { PageHeader } from "../shared/ui/PageHeader";

export function ProfilePage() {
  const navigate = useNavigate();
  const { tab } = useParams();
  const { data: _profile, isLoading: isProfileLoading } = useUserProfile();
  const { isAuthenticated, isSyncing, isHydrated } = useUserStore();
  
  const activeTab = tab || "profile";

  // 페이지 마운트 시 window 스크롤 초기화
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  // 탭 변경 시 스크롤 최상단 이동
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [activeTab]);

  const tabs = [
    { id: "profile", label: "프로필" },
    { id: "achievements", label: "업적" },
    { id: "history", label: "운행 기록" },
    { id: "transactions", label: "거래 내역" },
  ];

  const handleTabChange = (newTabId: string) => {
    navigate(`/profile/${newTabId}`);
  };

  if (!isHydrated || isSyncing || (isProfileLoading && isAuthenticated)) {
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
    <div className="flex flex-col min-h-screen bg-surface-50">
      {/* 상단 헤더 */}
      <PageHeader 
        tabs={tabs} 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        title="마이 페이지"
      />

      {/* 컨텐츠 영역 */}
      <div className="flex-1 w-full max-w-lg mx-auto pt-28 pb-32">
        {activeTab === "profile" && <ProfileHeader />}
        {activeTab === "achievements" && <AchievementsTab />}
        {activeTab === "history" && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-surface-400 font-medium">운행 기록이 없습니다.</p>
          </div>
        )}
        {activeTab === "transactions" && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-surface-400 font-medium">거래 내역이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
