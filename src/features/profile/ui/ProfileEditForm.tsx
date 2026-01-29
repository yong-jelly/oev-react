import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { useNavigate } from "react-router";
import { Loader2, RefreshCw, Bell, BellOff, Send, MessageSquare } from "lucide-react";
import { useUserProfile, useUpsertProfile } from "../../../entities/user/queries";
import { Input } from "../../../shared/ui/Input";
import { useUserStore } from "../../../entities/user";

export const ProfileEditForm = forwardRef((_, ref) => {
  const navigate = useNavigate();
  const { data: profile } = useUserProfile();
  const { mutate: upsertProfile, isPending: isSaving } = useUpsertProfile();
  const { user: authUser } = useUserStore();
  
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [error, setError] = useState("");
  
  const formRef = useRef<HTMLFormElement>(null);

  useImperativeHandle(ref, () => ({
    submit: () => {
      formRef.current?.requestSubmit();
    }
  }));

  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname);
      setBio(profile.bio || "");
      setAvatarUrl(profile.avatar_url || "");
      setTelegramChatId(profile.telegram_chat_id || "");
      setSlackWebhookUrl(profile.slack_webhook_url || "");
      setNotificationEnabled(profile.notification_enabled ?? true);
    }
  }, [profile]);

  const handleRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    // DiceBear Avataaars API 사용 (usemap과 동일)
    const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`;
    setAvatarUrl(newAvatar);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    
    setError("");

    if (nickname.length < 2) {
      setError("닉네임은 최소 2자 이상이어야 합니다.");
      return;
    }

    upsertProfile(
      {
        nickname,
        bio: bio || null,
        avatar_url: avatarUrl || null,
        telegram_chat_id: telegramChatId || null,
        slack_webhook_url: slackWebhookUrl || null,
        notification_enabled: notificationEnabled,
      },
      {
        onSuccess: () => {
          navigate("/profile");
        },
        onError: (err: any) => {
          setError(err.message || "프로필 업데이트에 실패했습니다.");
        },
      }
    );
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
      {/* 프로필 이미지 섹션 */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative group">
          <div className="w-28 h-28 rounded-full bg-surface-50 border-4 border-white overflow-hidden flex items-center justify-center shadow-soft-lg transition-all group-hover:border-primary-100">
            {avatarUrl ? (
              <img src={avatarUrl} alt={nickname} className="w-full h-full object-cover" />
            ) : (
              <div className="text-4xl font-medium text-surface-200 uppercase">
                {nickname.charAt(0) || "?"}
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={handleRandomAvatar}
            className="absolute -bottom-1 -right-1 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center">
          <p className="text-[11px] font-medium text-surface-400 uppercase tracking-widest leading-none">
            {authUser?.email || "이메일 정보 없음"}
          </p>
        </div>
      </div>

      {/* 닉네임 입력 */}
      <div className="space-y-3">
        <label className="block text-[14px] font-medium text-surface-900 ml-1">
          닉네임
        </label>
        <Input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="닉네임을 입력하세요 (2~30자)"
          required
          maxLength={30}
          className="h-14 px-5 rounded-2xl bg-white border-surface-100 focus:border-primary-500 transition-all text-[17px] font-medium shadow-soft-sm"
        />
        <p className="text-[10px] text-surface-400 ml-1 font-medium">트럭커들 사이에서 불릴 이름입니다.</p>
      </div>

      {/* 소개 입력 */}
      <div className="space-y-3">
        <label className="block text-[14px] font-medium text-surface-900 ml-1">
          자기소개
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full min-h-[120px] p-5 rounded-2xl bg-white border border-surface-100 focus:border-primary-500 transition-all text-[16px] font-medium resize-none leading-relaxed shadow-soft-sm outline-none"
          placeholder="자신을 소개해주세요 (최대 200자)"
          maxLength={200}
        />
        <div className="flex justify-between text-[10px] text-surface-400 px-1 font-medium">
          <span>소개는 선택 항목입니다</span>
          <span>{bio.length}/200</span>
        </div>
      </div>

      {/* 알림 설정 섹션 */}
      <div className="space-y-6 pt-4 border-t border-surface-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${notificationEnabled ? 'bg-primary-50 text-primary-600' : 'bg-surface-100 text-surface-400'}`}>
              {notificationEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-medium text-surface-900">이벤트 알림</h3>
              <p className="text-[10px] text-surface-400 font-medium">주요 게임 이벤트 발생 시 알림을 받습니다.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNotificationEnabled(!notificationEnabled)}
            className={`w-12 h-6 rounded-full transition-colors relative ${notificationEnabled ? 'bg-primary-600' : 'bg-surface-200'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notificationEnabled ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        {notificationEnabled && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* 텔레그램 설정 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[13px] font-medium text-surface-700 ml-1">
                <Send className="w-3.5 h-3.5 text-[#229ED9]" />
                텔레그램 알림 ID
              </label>
              <Input
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="Chat ID를 입력하세요"
                className="h-12 px-4 rounded-xl bg-surface-50 border-transparent focus:bg-white focus:border-primary-500 transition-all text-[15px] font-medium"
              />
              <p className="text-[9px] text-surface-400 ml-1">
                @userinfobot 등을 통해 확인한 본인의 숫자로 된 ID를 입력하세요.
              </p>
            </div>

            {/* 슬랙 설정 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[13px] font-medium text-surface-700 ml-1">
                <MessageSquare className="w-3.5 h-3.5 text-[#4A154B]" />
                슬랙 Webhook URL
              </label>
              <Input
                value={slackWebhookUrl}
                onChange={(e) => setSlackWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                className="h-12 px-4 rounded-xl bg-surface-50 border-transparent focus:bg-white focus:border-primary-500 transition-all text-[15px] font-medium"
              />
              <p className="text-[9px] text-surface-400 ml-1">
                알림을 받을 채널의 Incoming Webhook URL을 입력하세요.
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-600 animate-in fade-in zoom-in duration-200">
          {error}
        </div>
      )}

      {isSaving && (
        <div className="flex justify-center pt-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      )}
    </form>
  );
});

ProfileEditForm.displayName = "ProfileEditForm";
