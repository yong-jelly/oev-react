import { useNavigate } from "react-router";
import { LogOut, ChevronRight } from "lucide-react";
import { useUserProfile, useLogout } from "../../../entities/user/queries";
import { Button } from "../../../shared/ui/Button";

export function ProfileHeader() {
  const navigate = useNavigate();
  const { data: profile } = useUserProfile();
  const { mutate: logout } = useLogout();

  if (!profile) return null;

  return (
    <div className="bg-white">
      <div className="px-5 py-6">
        <div className="mb-8 flex items-center gap-5">
          {/* 프로필 이미지 */}
          <div className="relative h-24 w-24 flex-shrink-0">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.nickname}
                className="h-full w-full rounded-full object-cover border-4 border-surface-50 shadow-sm"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-surface-100 text-3xl font-medium text-surface-300">
                {profile.nickname.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* 사용자 텍스트 정보 */}
          <div className="flex-1 overflow-hidden">
            <h2 className="text-2xl font-medium text-surface-900 truncate mb-1">
              {profile.nickname}
            </h2>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                평판 {profile.reputation.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-accent-amber bg-accent-amber/10 px-2 py-0.5 rounded-full">
                자산 ${(profile.balance).toLocaleString()}
              </span>
            </div>
            {profile.bio ? (
              <p className="text-sm font-medium text-surface-500 line-clamp-2 leading-tight">
                {profile.bio}
              </p>
            ) : (
              <p className="text-xs font-medium text-surface-400">
                소개 정보가 없습니다.
              </p>
            )}
          </div>
        </div>

        {/* 프로필 액션 버튼 */}
        <div className="mb-12 flex gap-3">
          <Button
            onClick={() => navigate("/profile/edit")}
            variant="outline"
            className="flex-1 rounded-2xl h-14 text-base font-medium border-surface-200"
          >
            프로필 편집
          </Button>
        </div>

        {/* 업적 요약 섹션 */}
        <div className="mb-8">
          <div className="text-[11px] font-medium text-surface-400 uppercase tracking-[0.2em] mb-4 px-1">
            활동 요약
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface-50 rounded-2xl p-4 text-center">
              <p className="text-[10px] font-medium text-surface-400 uppercase mb-1">총 운행</p>
              <p className="text-lg font-medium text-surface-900">12</p>
            </div>
            <div className="bg-surface-50 rounded-2xl p-4 text-center">
              <p className="text-[10px] font-medium text-surface-400 uppercase mb-1">정시율</p>
              <p className="text-lg font-medium text-surface-900">92%</p>
            </div>
            <div className="bg-surface-50 rounded-2xl p-4 text-center">
              <p className="text-[10px] font-medium text-surface-400 uppercase mb-1">최고 수익</p>
              <p className="text-lg font-medium text-surface-900">$12k</p>
            </div>
          </div>
        </div>

        {/* 설정 메뉴 */}
        <div className="space-y-2">
          <div className="text-[11px] font-medium text-surface-400 uppercase tracking-[0.2em] mb-3 px-1">
            계정 설정
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-between p-4 rounded-[24px] bg-surface-50/50 hover:bg-rose-50 transition-all duration-200 group border border-transparent hover:border-rose-100"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center group-hover:bg-rose-100 transition-colors shadow-sm">
                <LogOut className="h-5 w-5 text-surface-400 group-hover:text-accent-rose transition-colors" />
              </div>
              <span className="text-[17px] font-medium text-surface-700 group-hover:text-accent-rose transition-colors">
                로그아웃
              </span>
            </div>
            <ChevronRight className="h-5 w-5 text-surface-300 group-hover:text-accent-rose/50 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
}
