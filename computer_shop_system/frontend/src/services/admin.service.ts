import { userService } from './user.service';
import { productService } from './product.service';
import { orderService } from './order.service';
import { inventoryService } from './inventory.service';
import { promotionService } from './promotion.service';

export interface DashboardStats {
  totalProducts: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockProducts: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  activePromotions: number;
  recentComments: number;
}

export interface RecentActivity {
  id: string;
  type: 'order' | 'user' | 'product' | 'comment';
  message: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

export const adminDashboardService = {
  /**
   * Get comprehensive dashboard statistics
   */
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      console.log('📊 Admin Dashboard: Đang lấy thống kê tổng quan...');
      
      // Prefer direct "count/stats" endpoints where available to reflect DB values accurately.
      const [productsRes, usersRes, ordersStatsRes, lowStockRes, promotionsRes] = await Promise.allSettled([
        productService.getProductCount(),
        userService.getUserCount(),
        orderService.getOrderStats(),
        inventoryService.getLowStock(10).catch(() => []), // Fallback to empty array
        promotionService.getActivePromotions().catch(() => []) // Fallback to empty array
      ]);

      const totalProducts = productsRes.status === 'fulfilled' ? Number(productsRes.value ?? 0) : 0;
      const totalUsers = usersRes.status === 'fulfilled' ? Number(usersRes.value ?? 0) : 0;
      // orderService.getOrderStats returns an object with totals; fallback to 0
  const orderStats = ordersStatsRes.status === 'fulfilled' ? ordersStatsRes.value : null;
  const totalOrders = orderStats ? Number((orderStats as any).total_orders ?? (orderStats as any).total ?? 0) : 0;
      
      // Calculate low stock products
      let lowStockProducts = 0;
      if (lowStockRes.status === 'fulfilled') {
        const lowStockData = lowStockRes.value;
        if (Array.isArray(lowStockData)) {
          lowStockProducts = lowStockData.length;
        } else if (lowStockData && typeof lowStockData === 'object' && 'products' in lowStockData) {
          lowStockProducts = lowStockData.products?.length || 0;
        }
      }

      // Calculate active promotions
      let activePromotions = 0;
      if (promotionsRes.status === 'fulfilled') {
        const promotionsData = promotionsRes.value;
        if (Array.isArray(promotionsData)) {
          activePromotions = promotionsData.length;
        }
      }

      // Get detailed order statistics for revenue and breakdown by status
      let totalRevenue = 0;
      let pendingOrders = 0;
      let processingOrders = 0;
      let shippedOrders = 0;
      let deliveredOrders = 0;
      let cancelledOrders = 0;

      if (orderStats) {
        totalRevenue = Number((orderStats as any).total_revenue ?? (orderStats as any).revenue ?? 0);
        pendingOrders = Number((orderStats as any).pending_orders ?? (orderStats as any).pending ?? 0);
        processingOrders = Number((orderStats as any).processing_orders ?? (orderStats as any).processing ?? 0);
        shippedOrders = Number((orderStats as any).shipped_orders ?? (orderStats as any).shipped ?? 0);
        deliveredOrders = Number((orderStats as any).delivered_orders ?? (orderStats as any).delivered ?? 0);
        cancelledOrders = Number((orderStats as any).cancelled_orders ?? (orderStats as any).cancelled ?? 0);
      } else {
        // Fallback: aggregate from orders endpoint (use large page to get accurate counts)
        try {
          const ordersDetailRes = await orderService.getOrders({ page: 0, size: 1000 });
          const orders = ordersDetailRes.content || [];
          totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.total_amount || order.totalPrice || 0), 0);
          pendingOrders = orders.filter((order: any) => String(order.status).toUpperCase() === 'PENDING').length;
          processingOrders = orders.filter((order: any) => String(order.status).toUpperCase() === 'PROCESSING').length;
          shippedOrders = orders.filter((order: any) => String(order.status).toUpperCase() === 'SHIPPED').length;
          deliveredOrders = orders.filter((order: any) => String(order.status).toUpperCase() === 'DELIVERED').length;
          cancelledOrders = orders.filter((order: any) => String(order.status).toUpperCase() === 'CANCELLED').length;
        } catch (e) {
          console.warn('Could not fetch detailed order stats via fallback:', e);
        }
      }

      const recentComments = 0; // TODO: Implement when comment service is ready

      const stats: DashboardStats = {
        totalProducts,
        totalUsers,
        totalOrders,
        totalRevenue,
        lowStockProducts,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        activePromotions,
        recentComments
      };

      console.log('✅ Admin Dashboard: Đã lấy thống kê tổng quan thành công');
      return stats;
    } catch (error: any) {
      console.error('❌ Admin Dashboard: Lỗi lấy thống kê tổng quan:', error);
      throw error;
    }
  },

  /**
   * Get recent activities (placeholder implementation)
   */
  getRecentActivities: async (limit: number = 10): Promise<RecentActivity[]> => {
    try {
      console.log('📊 Admin Dashboard: Đang lấy hoạt động gần đây...');
      
      // TODO: Implement real recent activities when backend supports it
      // For now, return mock data
      const mock: RecentActivity[] = [
        { 
          id: '1', 
          type: 'order', 
          message: 'Đơn hàng mới được tạo', 
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), 
          status: 'success' 
        },
        { 
          id: '2', 
          type: 'product', 
          message: 'Sản phẩm sắp hết hàng', 
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), 
          status: 'warning' 
        },
        { 
          id: '3', 
          type: 'user', 
          message: 'Người dùng mới đăng ký', 
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), 
          status: 'info' 
        }
      ];

      return mock.slice(0, limit);
    } catch (error: any) {
      console.error('❌ Admin Dashboard: Lỗi lấy hoạt động gần đây:', error);
      return [];
    }
  },

  /**
   * Get system health status
   */
  getSystemHealth: async (): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    uptime: string;
  }> => {
    try {
      console.log('📊 Admin Dashboard: Đang kiểm tra tình trạng hệ thống...');
      
      const issues: string[] = [];
      
      // Check low stock products
      try {
        const lowStockData = await inventoryService.getLowStock(5);
        const lowStockCount = Array.isArray(lowStockData) ? lowStockData.length : 0;
        if (lowStockCount > 10) {
          issues.push(`${lowStockCount} sản phẩm sắp hết hàng`);
        }
      } catch (e) {
        issues.push('Không thể kiểm tra tồn kho');
      }

      // Check pending orders
      try {
        const pendingOrders = await orderService.getOrdersByStatus('PENDING', { page: 0, size: 1 });
        if (pendingOrders.totalElements > 20) {
          issues.push(`${pendingOrders.totalElements} đơn hàng chờ xử lý`);
        }
      } catch (e) {
        issues.push('Không thể kiểm tra đơn hàng');
      }

      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (issues.length > 2) {
        status = 'critical';
      } else if (issues.length > 0) {
        status = 'warning';
      }

      return {
        status,
        issues,
        uptime: '99.9%' // TODO: Get real uptime from backend
      };
    } catch (error: any) {
      console.error('❌ Admin Dashboard: Lỗi kiểm tra tình trạng hệ thống:', error);
      return {
        status: 'critical',
        issues: ['Không thể kiểm tra tình trạng hệ thống'],
        uptime: 'Unknown'
      };
    }
  }
};
