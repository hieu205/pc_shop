import React from 'react';
import { Box, Card, CardContent, Divider, Stack, Typography, Button } from '@mui/material';
import type { PriceTotals, SelectedParts } from '../types';
import { exportQuotationExcel } from '../utils/excel';

interface Props {
    selectedParts: SelectedParts;
    totals: PriceTotals;
    onRemove: (key: keyof SelectedParts) => void;
    onReset: () => void;
    canExport?: boolean;
    onCheckout?: () => void | Promise<void>;
}

export const PCBuilderSummary: React.FC<Props> = ({ selectedParts, totals, onRemove, onReset, canExport, onCheckout }) => {
    return (
        <Card variant="outlined">
            <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Tóm tắt cấu hình</Typography>
                <Stack spacing={1.25}>
                    {Object.entries(selectedParts).map(([key, p]) => (
                        <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary">{key.toUpperCase()}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2">{p ? p.name : '-'}</Typography>
                                {p && (
                                    <Button size="small" onClick={() => onRemove(key as keyof SelectedParts)}>Xóa</Button>
                                )}
                            </Box>
                        </Box>
                    ))}
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 0.75 }}>
                    <Typography color="text.secondary">Tạm tính</Typography>
                    <Typography>{totals.subtotal.toLocaleString('vi-VN')} ₫</Typography>
                    <Typography color="text.secondary">Khuyến mãi</Typography>
                    <Typography>-{totals.discount.toLocaleString('vi-VN')} ₫</Typography>
                    <Typography color="text.secondary">Thuế (VAT)</Typography>
                    <Typography>{totals.tax.toLocaleString('vi-VN')} ₫</Typography>
                    <Typography sx={{ fontWeight: 700 }}>Tổng</Typography>
                    <Typography sx={{ fontWeight: 700, color: 'primary.main' }}>{totals.total.toLocaleString('vi-VN')} ₫</Typography>
                </Box>

                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Button variant="outlined" color="inherit" onClick={onReset}>Làm mới</Button>
                    <Button variant="outlined" disabled={!canExport} onClick={() => exportQuotationExcel(selectedParts, totals)}>In đơn hàng / Xuất Excel</Button>
                    <Button variant="contained" color="primary" disabled={!canExport} onClick={() => { if (onCheckout) onCheckout(); }}>Mua ngay</Button>
                </Stack>
            </CardContent>
        </Card>
    );
};
