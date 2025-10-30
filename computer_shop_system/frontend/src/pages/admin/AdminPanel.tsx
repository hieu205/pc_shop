import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSnackbar } from '../../hooks/useSnackbar';
import { adminDashboardService } from '../../services/admin.service';

interface DashboardStats {
  totalProducts: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockProducts: number;
  pendingOrders: number;
  activePromotions: number;
  recentComments: number;
}


const AdminPanel: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { showError } = useSnackbar();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    lowStockProducts: 0,
    pendingOrders: 0,
    activePromotions: 0,
    recentComments: 0
  });
  
  // recent activities currently not displayed in simplified dashboard

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const statsRes = await adminDashboardService.getDashboardStats();
      setStats(statsRes);
      setLoading(false);
    } catch (error: any) {
      showError('Không thể tải dữ liệu dashboard: ' + (error.message || ''));
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Note: simplified UI components (avoid complex Grid/List to keep types simple)

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Đang tải dữ liệu dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5">Bảng điều khiển quản trị</Typography>
          <Typography variant="body2" color="textSecondary">Chào mừng trở lại, {user?.full_name || 'Admin'}</Typography>
        </Box>
        <Box>
          <Tooltip title="Làm mới dữ liệu">
            <IconButton onClick={fetchDashboardData}><RefreshIcon /></IconButton>
          </Tooltip>
          <Button variant="text" color="error" onClick={handleLogout}>Đăng xuất</Button>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <Paper sx={{ p: 2, minWidth: 220 }}>
          <Typography variant="h6">Tổng sản phẩm</Typography>
          <Typography variant="h4">{stats.totalProducts}</Typography>
        </Paper>

        <Paper sx={{ p: 2, minWidth: 220 }}>
          <Typography variant="h6">Người dùng</Typography>
          <Typography variant="h4">{stats.totalUsers}</Typography>
        </Paper>

        <Paper sx={{ p: 2, minWidth: 220 }}>
          <Typography variant="h6">Đơn hàng</Typography>
          <Typography variant="h4">{stats.totalOrders}</Typography>
        </Paper>

        <Paper sx={{ p: 2, minWidth: 220 }}>
          <Typography variant="h6">Doanh thu</Typography>
          <Typography variant="h4">{(stats.totalRevenue / 1000000).toFixed(1)}M VNĐ</Typography>
        </Paper>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Paper sx={{ p: 2, minWidth: 300 }}>
          <Typography variant="h6">Thao tác nhanh</Typography>
          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
            <Button variant="contained" component={RouterLink} to="/admin/products/create">Thêm sản phẩm</Button>
            <Button variant="outlined" component={RouterLink} to="/admin/categories/create">Thêm danh mục</Button>
          </Box>
        </Paper>

        <Paper sx={{ p: 2, minWidth: 300 }}>
          <Typography variant="h6">Thông báo</Typography>
          {stats.lowStockProducts > 0 && (
            <Alert severity="warning">Có {stats.lowStockProducts} sản phẩm sắp hết hàng</Alert>
          )}
          {stats.pendingOrders > 0 && (
            <Alert severity="info">Có {stats.pendingOrders} đơn hàng đang chờ xử lý</Alert>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default AdminPanel;
