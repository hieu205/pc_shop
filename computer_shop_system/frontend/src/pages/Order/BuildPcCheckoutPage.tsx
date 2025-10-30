import React, { useEffect, useMemo, useState } from 'react';
import { Container, Typography, Box, Card, CardContent, TextField, Button, Divider, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, Alert } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSnackbar } from '../../hooks/useSnackbar';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { cartService } from '../../services/cart.service';
import { api } from '../../services/api';

type BuildPcCheckoutItem = {
    product_id: number;
    product?: any;
    quantity: number;
    unit_price: number;
    total_price?: number;
};

const BuildPcCheckoutPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { showSuccess, showError } = useSnackbar();
    const { refreshCart } = useCart() as any;
    const { isAuthenticated } = useAuth();

    const [createdOrder, setCreatedOrder] = useState<any | null>(null);
    const [successDialogOpen, setSuccessDialogOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const buildPcItems = useMemo<BuildPcCheckoutItem[] | null>(() => {
        const stateItems = (location.state as any)?.items as BuildPcCheckoutItem[] | undefined;
        if (Array.isArray(stateItems) && stateItems.length > 0) return stateItems;
        try {
            const persisted = sessionStorage.getItem('build_pc_checkout');
            if (persisted) {
                const parsed = JSON.parse(persisted);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed as BuildPcCheckoutItem[];
            }
        } catch { }
        return null;
    }, [location.state]);

    useEffect(() => {
        if (!buildPcItems) {
            setError('Không tìm thấy danh sách linh kiện để thanh toán. Vui lòng chọn lại cấu hình.');
        }
    }, [buildPcItems]);

    const subtotal = useMemo(() => {
        return Array.isArray(buildPcItems)
            ? buildPcItems.reduce((sum, it) => sum + (Number(it.unit_price) * Number(it.quantity || 1)), 0)
            : 0;
    }, [buildPcItems]);

    // Simple summary estimate (client-side)
    const estimatedTax = useMemo(() => Math.round(subtotal * 0.1), [subtotal]);
    const estimatedShipping = useMemo(() => (subtotal >= 1000000 ? 0 : 50000), [subtotal]);

    // Customer/shipping fields
    const [shippingAddress, setShippingAddress] = useState<string>('');
    const [shippingPhone, setShippingPhone] = useState<string>('');
    const [customerName, setCustomerName] = useState<string>('');
    const [customerEmail, setCustomerEmail] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [formErrors, setFormErrors] = useState<{ customerName?: string; shippingPhone?: string; shippingAddress?: string }>({});

    // Promotion selection
    const [promoDialogOpen, setPromoDialogOpen] = useState(false);
    const [promotions, setPromotions] = useState<any[]>([]);
    const [loadingPromotions, setLoadingPromotions] = useState(false);
    const [applying, setApplying] = useState(false);
    const [selectedPromotion, setSelectedPromotion] = useState<{ id: number; code?: string; name?: string } | null>(null);
    const [discountAmount, setDiscountAmount] = useState<number>(0);

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
            const calc = await cartService.calculateDiscountForPromotion(promo.id, subtotal);
            if (!calc) throw new Error('Không thể tính toán giảm giá');
            setSelectedPromotion({ id: promo.id, code: promo.code || promo.name, name: promo.name });
            setDiscountAmount(Number(calc.discount_amount || 0));
            setPromoDialogOpen(false);
        } catch (e: any) {
            setError(e?.message || 'Áp mã thất bại');
        } finally {
            setApplying(false);
        }
    };

    const handleRemovePromotion = () => {
        setSelectedPromotion(null);
        setDiscountAmount(0);
    };

    const validateForm = (): boolean => {
        const errors: { customerName?: string; shippingPhone?: string; shippingAddress?: string } = {};
        if (!customerName || customerName.trim().length === 0) {
            errors.customerName = 'Tên khách hàng không được để trống';
        }
        if (!shippingPhone || shippingPhone.trim().length === 0) {
            errors.shippingPhone = 'Số điện thoại giao hàng không được để trống';
        } else if (!/^[0-9]+$/.test(shippingPhone)) {
            errors.shippingPhone = 'Số điện thoại chỉ chứa chữ số';
        }
        if (!shippingAddress || shippingAddress.trim().length === 0) {
            errors.shippingAddress = 'Địa chỉ giao hàng không được để trống';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const restoreCartSnapshot = async (snapshot: Array<{ product_id: number; quantity: number }>) => {
        try {
            await api.delete('/cart');
        } catch { }
        for (const it of snapshot) {
            try {
                await api.post('/cart/items', { product_id: it.product_id, quantity: it.quantity });
            } catch { }
        }
        try { await refreshCart(); } catch { }
    };

    const handleCreateOrder = async () => {
        if (!buildPcItems || buildPcItems.length === 0) {
            showError('Không có sản phẩm nào để thanh toán');
            return;
        }
        if (!isAuthenticated) {
            showError('Vui lòng đăng nhập để thanh toán cấu hình');
            navigate('/login', { state: { returnUrl: '/order/build-pc' } });
            return;
        }
        if (!validateForm()) {
            showError('Vui lòng sửa các lỗi trên form');
            return;
        }

        // Snapshot current cart
        let snapshot: Array<{ product_id: number; quantity: number }> = [];
        try {
            const current = await cartService.getCart();
            snapshot = (current.items || []).map((it: any) => ({ product_id: it.product?.id, quantity: it.quantity }));
        } catch { }

        try {
            // Replace server cart with Build PC items
            try { await api.delete('/cart'); } catch { }
            for (const it of buildPcItems) {
                await api.post('/cart/items', { product_id: it.product_id, quantity: it.quantity || 1 });
            }
            try { await refreshCart(); } catch { }

            const payload: any = {
                shipping_address: shippingAddress,
                shipping_phone: shippingPhone,
                customer_name: customerName,
                customer_email: customerEmail,
                notes,
            };
            if (selectedPromotion?.id) payload.promotion_id = selectedPromotion.id;

            const resp = await api.post<any>(`/orders/from-cart`, payload);
            const body = resp && resp.data ? resp.data : resp;
            const created: any = body?.data || body;

            showSuccess('Tạo đơn hàng thành công');
            try { sessionStorage.removeItem('build_pc_checkout'); } catch { }
            setCreatedOrder(created);
            setSuccessDialogOpen(true);
        } catch (e: any) {
            console.error('BuildPcCheckout: create order error', e);
            const resp = e?.response?.data;
            setError(resp?.message || 'Tạo đơn hàng thất bại');
            showError(resp?.message || 'Tạo đơn hàng thất bại');
        } finally {
            // Restore original cart regardless of success/failure
            if (Array.isArray(snapshot) && snapshot.length >= 0) {
                await restoreCartSnapshot(snapshot);
            }
        }
    };

    const finalAmount = useMemo(() => {
        const total = subtotal + estimatedTax + estimatedShipping - (discountAmount || 0);
        return Math.max(total, 0);
    }, [subtotal, estimatedTax, estimatedShipping, discountAmount]);

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>Thanh toán cấu hình Build PC</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box sx={{ display: 'flex', gap: 3 }}>
                <Box sx={{ flex: 2 }}>
                    {/* Build PC items list */}
                    <Card sx={{ mb: 2 }}>
                        <CardContent>
                            <Typography variant="h6">Danh sách linh kiện</Typography>
                            {!buildPcItems || buildPcItems.length === 0 ? (
                                <Typography sx={{ mt: 1 }}>Không có sản phẩm. <Button size="small" onClick={() => navigate('/build-pc')}>Quay lại Build PC</Button></Typography>
                            ) : (
                                buildPcItems.map((it, idx) => (
                                    <Box key={`${it.product_id}-${idx}`} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                                        <Box>
                                            <Typography>{it.product?.name || `Sản phẩm #${it.product_id}`} x{it.quantity}</Typography>
                                            <Typography variant="caption" color="text.secondary">ID: {it.product_id}</Typography>
                                        </Box>
                                        <Typography>{(Number(it.unit_price) * Number(it.quantity || 1)).toLocaleString('vi-VN')} VND</Typography>
                                    </Box>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Customer & shipping */}
                    <Card sx={{ mb: 2 }}>
                        <CardContent>
                            <Typography variant="h6">Thông tin khách hàng & giao hàng</Typography>
                            <TextField
                                fullWidth
                                label="Tên khách hàng"
                                value={customerName}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setCustomerName(v);
                                    if (formErrors.customerName && v.trim().length > 0) setFormErrors(prev => ({ ...prev, customerName: undefined }));
                                }}
                                error={Boolean(formErrors.customerName)}
                                helperText={formErrors.customerName}
                                sx={{ mt: 2 }}
                            />

                            <TextField
                                fullWidth
                                label="Email"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                sx={{ mt: 2 }}
                            />

                            <TextField
                                fullWidth
                                label="Số điện thoại giao hàng"
                                value={shippingPhone}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    if (v === '' || /^[0-9]*$/.test(v)) {
                                        setShippingPhone(v);
                                        if (formErrors.shippingPhone && v.trim().length > 0) setFormErrors(prev => ({ ...prev, shippingPhone: undefined }));
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
                                label="Địa chỉ giao hàng"
                                value={shippingAddress}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setShippingAddress(v);
                                    if (formErrors.shippingAddress && v.trim().length > 0) setFormErrors(prev => ({ ...prev, shippingAddress: undefined }));
                                }}
                                error={Boolean(formErrors.shippingAddress)}
                                helperText={formErrors.shippingAddress}
                                sx={{ mt: 2 }}
                            />

                            <TextField fullWidth multiline minRows={2} label="Ghi chú" value={notes} onChange={(e) => setNotes(e.target.value)} sx={{ mt: 2 }} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <Typography variant="h6">Áp dụng khuyến mãi</Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                <Button variant="outlined" onClick={openPromoDialog}>Chọn mã giảm giá</Button>
                                {selectedPromotion && <Button size="small" onClick={handleRemovePromotion}>Bỏ mã ({selectedPromotion.code || selectedPromotion.name})</Button>}
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                <Box sx={{ flex: 1 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">Tổng kết đơn hàng (ước tính)</Typography>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                <Typography>Tạm tính</Typography>
                                <Typography>{subtotal.toLocaleString('vi-VN')} VND</Typography>
                            </Box>

                            {estimatedShipping > 0 && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                    <Typography>Phí vận chuyển</Typography>
                                    <Typography>{estimatedShipping.toLocaleString('vi-VN')} VND</Typography>
                                </Box>
                            )}

                            {estimatedTax > 0 && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                    <Typography>Thuế</Typography>
                                    <Typography>{estimatedTax.toLocaleString('vi-VN')} VND</Typography>
                                </Box>
                            )}

                            {discountAmount > 0 && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                    <Typography>Giảm giá{selectedPromotion?.code ? ` (${selectedPromotion.code})` : ''}</Typography>
                                    <Typography color="success.main">- {discountAmount.toLocaleString('vi-VN')} VND</Typography>
                                </Box>
                            )}

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                <Typography variant="h6">Tổng cuối</Typography>
                                <Typography variant="h6">{finalAmount.toLocaleString('vi-VN')} VND</Typography>
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

            {/* Success dialog */}
            <Dialog open={successDialogOpen} onClose={() => setSuccessDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>Tạo đơn hàng thành công</DialogTitle>
                <DialogContent>
                    <Typography>Đơn hàng của bạn đã được tạo thành công.</Typography>
                    {createdOrder?.id && <Typography sx={{ mt: 1 }}>Order ID: {createdOrder.id}</Typography>}
                    {createdOrder?.order_code && <Typography>Mã đơn hàng: {createdOrder.order_code}</Typography>}
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

export default BuildPcCheckoutPage;
