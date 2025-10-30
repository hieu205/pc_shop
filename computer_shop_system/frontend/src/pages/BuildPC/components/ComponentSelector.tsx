import React, { useMemo, useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Stack } from '@mui/material';
import type { SelectedParts } from '../types';
import type { Product } from '../../../types/product.types';
import { useCategories } from '../../../hooks/useQueryHooks';
import { resolveCategoryIdByKey } from '../utils/categoryMap';
import { PartPickerDialog } from './PartPickerDialog';

interface ComponentSelectorProps {
    selectedParts: SelectedParts;
    onSelect: (key: keyof SelectedParts, product: Product | null) => void;
    onRemove: (key: keyof SelectedParts) => void;
}

export const ComponentSelector: React.FC<ComponentSelectorProps> = ({ selectedParts, onSelect, onRemove }) => {
    // Danh sách slot đầy đủ theo PartKey
    const slots: Array<{ key: keyof SelectedParts; label: string }> = [
        { key: 'cpu', label: 'CPU' },
        { key: 'mainboard', label: 'Mainboard' },
        { key: 'ram1', label: 'RAM (Khe 1)' },
        { key: 'ram2', label: 'RAM (Khe 2)' },
        { key: 'ssd1', label: 'SSD (Khe 1)' },
        { key: 'ssd2', label: 'SSD (Khe 2)' },
        { key: 'hdd', label: 'HDD' },
        { key: 'gpu', label: 'GPU' },
        { key: 'psu', label: 'PSU' },
        { key: 'case', label: 'Case' },
        { key: 'cooler_air', label: 'Tản nhiệt khí' },
        { key: 'cooler_water', label: 'Tản nhiệt nước (AIO)' },
        { key: 'case_fan1', label: 'Quạt case (1)' },
        { key: 'case_fan2', label: 'Quạt case (2)' },
    ];

    const { data: categories = [] } = useCategories();
    const [activeKey, setActiveKey] = useState<keyof SelectedParts | null>(null);
    const activeCategoryId = useMemo(() => (activeKey ? resolveCategoryIdByKey(activeKey as any, categories) : null), [activeKey, categories]);

    return (
        <Card variant="outlined">
            <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Chọn linh kiện
                </Typography>
                <Stack spacing={1.5}>
                    {slots.map(s => {
                        const value = selectedParts[s.key];
                        return (
                            <Box key={s.key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{s.label}</Typography>
                                    <Typography variant="body2" color="text.secondary">{value ? `${value.name} - ${value.price.toLocaleString('vi-VN')} ₫` : 'Chưa chọn'}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    {value ? (
                                        <>
                                            <Button size="small" variant="outlined" onClick={() => onRemove(s.key)}>Xóa</Button>
                                            <Button size="small" variant="contained" onClick={() => setActiveKey(s.key)}>Thay</Button>
                                        </>
                                    ) : (
                                        <Button size="small" variant="contained" onClick={() => setActiveKey(s.key)}>Chọn</Button>
                                    )}
                                </Box>
                            </Box>
                        );
                    })}
                </Stack>
            </CardContent>
            <PartPickerDialog
                open={!!activeKey}
                onClose={() => setActiveKey(null)}
                categoryId={activeCategoryId}
                onSelect={(p) => {
                    if (activeKey) onSelect(activeKey, p);
                    setActiveKey(null);
                }}
            />
        </Card>
    );
};
