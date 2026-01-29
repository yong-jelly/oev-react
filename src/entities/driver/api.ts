import { rpcTrucker } from '../../shared/api/supabase';
import type { DriverPersona } from '../../shared/api/types';
import { Assets } from '../../shared/assets';

/**
 * 파일명을 Assets.images.characters 키로 매핑하는 헬퍼 함수
 */
const AVATAR_FILENAME_TO_KEY: Record<string, keyof typeof Assets.images.characters> = {
  '01_jack_harlow.png': 'jackHarlow',
  '02_victor_kane.png': 'victorKane',
  '03_maya_reed.png': 'mayaReed',
  '04_serena_holt.png': 'serenaHolt',
  '05_rowan_vale.png': 'rowanVale',
  '06_eli_park.png': 'eliPark',
  '07_nina_cole.png': 'ninaCole',
  '08_jules_quinn.png': 'julesQuinn',
  '09_unit_R_04.png': 'unitR04',
};

/**
 * avatar_filename을 로컬 이미지로 변환
 */
function getAvatarImage(filename: string): string {
  const key = AVATAR_FILENAME_TO_KEY[filename];
  if (!key) {
    console.warn(`Avatar image not found for filename: ${filename}`);
    return Assets.images.characters.driver; // fallback
  }
  return Assets.images.characters[key];
}

/**
 * DB 응답을 DriverPersona 타입으로 변환
 */
function mapDbPersonaToPersona(dbPersona: any): DriverPersona {
  return {
    id: dbPersona.id,
    name: dbPersona.name,
    avatarFilename: dbPersona.avatar_filename,
    appearance: dbPersona.appearance,
    bio: dbPersona.bio,
    archetype: dbPersona.archetype,
    age: dbPersona.age,
    outfit: dbPersona.outfit,
    palette: dbPersona.palette,
    prop: dbPersona.prop,
    mood: dbPersona.mood,
    shot: dbPersona.shot,
    baseCommissionMin: dbPersona.base_commission_min,
    baseCommissionMax: dbPersona.base_commission_max,
    stats: (dbPersona.stats || []).map((stat: any) => ({
      label: stat.label,
      value: stat.value,
      description: stat.description || undefined,
    })),
    createdAt: new Date(dbPersona.created_at).getTime(),
    updatedAt: new Date(dbPersona.updated_at).getTime(),
  };
}

/**
 * 모든 드라이버 페르소나 조회
 */
export async function getDriverPersonas(): Promise<DriverPersona[]> {
  const { data, error } = await rpcTrucker('v1_get_driver_personas', {});

  if (error) {
    console.error('Failed to fetch driver personas via RPC:', error);
    throw new Error('Failed to fetch driver personas');
  }

  return (data || []).map(mapDbPersonaToPersona);
}

/**
 * 특정 드라이버 페르소나 조회
 */
export async function getDriverPersonaById(personaId: string): Promise<DriverPersona | null> {
  const { data, error } = await rpcTrucker('v1_get_driver_persona_by_id', {
    p_persona_id: personaId,
  });

  if (error) {
    console.error('Failed to fetch driver persona via RPC:', error);
    throw new Error('Failed to fetch driver persona');
  }

  if (!data || data.length === 0) {
    return null;
  }

  return mapDbPersonaToPersona(data[0]);
}

/**
 * 드라이버 고용
 */
export async function hireDriver(params: {
  userId: string;
  personaId: string;
  commissionRate: number; // 0-100 사이의 값
  depositAmount: number;
}): Promise<{ id: string; name: string; commissionRate: number }> {
  const { userId, personaId, commissionRate, depositAmount } = params;

  const { data, error } = await rpcTrucker('v1_hire_driver', {
    p_user_id: userId,
    p_persona_id: personaId,
    p_commission_rate: commissionRate,
    p_deposit_amount: depositAmount,
  });

  if (error) {
    console.error('Failed to hire driver via RPC:', error);
    throw new Error(error?.message || 'Failed to hire driver');
  }

  return {
    id: data.id,
    name: data.name,
    commissionRate: data.commission_rate * 100, // 소수를 %로 변환
  };
}

/**
 * avatar_filename을 로컬 이미지 URL로 변환하는 헬퍼 (UI에서 사용)
 */
export function getAvatarImageUrl(filename: string): string {
  return getAvatarImage(filename);
}
