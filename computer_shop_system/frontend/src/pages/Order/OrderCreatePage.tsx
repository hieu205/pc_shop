import React, { useEffect, useMemo, useState } from 'react';
import { Container, Typography, Box, Card, CardContent, TextField, Button, Divider, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useSnackbar } from '../../hooks/useSnackbar';
import { cartService } from '../../services/cart.service';
import { api } from '../../services/api';

const OrderCreatePage: React.FC = () => {
  const { items, summary, refreshCart, is_guest_mode } = useCart() as any;
  const { showSuccess, showError } = useSnackbar();
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // If navigated from Build PC, we may have items passed via state or sessionStorage
  const buildPcItems = useMemo(() => {
    const stateItems = (location.state as any)?.items;
    if (Array.isArray(stateItems) && stateItems.length > 0) return stateItems;
    try {
      const persisted = sessionStorage.getItem('build_pc_checkout');
      if (persisted) {
        const parsed = JSON.parse(persisted);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { }
    return null;
  }, [location.state]);

  const buildSubtotal = useMemo(() => {
    return Array.isArray(buildPcItems)
      ? buildPcItems.reduce((sum: number, it: any) => sum + (Number(it.unit_price) * Number(it.quantity || 1)), 0)
      : 0;
  }, [buildPcItems]);

  // Customer/shipping fields
  const [shippingAddress, setShippingAddress] = useState<string>((summary as any)?.shipping_address || '');
  const [shippingPhone, setShippingPhone] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  // Inline form errors for live feedback
  const [formErrors, setFormErrors] = useState<{ customerName?: string; shippingPhone?: string; shippingAddress?: string }>({});

  const [applying, setApplying] = useState(false);
  const [localSummary, setLocalSummary] = useState<any>(summary);
  const [promoDialogOpen, setPromoDialogOpen] = useState(false);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);

  useEffect(() => {
    setLocalSummary(summary);
  }, [summary]);

  // Promotion applying is done via chooser dialog. Promotions are organized by name, not by code.

  const openPromoDialog = async () => {
    setPromoDialogOpen(true);
    if (promotions.length > 0) return;
    setLoadingPromotions(true);
    try {
      const list = await cartService.getActivePromotions();
      setPromotions(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Failed to load promotions', e);
      setPromotions([]);
    } finally {
      setLoadingPromotions(false);
    }
  };

  const handleApplyPromotionFromList = async (promo: any) => {
    setApplying(true);
    try {
      const calc = await cartService.calculateDiscountForPromotion(promo.id, (Array.isArray(buildPcItems) ? buildSubtotal : (summary?.total_amount || 0)));
      if (!calc) throw new Error('Không thể tính toán giảm giá');
      setLocalSummary({
        ...localSummary,
        discount_amount: calc.discount_amount,
        promotion: { id: promo.id, code: promo.code || promo.name, name: promo.name },
        final_amount: calc.final_price
      });
      setPromoDialogOpen(false);
    } catch (e: any) {
      setError(e?.message || 'Áp mã thất bại');
    } finally {
      setApplying(false);
    }
  };

  const handleRemovePromotion = () => {
    setLocalSummary({ ...localSummary, discount_amount: 0, promotion: null, final_amount: localSummary?.total_amount });
  };


  const handleCreateOrder = async () => {
    // Call backend create order endpoint
    try {
      const usingBuildPc = Array.isArray(buildPcItems) && buildPcItems.length > 0;
      // Client-side validation to avoid server 400 for missing required fields
      if (!usingBuildPc && (!items || items.length === 0)) {
        showError('Không thể tạo đơn: giỏ hàng không có sản phẩm');
        return;
      }

      // Reset previous errors and collect new ones
      const errors: { customerName?: string; shippingPhone?: string; shippingAddress?: string } = {};

      // Validate customer name
      if (!customerName || customerName.trim().length === 0) {
        errors.customerName = 'Tên khách hàng không được để trống';
      }

      // Validate shipping phone
      if (!shippingPhone || shippingPhone.trim().length === 0) {
        errors.shippingPhone = 'Số điện thoại giao hàng không được để trống';
      } else if (!/^[0-9]+$/.test(shippingPhone)) {
        errors.shippingPhone = 'Số điện thoại chỉ chứa chữ số';
      }

      // Validate shipping address
      if (!shippingAddress || shippingAddress.trim().length === 0) {
        errors.shippingAddress = 'Địa chỉ giao hàng không được để trống';
      }

      // If any errors collected, set them all so inline errors show simultaneously
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        showError('Vui lòng sửa các lỗi trên form');
        return;
      }

      // Build order payload
      const payload: any = {
        shipping_address: shippingAddress,
        shipping_phone: shippingPhone,
        customer_name: customerName,
        customer_email: customerEmail,
        notes,
      };

      // If a promotion is selected, verify it is still applicable and calculate discount server-side
      if (localSummary.promotion?.id) {
        const promoId = localSummary.promotion.id;
        const subtotal = localSummary?.subtotal || localSummary?.total_amount || summary?.subtotal || 0;
        const calc = await cartService.calculateDiscountForPromotion(promoId, subtotal);
        if (!calc || Number(calc.discount_amount) <= 0) {
          showError('Mã khuyến mãi không hợp lệ hoặc không áp dụng cho đơn hàng này');
          return;
        }
        payload.promotion_id = promoId;
      }

      // If coming from Build PC, rebuild server cart with only selected parts then create from cart
      if (usingBuildPc) {
        if (is_guest_mode) {
          showError('Vui lòng đăng nhập để thanh toán cấu hình');
          navigate('/login', { state: { returnUrl: '/order/create' } });
          return;
        }
        // Rebuild server cart strictly with selected Build PC items
        try { await api.delete('/cart'); } catch { }
        for (const it of buildPcItems) {
          try { await api.post('/cart/items', { product_id: it.product_id, quantity: it.quantity || 1 }); } catch { }
        }
        try { await refreshCart(); } catch { }
      }

      // Backend sẽ lấy userId từ JWT token, không cần truyền vào URL
      const resp = await api.post<any>(`/orders/from-cart`, payload);
      const body = resp && resp.data ? resp.data : resp;
      const created: any = body?.data || body;

      showSuccess('Tạo đơn hàng thành công');
      // Refresh cart state
      try { await refreshCart(); } catch (e) { /* ignore */ }
      // Show confirmation dialog to the customer with options
      try { sessionStorage.removeItem('build_pc_checkout'); } catch { }
      setCreatedOrder(created);
      setSuccessDialogOpen(true);
    } catch (e) {
      console.error('OrderCreatePage: create order error', e);
      // Try to read structured validation errors from backend
      const resp = (e as any)?.response?.data;
      if (resp) {
        // ApiResponse wrapper: { status_code, message, data }
        const msg = resp.message || 'Tạo đơn hàng thất bại';
        const data = resp.data;
        if (Array.isArray(data) && data.length > 0) {
          // Show first validation error or join them
          showError(data.join('; '));
        } else {
          showError(msg);
        }
      } else {
        showError('Tạo đơn hàng thất bại');
      }
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Thanh toán - Tạo đơn hàng</Typography>

      <Box sx={{ display: 'flex', gap: 3 }}>
        <Box sx={{ flex: 2 }}>
          {/* Items list */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6">Items</Typography>
              {items?.length === 0 && <Typography>Không có sản phẩm trong giỏ hàng</Typography>}
              {items?.map((it: any) => (
                <Box key={it.id || it.product?.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                  <Box>
                    <Typography>{it.product?.name || 'Unknown'} x{it.quantity}</Typography>
                    <Typography variant="caption" color="text.secondary">{it.product?.category?.name || ''}</Typography>
                  </Box>
                  <Typography>{((it.total_price) || (it.unit_price * it.quantity)).toLocaleString('vi-VN')} VND</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
          {/* Order items summary */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6">Customer & Shipping</Typography>
              <TextField
                fullWidth
                label="Customer name"
                value={customerName}
                onChange={(e) => {
                  const v = e.target.value;
                  setCustomerName(v);
                  if (formErrors.customerName && v.trim().length > 0) {
                    setFormErrors(prev => ({ ...prev, customerName: undefined }));
                  }
                }}
                error={Boolean(formErrors.customerName)}
                helperText={formErrors.customerName}
                sx={{ mt: 2 }}
              />

              <TextField
                fullWidth
                label="Customer email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                sx={{ mt: 2 }}
              />

              <TextField
                fullWidth
                label="Shipping phone"
                value={shippingPhone}
                onChange={(e) => {
                  const v = e.target.value;
                  // allow only digits
                  if (v === '' || /^[0-9]*$/.test(v)) {
                    setShippingPhone(v);
                    if (formErrors.shippingPhone) {
                      // clear error when becomes digits and non-empty
                      if (v.trim().length > 0) setFormErrors(prev => ({ ...prev, shippingPhone: undefined }));
                    }
                  }
                }}
                error={Boolean(formErrors.shippingPhone)}
                helperText={formErrors.shippingPhone}
                sx={{ mt: 2 }}
              />

              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Shipping address"
                value={shippingAddress}
                onChange={(e) => {
                  const v = e.target.value;
                  setShippingAddress(v);
                  if (formErrors.shippingAddress && v.trim().length > 0) {
                    setFormErrors(prev => ({ ...prev, shippingAddress: undefined }));
                  }
                }}
                error={Boolean(formErrors.shippingAddress)}
                helperText={formErrors.shippingAddress}
                sx={{ mt: 2 }}
              />

              <TextField fullWidth multiline minRows={2} label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} sx={{ mt: 2 }} />
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6">Apply Promotion</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button variant="outlined" onClick={openPromoDialog}>Chọn mã giảm giá</Button>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Order Summary</Typography>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography>Items ({localSummary?.total_quantity || 0})</Typography>
                <Typography>{localSummary?.subtotal?.toLocaleString('vi-VN')} VND</Typography>
              </Box>

              {localSummary?.shipping_cost > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography>Shipping</Typography>
                  <Typography>{localSummary.shipping_cost.toLocaleString('vi-VN')} VND</Typography>
                </Box>
              )}

              {localSummary?.tax_amount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography>Tax</Typography>
                  <Typography>{localSummary.tax_amount.toLocaleString('vi-VN')} VND</Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Show discount only on order page if present */}
              {localSummary?.discount_amount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography>Discount{localSummary.promotion?.code ? ` (${localSummary.promotion.code})` : ''}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography color="success.main">-{localSummary.discount_amount.toLocaleString('vi-VN')} VND</Typography>
                    <Button size="small" onClick={handleRemovePromotion}>Bỏ mã</Button>
                  </Box>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Typography variant="h6">Final</Typography>
                <Typography variant="h6">{(localSummary?.final_amount || localSummary?.total_amount)?.toLocaleString('vi-VN')} VND</Typography>
              </Box>

              <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={handleCreateOrder}>Tạo đơn hàng</Button>
            </CardContent>
          </Card>
        </Box>
      </Box>
      {/* Promotion chooser dialog */}
      <Dialog open={promoDialogOpen} onClose={() => setPromoDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Chọn mã giảm giá</DialogTitle>
        <DialogContent>
          {loadingPromotions ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : (
            <List>
              {promotions.length === 0 && <Typography>Không có mã giảm giá nào</Typography>}
              {promotions.map((p: any) => (
                <ListItem key={p.id} secondaryAction={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" onClick={() => handleApplyPromotionFromList(p)} disabled={applying}>
                      {applying ? <CircularProgress size={18} /> : 'Áp dụng'}
                    </Button>
                  </Box>
                }>
                  <ListItemText primary={`${p.name} ${p.code ? `(${p.code})` : ''}`} secondary={p.description} />
                </ListItem>
              ))}
            </List>
          )}
          {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPromoDialogOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
      {/* Success confirmation dialog */}
      <Dialog open={successDialogOpen} onClose={() => setSuccessDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Tạo đơn hàng thành công</DialogTitle>
        <DialogContent>
          <Typography>Đơn hàng của bạn đã được tạo thành công.</Typography>
          {createdOrder?.id && <Typography sx={{ mt: 1 }}>Order ID: {createdOrder.id}</Typography>}
          {createdOrder?.order_code && <Typography>Order Code: {createdOrder.order_code}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setSuccessDialogOpen(false);
            setTimeout(() => navigate(`/order/${createdOrder?.id}`), 100);
          }}>Xem đơn hàng</Button>
          <Button onClick={() => { setSuccessDialogOpen(false); navigate('/products'); }} autoFocus>Tiếp tục mua sắm</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OrderCreatePage;
