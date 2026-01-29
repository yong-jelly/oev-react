import { rpcTrucker } from '../../shared/api/supabase';
import type { OrderCategory } from '../../shared/api/types';

/**
 * 장비 정보 타입
 */
export interface Equipment {
  id: string;
  name: string;
  description: string | null;
  imageFilename: string;
  equipmentType: string;
  price: number;
  baseSpeed: number;
  maxSpeed: number;
  maxWeight: number;
  maxVolume: number;
  allowedCategories: OrderCategory[];
  isDefault: boolean;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * 유저 보유 장비 정보 타입
 */
export interface UserEquipment {
  userEquipmentId: string;
  equipmentId: string;
  purchasedAt: number;
  isEquipped: boolean;
  // 장비 상세 정보
  name: string;
  description: string | null;
  imageFilename: string;
  equipmentType: string;
  price: number;
  baseSpeed: number;
  maxSpeed: number;
  maxWeight: number;
  maxVolume: number;
  allowedCategories: OrderCategory[];
}

/**
 * 장비 스냅샷 타입 (계약 저장용)
 */
export interface EquipmentSnapshot {
  id: string;
  name: string;
  equipmentType: string;
  baseSpeed: number;
  maxSpeed: number;
  maxWeight: number;
  maxVolume: number;
}

/**
 * 전체 장비 목록 조회 (활성화된 장비만)
 */
export async function getEquipments(): Promise<Equipment[]> {
  const { data, error } = await rpcTrucker('v1_get_equipments');

  if (error) {
    console.error('Failed to fetch equipments:', error);
    throw new Error('Failed to fetch equipments');
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    imageFilename: row.image_filename,
    equipmentType: row.equipment_type,
    price: row.price,
    baseSpeed: row.base_speed,
    maxSpeed: row.max_speed,
    maxWeight: row.max_weight,
    maxVolume: row.max_volume,
    allowedCategories: row.allowed_categories || [],
    isDefault: row.is_default,
    isActive: row.is_active,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  }));
}

/**
 * 관리자용 전체 장비 목록 조회 (비활성 포함)
 */
export async function getAllEquipmentsAdmin(): Promise<Equipment[]> {
  const { data, error } = await rpcTrucker('v1_get_all_equipments_admin');

  if (error) {
    console.error('Failed to fetch all equipments for admin:', error);
    throw new Error('Failed to fetch all equipments');
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    imageFilename: row.image_filename,
    equipmentType: row.equipment_type,
    price: row.price,
    baseSpeed: row.base_speed,
    maxSpeed: row.max_speed,
    maxWeight: row.max_weight,
    maxVolume: row.max_volume,
    allowedCategories: row.allowed_categories || [],
    isDefault: row.is_default,
    isActive: row.is_active,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  }));
}

/**
 * 유저 보유 장비 목록 조회
 */
export async function getUserEquipments(userId: string): Promise<UserEquipment[]> {
  const { data, error } = await rpcTrucker('v1_get_user_equipments', { p_user_id: userId });

  if (error) {
    console.error('Failed to fetch user equipments:', error);
    throw new Error('Failed to fetch user equipments');
  }

  return (data || []).map((row: any) => ({
    userEquipmentId: row.user_equipment_id,
    equipmentId: row.equipment_id,
    purchasedAt: new Date(row.purchased_at).getTime(),
    isEquipped: row.is_equipped,
    name: row.name,
    description: row.description,
    imageFilename: row.image_filename,
    equipmentType: row.equipment_type,
    price: row.price,
    baseSpeed: row.base_speed,
    maxSpeed: row.max_speed,
    maxWeight: row.max_weight,
    maxVolume: row.max_volume,
    allowedCategories: row.allowed_categories || [],
  }));
}

/**
 * 장비 정보 수정 (관리자용)
 */
export async function updateEquipment(params: {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  baseSpeed?: number;
  maxSpeed?: number;
  maxWeight?: number;
  maxVolume?: number;
  allowedCategories?: string[];
  isDefault?: boolean;
  isActive?: boolean;
}): Promise<Equipment> {
  const { data, error } = await rpcTrucker('v1_update_equipment', {
    p_id: params.id,
    p_name: params.name,
    p_description: params.description,
    p_price: params.price,
    p_base_speed: params.baseSpeed,
    p_max_speed: params.maxSpeed,
    p_max_weight: params.maxWeight,
    p_max_volume: params.maxVolume,
    p_allowed_categories: params.allowedCategories,
    p_is_default: params.isDefault,
    p_is_active: params.isActive,
  });

  if (error) {
    console.error('Failed to update equipment:', error);
    throw new Error('Failed to update equipment');
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    imageFilename: data.image_filename,
    equipmentType: data.equipment_type,
    price: data.price,
    baseSpeed: data.base_speed,
    maxSpeed: data.max_speed,
    maxWeight: data.max_weight,
    maxVolume: data.max_volume,
    allowedCategories: data.allowed_categories || [],
    isDefault: data.is_default,
    isActive: data.is_active,
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime(),
  };
}

/**
 * 장비 이미지 경로 생성 유틸리티
 */
export function getEquipmentImagePath(imageFilename: string): string {
  return `/src/shared/assets/images/${imageFilename}.png`;
}
