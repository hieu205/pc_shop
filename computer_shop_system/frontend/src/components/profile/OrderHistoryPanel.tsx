import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Box, Typography, List, ListItem, ListItemButton, ListItemText, CircularProgress,
  Alert, IconButton, Collapse, Divider, Link, Paper, Chip, Stack
} from '@mui/material';
import type { ChipProps } from '@mui/material';
import { getOrderStatusColor as colorOf, getOrderStatusLabel as labelOf } from '../../utils/orderStatus';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Link as RouterLink } from 'react-router-dom';

type OrderItem = {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
};

type OrderSummary = {
  id: number;
  order_code?: string;
  status?: string;
  total_amount: number;
  final_amount?: number;
  discount_amount?: number;
  promotion_code?: string;
  created_at?: string;
  order_items?: OrderItem[];
};

const getStatusColor = (s?: string): ChipProps['color'] => colorOf(s);

const OrderHistoryPanel: React.FC = () => {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [openMap, setOpenMap] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const vnd = useMemo(() => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }), []);
  const fmtVnd = useCallback((n?: number) => vnd.format(Number(n ?? 0)), [vnd]);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const load = async () => {
      if (import.meta.env.DEV) console.log('OrderHistoryPanel load: starting');
      setLoading(true);
      setError(null);
      try {
        if (import.meta.env.DEV) console.log('OrderHistoryPanel load: calling api.get');
        const resp = await api.get<any>('/orders/my-orders', { signal: controller.signal });
        // Debug: log raw response to help diagnose shape issues
        if (import.meta.env.DEV) console.debug('OrderHistoryPanel: raw response', resp);
        if (!mounted) return;

        // Normalize response shapes:
        // - Axios full response where response.data is ApiResponse -> resp.data.data or resp.data
        // - ApiResponse wrapper returned directly -> resp.data
        // - Raw payload returned directly -> resp
        // Normalize / unwrap common response shapes from backend
        // Possible shapes we've seen:
        // 1) { message, data: { content: [...] }, status_code }
        // 2) axios response where resp.data is (1)
        // 3) raw payload array
        let payload: any = null;

        const anyResp: any = resp;
        if (anyResp == null) {
          payload = null;
        } else if (Array.isArray(anyResp)) {
          payload = anyResp;
        } else if (anyResp.content) {
          // Already a Page object
          payload = anyResp;
        } else if (anyResp.data && anyResp.data.content) {
          payload = anyResp.data;
        } else if (anyResp.data && Array.isArray(anyResp.data)) {
          payload = { content: anyResp.data };
        } else if (anyResp.data) {
          // resp.data might already be the page object
          payload = anyResp.data;
        } else if (anyResp.orders) {
          payload = { content: anyResp.orders };
        } else if (anyResp.data && anyResp.data.orders) {
          payload = { content: anyResp.data.orders };
        } else {
          // Last resort: treat resp as payload or wrap in content
          payload = anyResp;
        }

        if (import.meta.env.DEV) console.debug('OrderHistoryPanel: normalized payload', payload);

        const content = payload?.content ?? payload?.orders ?? (Array.isArray(payload) ? payload : undefined) ?? [];

        if (import.meta.env.DEV) console.debug('OrderHistoryPanel: content array', content);

        const list: OrderSummary[] = (Array.isArray(content) ? content : []).map((o: any) => {
          const orderCode = o.order_code ?? o.orderCode ?? o.order_number ?? o.orderNumber ?? o.order_no ?? o.orderNo ?? o.id ?? '';
          const promotionCode = o.promotion?.code ?? o.promotion_code ?? o.promotionCode ?? o.promotion?.name ?? null;
          const discountAmount = o.discount_amount ?? o.discountAmount ?? o.discount ?? null;
          const items = o.order_items ?? o.orderItems ?? o.items ?? o.orderDetails ?? [];
          return {
            id: o.id,
            order_code: orderCode,
            status: o.status ?? o.order_status ?? o.state,
            total_amount: o.final_amount ?? o.total_amount ?? o.total ?? 0,
            final_amount: o.final_amount ?? o.total_amount ?? o.total ?? 0,
            discount_amount: discountAmount,
            promotion_code: promotionCode,
            created_at: o.created_at ?? o.createdAt ?? o.order_date ?? o.createdDate,
            order_items: Array.isArray(items) ? items : [],
          };
        });

        if (import.meta.env.DEV) console.debug('OrderHistoryPanel: normalized orders list', list);

        setOrders(list);
        if (import.meta.env.DEV) console.log('OrderHistoryPanel load: orders set, length', list.length);
      } catch (err: any) {
        if (err?.name !== 'CanceledError' && err?.message !== 'canceled') {
          if (import.meta.env.DEV) console.error('OrderHistoryPanel load: error', err);
          setError(err?.message || 'Không thể tải lịch sử đơn hàng');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (import.meta.env.DEV) console.log('OrderHistoryPanel useEffect: user?.id', user?.id, 'token exists', !!token);
    if (user?.id || token) {
      if (import.meta.env.DEV) console.log('OrderHistoryPanel useEffect: calling load');
      load();
    }
    return () => { mounted = false; controller.abort(); };
  }, [user?.id]);

  const toggle = (id: number) => setOpenMap((m) => ({ ...m, [id]: !m[id] }));

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!orders.length) return <Typography>Chưa có đơn hàng nào</Typography>;

  return (
    <Box>
      <Typography variant="h6" gutterBottom> Lịch sử đơn hàng </Typography>
      <List>
        {orders.map((o) => (
          <Paper key={o.id} sx={{ mb: 1, p: 1 }} elevation={1}>
            <ListItem
              secondaryAction={
                <IconButton edge="end" onClick={(e) => { e.stopPropagation(); toggle(o.id); }} aria-label="mở rộng">
                  {openMap[o.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              }
            >
              <ListItemButton component={RouterLink} to={`/order/${o.id}`}>
                <ListItemText
                  disableTypography
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle1" component="span">#{o.order_code ?? o.id}</Typography>
                      <Chip label={labelOf(o.status) || 'UNKNOWN'} size="small" color={getStatusColor(o.status)} />
                    </Stack>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" component="p">Tổng: {fmtVnd(o.total_amount)}</Typography>
                      <Typography variant="caption" color="text.secondary" component="p">
                        {o.created_at ? new Date(o.created_at).toLocaleString('vi-VN') : ''}
                        {o.promotion_code ? ` • Mã giảm: ${o.promotion_code}` : ''}
                        {o.discount_amount ? ` • Giảm: ${fmtVnd(o.discount_amount)}` : ''}
                      </Typography>
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>

            <Collapse in={!!openMap[o.id]} timeout="auto" unmountOnExit>
              <Divider />
              <List>
                {(o.order_items || []).map((it) => (
                  <ListItem key={it.id} sx={{ pl: 4 }}>
                    <ListItemText
                      primary={
                        <Link component={RouterLink} to={`/product/${it.product_id}`} underline="hover">
                          {it.product_name}
                        </Link>
                      }
                      secondary={`${it.quantity} x ${fmtVnd(it.unit_price)} = ${fmtVnd(it.total_price)}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </Paper>
        ))}
      </List>
    </Box>
  );
};

export default OrderHistoryPanel;
