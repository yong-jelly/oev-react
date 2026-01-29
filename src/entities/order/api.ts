import { rpcTrucker } from '../../shared/api/supabase';
import type { Order } from '../../shared/api/types';

/**
 * 모든 주문(오퍼) 목록 조회
 */
export async function getOrders(userId?: string): Promise<Order[]> {
  const { data, error } = await rpcTrucker('v1_get_orders', { p_user_id: userId });

  if (error) {
    console.error('Failed to fetch orders via RPC:', error);
    throw new Error('Failed to fetch orders');
  }

  return (data || []).map(mapDbOrderToOrder);
}

/**
 * 특정 주문 상세 조회
 */
export async function getOrderById(orderId: string): Promise<Order> {
  const { data, error } = await rpcTrucker('v1_get_order_by_id', { p_order_id: orderId });

  if (error || !data) {
    console.error(`Failed to fetch order ${orderId} via RPC:`, error);
    throw new Error('Order not found');
  }

  return mapDbOrderToOrder(data);
}

/**
 * DB 모델을 프론트엔드 Order 타입으로 변환
 */
function mapDbOrderToOrder(dbOrder: any): Order {
  return {
    id: dbOrder.id,
    title: dbOrder.title,
    category: dbOrder.category,
    cargoName: dbOrder.cargo_name,
    weight: dbOrder.weight,
    volume: dbOrder.volume,
    distance: dbOrder.distance,
    baseReward: Number(dbOrder.base_reward),
    limitTimeMinutes: dbOrder.limit_time_minutes,
    requiredDocumentId: dbOrder.required_document_id,
    requiredEquipmentType: dbOrder.required_equipment_type,
    startPoint: [dbOrder.start_lat, dbOrder.start_lng],
    endPoint: [dbOrder.end_lat, dbOrder.end_lng],
  };
}
