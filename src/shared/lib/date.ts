/**
 * 시간 차이를 계산하여 각 단위별 값을 반환합니다.
 * @param targetTimestamp 대상 시간 (ms)
 * @param baseTimestamp 기준 시간 (ms, 기본값은 현재 시간)
 */
export const getTimeDiff = (targetTimestamp: number, baseTimestamp: number = Date.now()) => {
  const diff = Math.max(0, targetTimestamp - baseTimestamp);
  const totalSeconds = Math.floor(diff / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  return {
    diff,
    days: totalDays,
    hours: totalHours % 24,
    minutes: totalMinutes % 60,
    seconds: totalSeconds % 60,
    totalHours,
    totalMinutes,
    totalSeconds,
  };
};

/**
 * 휴식 시간 포맷팅 (UI 텍스트 포함 버전 - 하위 호환성 유지용)
 * @deprecated 가급적 getTimeDiff를 사용하여 UI에서 직접 텍스트를 구성하세요.
 */
export const formatRestTime = (nextAvailableAt: number): string => {
  const { totalHours, minutes, seconds } = getTimeDiff(nextAvailableAt);

  if (totalHours >= 1) {
    return `${totalHours}시간 후 복귀`;
  }
  if (minutes > 0) {
    return `${minutes}분 ${seconds}초 후 복귀`;
  }
  return `${seconds}초 후 복귀`;
};

/**
 * 상대 시간 포맷팅 (예: "방금 전", "5분 전")
 * @param timestamp 대상 시간 (ms)
 */
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = Math.max(0, now - timestamp);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  
  return formatDate(timestamp);
};

/**
 * KST 기준 날짜 포맷팅 (YYYY. MM. DD.)
 */
export const formatDate = (timestamp: number | string | Date): string => {
  return new Date(timestamp).toLocaleDateString('ko-KR');
};

/**
 * KST 기준 시간 포맷팅 (HH시 mm분)
 */
export const formatKSTTime = (timestamp: number | string | Date): string => {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${hours}시 ${minutes}분`;
};

/**
 * KST 기준 전체 일시 포맷팅 (YYYY. MM. DD. HH:mm)
 */
export const formatDateTime = (timestamp: number | string | Date): string => {
  const date = new Date(timestamp);
  return `${formatDate(date)} ${formatKSTTime(date)}`;
};

/**
 * 경과 시간 포맷팅 (mm:ss 또는 hh:mm:ss 또는 d일 h시간 m분 s초)
 * @param secondsTotal 전체 초
 * @param fullFormat 상세 포맷 여부 (d일 h시간...)
 */
export const formatDuration = (secondsTotal: number, fullFormat: boolean = false): string => {
  const days = Math.floor(secondsTotal / (3600 * 24));
  const hours = Math.floor((secondsTotal % (3600 * 24)) / 3600);
  const minutes = Math.floor((secondsTotal % 3600) / 60);
  const seconds = Math.floor(secondsTotal % 60);

  if (fullFormat) {
    const parts = [];
    if (days > 0) parts.push(`${days.toLocaleString()}일`);
    if (hours > 0) parts.push(`${hours.toLocaleString()}시간`);
    if (minutes > 0) parts.push(`${minutes.toLocaleString()}분`);
    parts.push(`${seconds.toLocaleString()}초`);
    return parts.join(' ');
  }

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  if (hours > 0 || days > 0) {
    const totalHours = hours + (days * 24);
    const hh = String(totalHours).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
};
