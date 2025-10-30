import React, { useMemo, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, List, ListItemButton, ListItemText, CircularProgress, Box, FormControl, InputLabel, Select, MenuItem, Stack, Chip, useMediaQuery, useTheme, Typography } from '@mui/material';
import type { Product } from '../../../types/product.types';
import { useProducts } from '../../../hooks/useQueryHooks';
import { productService } from '../../../services/product.service';
import { buildImageUrl } from '../../../utils/urlHelpers';

interface Props {
    open: boolean;
    onClose: () => void;
    onSelect: (product: Product) => void;
    categoryId: number | null;
}

export const PartPickerDialog: React.FC<Props> = ({ open, onClose, onSelect, categoryId }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(12);
    const [sort, setSort] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
    const [minPrice, setMinPrice] = useState<number | ''>('');
    const [maxPrice, setMaxPrice] = useState<number | ''>('');
    const [brands, setBrands] = useState<string[]>([]);

    const filters = useMemo(
        () => ({
            category_ids: categoryId ? [categoryId] : undefined,
            search: search || undefined,
            min_price: minPrice === '' ? undefined : Number(minPrice),
            max_price: maxPrice === '' ? undefined : Number(maxPrice),
            brands: brands.length ? brands : undefined,
            sort,
        }),
        [categoryId, search, minPrice, maxPrice, brands, sort]
    );

    const { data, isLoading } = useProducts(filters as any, page, pageSize, { enabled: open && !!categoryId });
    const productsRaw = data?.content || [];

    // Extract brands from current result to build filter list (frontend-only)
    const availableBrands = useMemo(() => productService.extractBrandsFromProducts(productsRaw), [productsRaw]);

    // Client-side fallback for brand and price filters and price sorting (defensive)
    const productsFilteredSorted = useMemo(() => {
        let arr = productsRaw;
        // Always constrain to name search on the client as well (defensive), case-insensitive contains match
        if (search && search.trim().length > 0) {
            const q = search.trim().toLowerCase();
            arr = arr.filter(p => (p.name || '').toLowerCase().includes(q));
        }
        if (brands.length || minPrice !== '' || maxPrice !== '') {
            arr = arr.filter(p => {
                const withinMin = minPrice === '' ? true : p.price >= Number(minPrice);
                const withinMax = maxPrice === '' ? true : p.price <= Number(maxPrice);
                const brandOk = brands.length ? (p.specifications?.brand ? brands.includes(p.specifications.brand) : false) : true;
                return withinMin && withinMax && brandOk;
            });
        }
        if (sort === 'price_asc') arr = [...arr].sort((a, b) => a.price - b.price);
        else if (sort === 'price_desc') arr = [...arr].sort((a, b) => b.price - a.price);
        return arr;
    }, [productsRaw, search, brands, minPrice, maxPrice, sort]);

    const titleId = 'part-picker-title';

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="md"
            fullScreen={isMobile}
            aria-labelledby={titleId}
            keepMounted
        >
            <DialogTitle id={titleId}>Chọn sản phẩm</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{ mb: 2 }}>
                    <TextField
                        fullWidth
                        placeholder="Tìm theo tên..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        autoFocus
                        inputProps={{ 'aria-label': 'Ô tìm kiếm sản phẩm' }}
                    />

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <FormControl fullWidth>
                            <InputLabel id="sort-label">Sắp xếp</InputLabel>
                            <Select
                                labelId="sort-label"
                                label="Sắp xếp"
                                value={sort}
                                onChange={(e) => { setSort(e.target.value as any); setPage(1); }}
                            >
                                <MenuItem value="newest">Mới nhất</MenuItem>
                                <MenuItem value="price_asc">Giá tăng dần</MenuItem>
                                <MenuItem value="price_desc">Giá giảm dần</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            type="number"
                            label="Giá tối thiểu"
                            value={minPrice}
                            onChange={(e) => { setMinPrice(e.target.value === '' ? '' : Number(e.target.value)); setPage(1); }}
                            inputProps={{ min: 0, 'aria-label': 'Giá tối thiểu' }}
                            fullWidth
                        />
                        <TextField
                            type="number"
                            label="Giá tối đa"
                            value={maxPrice}
                            onChange={(e) => { setMaxPrice(e.target.value === '' ? '' : Number(e.target.value)); setPage(1); }}
                            inputProps={{ min: 0, 'aria-label': 'Giá tối đa' }}
                            fullWidth
                        />
                    </Stack>

                    {availableBrands.length > 0 && (
                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} aria-label="Lọc theo thương hiệu">
                            {availableBrands.map((b) => (
                                <Chip
                                    key={b}
                                    label={b}
                                    color={brands.includes(b) ? 'primary' : 'default'}
                                    variant={brands.includes(b) ? 'filled' : 'outlined'}
                                    onClick={() => setBrands(prev => { const next = prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]; setPage(1); return next; })}
                                    aria-pressed={brands.includes(b)}
                                />
                            ))}
                            {brands.length > 0 && (
                                <Button size="small" onClick={() => { setBrands([]); setPage(1); }}>Xóa lọc</Button>
                            )}
                        </Stack>
                    )}
                </Stack>

                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress aria-label="Đang tải sản phẩm" />
                    </Box>
                ) : (
                    <List aria-label="Danh sách sản phẩm">
                        {productsFilteredSorted.map((p) => {
                            const primaryPath = p.image_url
                                || p.images?.find(i => i.is_primary)?.file_path
                                || (p.images && p.images.length > 0 ? p.images[0].file_path : undefined);
                            return (
                                <ListItemButton key={p.id} onClick={() => onSelect(p)} aria-label={`Chọn ${p.name}`}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                        <Box sx={{ width: 56, height: 56, borderRadius: 1, overflow: 'hidden', border: theme => `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper', flexShrink: 0 }}>
                                            {primaryPath ? (
                                                <img
                                                    src={buildImageUrl(primaryPath)}
                                                    alt={p.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = buildImageUrl('/images/products/placeholder.jpg'); }}
                                                />
                                            ) : (
                                                <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1 }}>
                                                    <Typography variant="caption" color="text.secondary" align="center">
                                                        Hiện tại chưa có ảnh
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                            <ListItemText
                                                primary={p.name}
                                                secondary={`${p.price.toLocaleString('vi-VN')} ₫`}
                                                primaryTypographyProps={{ noWrap: true }}
                                                secondaryTypographyProps={{ noWrap: true }}
                                            />
                                        </Box>
                                    </Box>
                                </ListItemButton>
                            );
                        })}
                    </List>
                )}
            </DialogContent>
            <DialogActions>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 'auto', pl: 1 }}>
                    <Button
                        variant="outlined"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={isLoading || page <= 1}
                        aria-label="Trang trước"
                    >
                        Trước
                    </Button>
                    <Box aria-live="polite">Trang {page} / {Math.max(1, data?.totalPages || 1)}</Box>
                    <Button
                        variant="outlined"
                        onClick={() => setPage((p) => Math.min((data?.totalPages || 1), p + 1))}
                        disabled={isLoading || page >= (data?.totalPages || 1)}
                        aria-label="Trang sau"
                    >
                        Sau
                    </Button>
                </Box>
                <Button onClick={onClose} aria-label="Đóng chọn linh kiện">Đóng</Button>
            </DialogActions>
        </Dialog>
    );
};
