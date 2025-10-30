/**
 * 🔧 STAFF PANEL - Computer Shop E-commerce
 * 
 * Staff dashboard for limited management features
 * Features based on SYSTEM_DESIGN.md:
 * - STAFF: Xem kho, reply bình luận, xem đơn hàng
 */

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Divider,
} from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CommentIcon from '@mui/icons-material/Comment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReplyIcon from '@mui/icons-material/Reply';
import { useAuth } from '../../hooks/useAuth';

const StaffPanel: React.FC = () => {
  const { user } = useAuth();

  const staffFeatures = [
    {
      title: 'Xem kho hàng',
      description: 'Theo dõi tồn kho, trạng thái sản phẩm',
      icon: <InventoryIcon />,
      color: 'warning',
      path: '/staff/inventory',
      permission: 'canViewInventory'
    },
    {
      title: 'Xem đơn hàng',
      description: 'Theo dõi đơn hàng, cập nhật trạng thái',
  icon: <ShoppingCartIcon />,
      color: 'success',
      path: '/staff/orders',
      permission: 'canManageOrders'
    },
    {
      title: 'Trả lời bình luận',
      description: 'Hỗ trợ khách hàng qua bình luận sản phẩm',
  icon: <CommentIcon />,
      color: 'info',
      path: '/staff/comments',
      permission: 'canReplyComments'
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <WorkIcon sx={{ mr: 2, fontSize: 32, color: 'warning.main' }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            Staff Panel
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Chào mừng <strong>{user?.full_name || user?.username}</strong>, bạn có quyền hỗ trợ vận hành cửa hàng.
        </Typography>
        <Chip 
          label="STAFF" 
          color="warning" 
          size="small" 
          sx={{ mt: 1 }}
        />
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* Staff Features Grid */}
      <Grid container spacing={3}>
        {staffFeatures.map((feature, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    color: `${feature.color}.main`,
                    mr: 2,
                    fontSize: 32
                  }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" component="h2" fontWeight="bold">
                    {feature.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  color={feature.color as any}
                  onClick={() => {
                    // TODO: Navigate to feature page
                    console.log('Navigate to:', feature.path);
                  }}
                >
                  Truy cập
                </Button>
                <Button size="small" color="inherit">
                  Chi tiết
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Staff Permissions Info */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" gutterBottom>
          Quyền hạn của bạn
        </Typography>
        <Card sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <VisibilityIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="body2">
                  <strong>Xem kho hàng:</strong> Theo dõi tồn kho, trạng thái sản phẩm
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <VisibilityIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="body2">
                  <strong>Quản lý đơn hàng:</strong> Xem và cập nhật trạng thái đơn hàng
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ReplyIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="body2">
                  <strong>Trả lời bình luận:</strong> Hỗ trợ khách hàng qua bình luận
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Card>
      </Box>

      {/* Quick Stats for Staff */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Thống kê công việc
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  45
                </Typography>
                <Typography variant="body2">
                  Đơn hàng cần xử lý
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="error.main">
                  8
                </Typography>
                <Typography variant="body2">
                  Sản phẩm sắp hết hàng
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  23
                </Typography>
                <Typography variant="body2">
                  Bình luận cần trả lời
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default StaffPanel;
