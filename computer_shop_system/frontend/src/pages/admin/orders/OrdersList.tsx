import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Paper
} from '@mui/material';
import { Visibility as ViewIcon, MoreVert as MoreVertIcon, Refresh as RefreshIcon, Edit as EditIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../../../services/order.service';
import { useSnackbar } from '../../../hooks/useSnackbar';
import { ORDER_STATUSES } from '../../../types/order.types';
import { getOrderStatusColor, getOrderStatusLabel, isCancelableStatus } from '../../../utils/orderStatus';

const PAGE_SIZE = 10;

const OrdersList: React.FC = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [filters, setFilters] = useState({ status: '' });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let response: any;
      // If a specific status filter is used, call the status endpoint which some backends implement
      if (filters.status) {
        response = await orderService.getOrdersByStatus(filters.status, { page, size: PAGE_SIZE, sort: 'createdAt,desc' });
      } else {
        response = await orderService.getOrders({ page, size: PAGE_SIZE, sort: 'createdAt,desc' });
      }
      setOrders(response.content || []);
      setTotal(response.totalElements || response.total_elements || 0);
    } catch (err: any) {
      showError('Không tải được danh sách đơn hàng: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // Fetch when page changes or status filter changes
  useEffect(() => { fetchOrders(); }, [page, filters.status]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, order: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrder(order);
  };
  const handleMenuClose = () => { setAnchorEl(null); };
  const handleViewOrder = (order: any) => { navigate(`/admin/orders/${order.id}`); handleMenuClose(); setSelectedOrder(null); };
  const handleUpdateStatus = (order: any) => {
    setSelectedOrder(order);
    setNewStatus((order.status || 'PENDING').toUpperCase());
    setStatusDialogOpen(true);
    setAnchorEl(null); // close only the menu, keep selectedOrder for dialog
  };

  const handleCancelOrder = async (order: any) => {
    try {
      if (!order) return;
      if ((order.status || '').toUpperCase() !== 'PENDING') {
        showError('Chỉ có thể hủy đơn ở trạng thái CHỜ XỬ LÝ');
        return;
      }
      const confirmed = window.confirm(`Bạn có chắc muốn hủy đơn #${order.order_code ?? order.orderCode ?? order.id}?`);
      if (!confirmed) return;
      await orderService.cancelOrder(order.id);
      showSuccess('Hủy đơn hàng thành công');
      await fetchOrders();
    } catch (err: any) {
      showError('Hủy đơn thất bại: ' + (err?.message || err));
    } finally {
      handleMenuClose();
      setSelectedOrder(null);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder) return;
    try {
      const statusToSend = (newStatus || 'PENDING').toUpperCase();
      await orderService.updateOrderStatus(selectedOrder.id, statusToSend);
      showSuccess('Cập nhật trạng thái đơn hàng thành công');
      setStatusDialogOpen(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (err: any) {
      showError('Cập nhật trạng thái thất bại: ' + (err.message || err));
    }
  };

  const getStatusColor = (status: string) => getOrderStatusColor(status);
  const getStatusLabel = (status: string) => getOrderStatusLabel(status);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  const formatDate = (dateString: string) => dateString ? new Date(dateString).toLocaleString('vi-VN') : '-';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Quản lý đơn hàng</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => fetchOrders()} disabled={loading}>Làm mới</Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Bộ lọc</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>Trạng thái</InputLabel>
            <Select native value={filters.status} onChange={(e: any) => setFilters({ ...filters, status: e.target.value })} label="Trạng thái">
              <option value="">Tất cả</option>
              {ORDER_STATUSES.map(s => (
                <option key={s} value={s}>{getOrderStatusLabel(s)}</option>
              ))}
            </Select>
          </FormControl>
          {/* Search by code/name removed per request */}
        </Box>
      </Paper>

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Mã đơn</TableCell>
                    <TableCell>Khách hàng</TableCell>
                    <TableCell>Tổng tiền</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Ngày tạo</TableCell>
                    <TableCell align="right">Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} hover>
                      <TableCell><Typography variant="body2" fontWeight="medium">{order.order_code ?? order.orderCode ?? order.orderCode}</Typography></TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">{order.customer_name ?? order.customerName}</Typography>
                          <Typography variant="caption" color="text.secondary">{order.customer_email ?? order.customerEmail}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell><Typography variant="body2" fontWeight="medium">{formatCurrency(order.final_amount ?? order.finalAmount)}</Typography></TableCell>
                      <TableCell><Chip label={getStatusLabel(order.status)} color={getStatusColor(order.status) as any} size="small" /></TableCell>
                      <TableCell><Typography variant="body2">{formatDate(order.created_at ?? order.createdAt)}</Typography></TableCell>
                      <TableCell align="right">
                        <Tooltip title="Xem chi tiết"><IconButton size="small" onClick={() => navigate(`/admin/orders/${order.id}`)}><ViewIcon /></IconButton></Tooltip>
                        {isCancelableStatus(order.status) && (
                          <Tooltip title="Hủy đơn">
                            <IconButton size="small" color="error" onClick={() => handleCancelOrder(order)}>
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Thao tác khác"><IconButton size="small" onClick={(e) => handleMenuClick(e, order)}><MoreVertIcon /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Typography variant="body2">Hiển thị {orders.length} trên tổng {total} đơn hàng</Typography>
            <Box>
              <Button disabled={page <= 0} onClick={() => setPage(0)}>Đầu</Button>
              <Button disabled={page <= 0} onClick={() => setPage(page - 1)}>Trước</Button>
              <Button disabled>{page + 1}</Button>
              <Button disabled={page >= Math.max(0, Math.ceil(total / PAGE_SIZE) - 1)} onClick={() => setPage(page + 1)}>Sau</Button>
              <Button disabled={page >= Math.max(0, Math.ceil(total / PAGE_SIZE) - 1)} onClick={() => setPage(Math.ceil(total / PAGE_SIZE) - 1)}>Cuối</Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => selectedOrder && handleViewOrder(selectedOrder)}><ViewIcon sx={{ mr: 1 }} /> Xem chi tiết</MenuItem>
        <MenuItem onClick={() => selectedOrder && handleUpdateStatus(selectedOrder)}><EditIcon sx={{ mr: 1 }} /> Cập nhật trạng thái</MenuItem>
        {selectedOrder && isCancelableStatus(selectedOrder.status) && (
          <MenuItem onClick={() => handleCancelOrder(selectedOrder)}>
            <CancelIcon sx={{ mr: 1 }} /> Hủy đơn
          </MenuItem>
        )}
      </Menu>

      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Cập nhật trạng thái đơn hàng</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>Đơn hàng: {selectedOrder?.order_code ?? selectedOrder?.orderCode}</Typography>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Trạng thái mới</InputLabel>
              <Select native value={newStatus} onChange={(e: any) => setNewStatus(e.target.value)} label="Trạng thái mới">
                {ORDER_STATUSES.map(s => (
                  <option key={s} value={s}>{getOrderStatusLabel(s)}</option>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleStatusUpdate} variant="contained">Cập nhật</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrdersList;
