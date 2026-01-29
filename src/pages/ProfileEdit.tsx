import { useRef } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Save } from "lucide-react";
import { ProfileEditForm } from "../features/profile/ui/ProfileEditForm";
import { Button } from "../shared/ui/Button";

export function ProfileEditPage() {
  const navigate = useNavigate();
  const formRef = useRef<{ submit: () => void }>(null);

  return (
    <div className="min-h-screen bg-surface-50 pb-24">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-white px-4 py-4 shadow-soft-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-surface-700" />
          </button>
          <h1 className="text-xl font-medium text-surface-900">프로필 편집</h1>
        </div>
        <Button 
          onClick={() => formRef.current?.submit()}
          className="rounded-xl bg-primary-600 px-4 py-2 text-xs font-medium hover:bg-primary-700"
        >
          <Save className="h-4 w-4 mr-1.5" />
          저장
        </Button>
      </header>

      <div className="mx-auto max-w-lg p-6">
        <div className="rounded-3xl bg-white p-8 shadow-soft-md border border-surface-100">
          <ProfileEditForm ref={formRef} />
        </div>
      </div>
    </div>
  );
}
