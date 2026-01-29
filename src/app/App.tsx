import { BrowserRouter, Routes, Route } from 'react-router';
import { HomePage } from '../pages/Home';
import { BtsChroniclePage } from '../pages/BtsChronicle';
import { OrderDetailPage } from '../pages/OrderDetail';
import { ActiveRunPage } from '../pages/ActiveRun';
import { SettlementPage } from '../pages/Settlement';
import { GaragePage } from '../pages/Garage';
import { HelpPage } from '../pages/Help';
import { AdminSettingPage } from '../pages/AdminSetting';
import { HireDriverPage } from '../pages/HireDriver';
import { OnboardingPage } from '../pages/Onboarding';
import { LoginPage } from '../pages/Login';
import { ProfilePage } from '../pages/Profile';
import { ProfileEditPage } from '../pages/ProfileEdit';
import { TransactionHistoryPage } from '../pages/TransactionHistory';
import { LeaderboardPage } from '../pages/Leaderboard';
import { PublicProfilePage } from '../pages/PublicProfile';
import { PublicRunPage } from '../pages/PublicRun';

export const App = () => {
  return (
    <div className="mx-auto min-h-screen max-w-[480px] bg-white border-x border-surface-200 shadow-none">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<BtsChroniclePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:tab" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<ProfileEditPage />} />
          <Route path="/order/:orderId" element={<OrderDetailPage />} />
          <Route path="/run/:runId" element={<ActiveRunPage />} />
          <Route path="/settlement" element={<SettlementPage />} />
          <Route path="/garage" element={<GaragePage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/super/admin/setting" element={<AdminSettingPage />} />
          <Route path="/hire" element={<HireDriverPage />} />
          <Route path="/transactions" element={<TransactionHistoryPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          {/* 공개 페이지 (p = public) */}
          <Route path="/p/status/:id" element={<PublicProfilePage />} />
          <Route path="/p/run/:runId" element={<PublicRunPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};
