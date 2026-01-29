import { rpcTrucker } from "../api/supabase";

interface NotificationPayload {
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
}

/**
 * 사용자에게 텔레그램 또는 슬랙 알림을 발송합니다.
 * 사용자의 프로필 설정에서 알림이 활성화되어 있고, 주소가 등록되어 있어야 합니다.
 */
export async function sendNotification(userId: string, payload: NotificationPayload) {
  try {
    // 1. 사용자 프로필에서 알림 설정 조회
    const { data: profile, error: profileError } = await rpcTrucker("v1_get_user_profile", { p_auth_user_id: userId });

    if (profileError || !profile || !profile.notification_enabled) {
      return { success: false, reason: "Notification disabled or profile not found" };
    }

    const { telegram_chat_id, slack_webhook_url } = profile;
    const results = [];

    // 2. 텔레그램 알림 발송 (Supabase Edge Function 호출 권장이나 여기서는 직접 fetch 예시)
    // 실제 구현 시에는 보안을 위해 Edge Function을 통해 발송하는 것이 좋습니다.
    if (telegram_chat_id) {
      // TODO: Supabase Edge Function 'notify-telegram' 호출 로직으로 대체 예정
      console.log(`[Notification] Sending Telegram to ${telegram_chat_id}: ${payload.title}`);
    }

    // 3. 슬랙 알림 발송
    if (slack_webhook_url) {
      try {
        const response = await fetch(slack_webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `*${payload.title}*\n${payload.message}`,
          }),
        });
        results.push({ service: "slack", success: response.ok });
      } catch (e) {
        console.error("Slack notification error:", e);
        results.push({ service: "slack", success: false, error: e });
      }
    }

    return { success: true, results };
  } catch (error) {
    console.error("Send notification error:", error);
    return { success: false, error };
  }
}
