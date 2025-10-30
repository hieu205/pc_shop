import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Typography, Paper, List, ListItem, ListItemText, Divider, CircularProgress,
  Alert, Button, Stack, Chip, Select
} from '@mui/material';
import type { ChipProps } from '@mui/material';
import { ORDER_STATUSES } from '../../types/order.types';
import { getOrderStatusColor as colorOf, getOrderStatusLabel as labelOf, isCancelableStatus } from '../../utils/orderStatus';
import { api } from '../../services/api';
import { orderService } from '../../services/order.service';
import { useAuth } from '../../hooks/useAuth';
import { useSnackbar } from '../../hooks/useSnackbar';

type OrderItem = {
  id: number;
  product_id?: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
};

type NormalizedOrder = {
  id: number;
  order_code?: string;
  customer_name?: string;
  customer_email?: string;
  shipping_address?: string;
  shipping_phone?: string;
  notes?: string;
  status?: string;
  total_amount?: number;
  discount_amount?: number;
  final_amount?: number;
  created_at?: string;
  promotion_code?: string | null;
  promotion_name?: string | null;
  promotion_id?: number | null;
  order_items: OrderItem[];
};

const normalizeOrder = (payload: any): NormalizedOrder => ({
  id: payload.id,
  order_code: payload.order_code ?? payload.orderCode,
  customer_name: payload.customer_name ?? payload.customerName,
  customer_email: payload.customer_email ?? payload.customerEmail,
  shipping_address: payload.shipping_address ?? payload.shippingAddress,
  shipping_phone: payload.shipping_phone ?? payload.shippingPhone,
  notes: payload.notes ?? undefined,
  status: payload.status ?? undefined,
  total_amount: payload.total_amount ?? payload.totalAmount ?? payload.total ?? 0,
  discount_amount: payload.discount_amount ?? payload.discountAmount ?? 0,
  final_amount:
    payload.final_amount ?? payload.finalAmount ?? payload.total_amount ?? payload.totalAmount ?? payload.total ?? 0,
  created_at: payload.created_at ?? payload.createdAt ?? undefined,
  promotion_code: payload.promotion?.code ?? payload.promotion_code ?? null,
  promotion_name: payload.promotion?.name ?? payload.promotion_name ?? null,
  promotion_id: payload.promotion?.id ?? payload.promotion_id ?? null,
  order_items: (payload.order_items ?? payload.orderItems ?? payload.items ?? []).map((it: any) => ({
    id: it.id,
    product_id: it.product_id ?? it.productId ?? it.product_id,
    product_name: it.product_name ?? it.productName ?? it.name ?? it.product_name,
    quantity: it.quantity ?? it.qty ?? 0,
    unit_price: it.unit_price ?? it.unitPrice ?? it.price ?? 0,
    total_price: it.total_price ?? it.totalPrice ?? (Number(it.quantity ?? 0) * Number(it.price ?? it.unit_price ?? 0)),
  })) as OrderItem[],
});

const getStatusColor = (s?: string): ChipProps['color'] => colorOf(s);

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useSnackbar();
  const { canManageOrders } = useAuth();

  const [order, setOrder] = useState<NormalizedOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const currency = useMemo(() => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }), []);
  const fmt = (n?: number) => currency.format(Number(n ?? 0));

  const fetchOrder = useCallback(async (signal?: AbortSignal) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await api.get<any>(`/orders/${id}`, { signal });
      console.debug('OrderDetail Raw resp:', resp);
      if (!resp) {
        throw new Error('No response received');
      }

      // Robust unwrap logic similar to OrderHistoryPanel
      let payload: any = null;
      const anyResp: any = resp;
      if (anyResp.data && typeof anyResp.data === 'object' && !Array.isArray(anyResp.data)) {
        // ApiResponse wrapper: { message, data: order, status_code }
        payload = anyResp.data;
      } else {
        // Raw order object
        payload = anyResp;
      }

      console.debug('OrderDetail Payload:', payload);
      if (!payload || typeof payload !== 'object') {
        throw new Error('Invalid order data received');
      }

      const normalized = normalizeOrder(payload);
      console.debug('OrderDetail Normalized order:', normalized);
      setOrder(normalized);
    } catch (e: any) {
      if (e?.name !== 'CanceledError' && e?.message !== 'canceled') {
        console.error('OrderDetail Fetch error:', e);
        setError(e?.message || 'Không thể tải chi tiết đơn hàng');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();
    fetchOrder(controller.signal);
    return () => controller.abort();
  }, [fetchOrder]);

  const cancelOrder = useCallback(async () => {
    if (!id) return;
    // Xác nhận từ người dùng trước khi hủy
    const confirmed = window.confirm('Bạn có chắc muốn hủy đơn hàng này?');
    if (!confirmed) return;
    try {
      // Theo API_TESTING_GUIDE: PATCH /api/v1/orders/{id}/cancel
      await orderService.cancelOrder(Number(id));
      showSuccess('Đơn hàng đã được hủy');
      await fetchOrder(); // reload để cập nhật trạng thái & tổng tiền
    } catch (err: any) {
      // Hiển thị chi tiết lỗi nếu backend trả về message cụ thể
      const msg = err?.message || (err?.data?.message) || 'Hủy đơn hàng thất bại';
      showError(msg);
    }
  }, [id, fetchOrder, showSuccess, showError]);

  const [updating, setUpdating] = useState<boolean>(false);
  const [nextStatus, setNextStatus] = useState<string>(ORDER_STATUSES[0]);
  useEffect(() => {
    setNextStatus(order?.status || ORDER_STATUSES[0]);
  }, [order?.status]);

  const handleUpdateStatus = useCallback(async () => {
    if (!id) return;
    const statusToSend = (nextStatus || ORDER_STATUSES[0]).toUpperCase();
    try {
      setUpdating(true);
      await orderService.updateOrderStatus(Number(id), statusToSend);
      showSuccess('Cập nhật trạng thái đơn hàng thành công');
      await fetchOrder();
    } catch (err: any) {
      const msg = err?.message || (err?.data?.message) || 'Cập nhật trạng thái thất bại';
      showError(msg);
    } finally {
      setUpdating(false);
    }
  }, [id, nextStatus, fetchOrder, showSuccess, showError]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!order) return <Typography>Không tìm thấy đơn hàng</Typography>;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 4 }}>
      <Paper sx={{ width: '100%', maxWidth: 1100, p: { xs: 2, sm: 4 }, mx: 2 }} elevation={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">
            Chi tiết đơn hàng {order.order_code ? `#${order.order_code}` : `#${order.id}`}
          </Typography>
          <Button variant="outlined" onClick={() => navigate(-1)}>Quay lại</Button>
        </Box>

        {/* Thông tin khách hàng */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1">Thông tin khách hàng</Typography>
          <Stack spacing={0.5} sx={{ mt: 1 }}>
            <Typography><strong>Tên người nhận:</strong> {order.customer_name ?? '-'}</Typography>
            <Typography><strong>Email:</strong> {order.customer_email ?? '-'}</Typography>
            <Typography><strong>Điện thoại:</strong> {order.shipping_phone ?? '-'}</Typography>
            <Typography><strong>Địa chỉ nhận hàng:</strong> {order.shipping_address ?? '-'}</Typography>
            {order.notes && <Typography><strong>Ghi chú:</strong> {order.notes}</Typography>}
          </Stack>
        </Paper>

        {/* Danh sách sản phẩm */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1">Sản phẩm</Typography>
          <List>
            {order.order_items.map((it) => (
              <React.Fragment key={it.id}>
                <ListItem
                  secondaryAction={
                    it.product_id ? (
                      <Button component={RouterLink} to={`/product/${it.product_id}`} size="small">
                        Xem
                      </Button>
                    ) : null
                  }
                >
                  <ListItemText
                    primary={it.product_name}
                    secondary={`${it.quantity} x ${fmt(it.unit_price)} = ${fmt(it.total_price)}`}
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </Paper>

        {/* Tổng quan & hành động */}
        <Paper sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1">Tổng quan</Typography>

              <Typography variant="body2" sx={{ mt: 1 }}>
                <Box component="span" sx={{ fontWeight: 600 }}>Tổng hàng:</Box>{' '}
                <Box component="span">{fmt(order.total_amount)}</Box>
              </Typography>

              <Typography variant="body2" sx={{ mt: 0.5 }}>
                <Box component="span" sx={{ fontWeight: 600 }}>Giảm giá:</Box>{' '}
                <Box component="span">
                  {fmt(order.discount_amount)}
                  {order.promotion_name ? ` - ${order.promotion_name}` : ''}
                </Box>
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 700, mt: 1 }}>
                Thanh toán: {fmt(order.final_amount ?? order.total_amount)}
              </Typography>

              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>Trạng thái</Typography>
                <Chip label={labelOf(order.status)} color={getStatusColor(order.status)} />
              </Box>

              <Typography variant="body2" sx={{ mt: 1 }}>
                Ngày tạo: {order.created_at ? new Date(order.created_at).toLocaleString('vi-VN') : '-'}
              </Typography>

              {order.promotion_code && (
                <Box mt={1}>
                  <Chip
                    label={
                      order.promotion_name
                        ? `${order.promotion_name} (${order.promotion_code})`
                        : order.promotion_code
                    }
                    color="primary"
                  />
                </Box>
              )}
            </Box>

            <Box sx={{ width: { xs: '100%', sm: '35%' } }}>
              <Box display="flex" flexDirection="column" gap={1} alignItems="flex-end">
                <Button
                  variant="contained"
                  color="error"
                  disabled={!isCancelableStatus(order.status)}
                  onClick={cancelOrder}
                >
                  Hủy đơn hàng
                </Button>
                {canManageOrders && (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%', justifyContent: 'flex-end' }}>
                    <Select
                      native
                      value={nextStatus}
                      onChange={(e: any) => setNextStatus(e.target.value)}
                      sx={{ minWidth: 180 }}
                      disabled={updating}
                    >
                      {ORDER_STATUSES.map(s => (
                        <option key={s} value={s}>{labelOf(s)}</option>
                      ))}
                    </Select>
                    <Button variant="contained" onClick={handleUpdateStatus} disabled={updating}>
                      {updating ? 'Đang cập nhật...' : 'Cập nhật trạng thái'}
                    </Button>
                  </Box>
                )}
                <Button variant="outlined" onClick={() => navigate(-1)}>Quay lại</Button>
              </Box>
            </Box>
          </Stack>
        </Paper>
      </Paper>
    </Box>
  );
};

export default OrderDetailPage;
