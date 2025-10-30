import { api } from './api';

type Page<T> = { content: T[]; totalElements: number; totalPages: number };

export interface InventoryProduct {
  id: number;
  name: string;
  quantity: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
  category?: {
    id: number;
    name: string;
  };
  updated_at: string;
}

export interface LowStockSummary {
  total_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
  products: InventoryProduct[];
}

export interface StockAdjustmentRequest {
  change_type: 'RESTOCK' | 'SALE' | 'ADJUSTMENT' | 'RETURN';
  quantity: number;
  reason: string;
  performed_by?: number;
}

export interface StockReserveRequest {
  quantity: number;
  reserved_for: string;
}

export interface StockReleaseRequest {
  quantity: number;
  reason: string;
}

export interface InventoryLog {
  id: number;
  product_id: number;
  change_type: string;
  quantity_change: number;
  reason: string;
  performed_by: number;
  created_at: string;
}

export const inventoryService = {
  /**
   * Get all inventory products with pagination - GET /api/v1/inventory/products
   */
  getInventory: async (opts?: { 
    page?: number; 
    size?: number; 
    status?: string; 
    search?: string 
  }): Promise<Page<InventoryProduct>> => {
    try {
      console.log('📦 Inventory Service: Đang lấy danh sách tồn kho...');
      const params: any = { page: opts?.page ?? 0, size: opts?.size ?? 20 };
      if (opts?.status) params.status = opts.status;
      if (opts?.search) params.search = opts.search;
      
      const resp: any = await api.get('/inventory/products', { params });
      const payload = resp && (resp as any).data ? (resp as any).data : resp;
      
      if (payload && payload.content !== undefined) return payload as Page<InventoryProduct>;
      if (Array.isArray(payload)) return { content: payload, totalElements: payload.length, totalPages: 1 } as Page<InventoryProduct>;
      return { content: [], totalElements: 0, totalPages: 0 } as Page<InventoryProduct>;
    } catch (error: any) {
      console.error('❌ Inventory Service: Lỗi lấy danh sách tồn kho:', error);
      throw error;
    }
  },

  /**
   * Get product inventory details - GET /api/v1/inventory/products/{id}
   */
  getProductInventory: async (productId: number): Promise<InventoryProduct> => {
    try {
      console.log(`📦 Inventory Service: Đang lấy thông tin tồn kho sản phẩm ${productId}...`);
      const resp: any = await api.get(`/inventory/products/${productId}`);
      const payload = resp && (resp as any).data ? (resp as any).data : resp;
      return payload;
    } catch (error: any) {
      console.error('❌ Inventory Service: Lỗi lấy thông tin tồn kho sản phẩm:', error);
      throw error;
    }
  },

  /**
   * Get low stock products - GET /api/v1/inventory/low-stock
   * Note: This endpoint may not exist in all backend versions
   */
  getLowStock: async (threshold = 10): Promise<LowStockSummary | InventoryProduct[]> => {
    try {
      console.log(`📦 Inventory Service: Đang lấy sản phẩm sắp hết hàng (ngưỡng: ${threshold})...`);
      const resp: any = await api.get(`/inventory/low-stock?threshold=${threshold}`);
      const payload = resp && (resp as any).data ? (resp as any).data : resp;
      
      // payload.data may be LowStockSummaryResponse or list
      if (Array.isArray(payload)) return payload;
      return payload?.data || payload;
    } catch (error: any) {
      console.error('❌ Inventory Service: Lỗi lấy sản phẩm sắp hết hàng:', error);
      // Return empty array if endpoint doesn't exist
      return [];
    }
  },

  /**
   * Get out of stock products - GET /api/v1/inventory/out-of-stock
   * Note: This endpoint may not exist in all backend versions
   */
  getOutOfStock: async (): Promise<InventoryProduct[]> => {
    try {
      console.log('📦 Inventory Service: Đang lấy sản phẩm hết hàng...');
      const resp: any = await api.get('/inventory/out-of-stock');
      const payload = resp && (resp as any).data ? (resp as any).data : resp;
      return Array.isArray(payload) ? payload : [];
    } catch (error: any) {
      console.error('❌ Inventory Service: Lỗi lấy sản phẩm hết hàng:', error);
      // Return empty array if endpoint doesn't exist
      return [];
    }
  },

  /**
   * Get products that need restock - GET /api/v1/inventory/need-restock
   * Note: This endpoint may not exist in all backend versions
   */
  getProductsNeedRestock: async (): Promise<InventoryProduct[]> => {
    try {
      console.log('📦 Inventory Service: Đang lấy sản phẩm cần nhập hàng...');
      const resp: any = await api.get('/inventory/need-restock');
      const payload = resp && (resp as any).data ? (resp as any).data : resp;
      return Array.isArray(payload) ? payload : [];
    } catch (error: any) {
      console.error('❌ Inventory Service: Lỗi lấy sản phẩm cần nhập hàng:', error);
      // Return empty array if endpoint doesn't exist
      return [];
    }
  },

  /**
   * Adjust product stock - POST /api/v1/inventory/products/{id}/adjust
   */
  adjustInventory: async (productId: number, adjustment: StockAdjustmentRequest): Promise<InventoryProduct> => {
    try {
      console.log(`📦 Inventory Service: Đang điều chỉnh tồn kho sản phẩm ${productId}...`);
      const resp: any = await api.post(`/inventory/products/${productId}/adjust`, adjustment);
      const payload = resp && (resp as any).data ? (resp as any).data : resp;
      console.log('✅ Inventory Service: Điều chỉnh tồn kho thành công');
      return payload;
    } catch (error: any) {
      console.error('❌ Inventory Service: Lỗi điều chỉnh tồn kho:', error);
      throw error;
    }
  },

  /**
   * Update stock threshold - PUT /api/v1/inventory/products/{id}/threshold
   */
  updateStockThreshold: async (productId: number, threshold: number): Promise<InventoryProduct> => {
    try {
      console.log(`📦 Inventory Service: Đang cập nhật ngưỡng tồn kho sản phẩm ${productId}...`);
      const resp: any = await api.put(`/inventory/products/${productId}/threshold`, {
        low_stock_threshold: threshold
      });
      const payload = resp && (resp as any).data ? (resp as any).data : resp;
      console.log('✅ Inventory Service: Cập nhật ngưỡng tồn kho thành công');
      return payload;
    } catch (error: any) {
      console.error('❌ Inventory Service: Lỗi cập nhật ngưỡng tồn kho:', error);
      throw error;
    }
  },

  /**
   * Reserve stock - POST /api/v1/inventory/products/{id}/reserve
   */
  reserveStock: async (productId: number, reserveRequest: StockReserveRequest): Promise<InventoryProduct> => {
    try {
      console.log(`📦 Inventory Service: Đang đặt trước hàng sản phẩm ${productId}...`);
      const resp: any = await api.post(`/inventory/products/${productId}/reserve`, reserveRequest);
      const payload = resp && (resp as any).data ? (resp as any).data : resp;
      console.log('✅ Inventory Service: Đặt trước hàng thành công');
      return payload;
    } catch (error: any) {
      console.error('❌ Inventory Service: Lỗi đặt trước hàng:', error);
      throw error;
    }
  },

  /**
   * Release reserved stock - POST /api/v1/inventory/products/{id}/release
   */
  releaseReservedStock: async (productId: number, releaseRequest: StockReleaseRequest): Promise<InventoryProduct> => {
    try {
      console.log(`📦 Inventory Service: Đang giải phóng hàng đặt trước sản phẩm ${productId}...`);
      const resp: any = await api.post(`/inventory/products/${productId}/release`, releaseRequest);
      const payload = resp && (resp as any).data ? (resp as any).data : resp;
      console.log('✅ Inventory Service: Giải phóng hàng đặt trước thành công');
      return payload;
    } catch (error: any) {
      console.error('❌ Inventory Service: Lỗi giải phóng hàng đặt trước:', error);
      throw error;
    }
  },

  /**
   * Get inventory logs - GET /api/v1/inventory/logs
   * Note: This endpoint may not exist in all backend versions
   */
  getInventoryLogs: async (opts?: { page?: number; size?: number }): Promise<Page<InventoryLog>> => {
    try {
      console.log('📦 Inventory Service: Đang lấy lịch sử tồn kho...');
      const params: any = { page: opts?.page ?? 0, size: opts?.size ?? 20 };
      const resp: any = await api.get('/inventory/logs', { params });
      const payload = resp && (resp as any).data ? (resp as any).data : resp;
      
      if (payload && payload.content !== undefined) return payload as Page<InventoryLog>;
      if (Array.isArray(payload)) return { content: payload, totalElements: payload.length, totalPages: 1 } as Page<InventoryLog>;
      return { content: [], totalElements: 0, totalPages: 0 } as Page<InventoryLog>;
    } catch (error: any) {
      console.error('❌ Inventory Service: Lỗi lấy lịch sử tồn kho:', error);
      // Return empty page if endpoint doesn't exist
      return { content: [], totalElements: 0, totalPages: 0 };
    }
  },

  /**
   * Get product inventory logs - GET /api/v1/inventory/products/{id}/logs
   * Note: This endpoint may not exist in all backend versions
   */
  getProductInventoryLogs: async (productId: number, opts?: { page?: number; size?: number }): Promise<Page<InventoryLog>> => {
    try {
      console.log(`📦 Inventory Service: Đang lấy lịch sử tồn kho sản phẩm ${productId}...`);
      const params: any = { page: opts?.page ?? 0, size: opts?.size ?? 10 };
      const resp: any = await api.get(`/inventory/products/${productId}/logs`, { params });
      const payload = resp && (resp as any).data ? (resp as any).data : resp;
      
      if (payload && payload.content !== undefined) return payload as Page<InventoryLog>;
      if (Array.isArray(payload)) return { content: payload, totalElements: payload.length, totalPages: 1 } as Page<InventoryLog>;
      return { content: [], totalElements: 0, totalPages: 0 } as Page<InventoryLog>;
    } catch (error: any) {
      console.error('❌ Inventory Service: Lỗi lấy lịch sử tồn kho sản phẩm:', error);
      // Return empty page if endpoint doesn't exist
      return { content: [], totalElements: 0, totalPages: 0 };
    }
  },

  /**
   * Check stock availability - GET /api/v1/inventory/products/{id}/availability
   * Note: This endpoint may not exist in all backend versions
   */
  checkStockAvailability: async (productId: number): Promise<{ available: number; reserved: number; total: number }> => {
    try {
      console.log(`📦 Inventory Service: Đang kiểm tra khả năng tồn kho sản phẩm ${productId}...`);
      const resp: any = await api.get(`/inventory/products/${productId}/availability`);
      const payload = resp && (resp as any).data ? (resp as any).data : resp;
      return payload;
    } catch (error: any) {
      console.error('❌ Inventory Service: Lỗi kiểm tra khả năng tồn kho:', error);
      // Return default values if endpoint doesn't exist
      return { available: 0, reserved: 0, total: 0 };
    }
  }
};

export default inventoryService;
