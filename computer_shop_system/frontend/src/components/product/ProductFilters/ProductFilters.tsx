/**
 * 🔍 PRODUCT FILTERS COMPONENT - Computer Shop E-commerce (Optimized)
 * - Category (checkbox)
 * - Price range (debounced, numeric inputs)
 * - Brand (multi-select)
 * - Persisted accordion states
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Box, Typography, Accordion, AccordionSummary, AccordionDetails,
  Slider, TextField, Button,
  Stack, Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ClearIcon from '@mui/icons-material/Clear';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ProductFilter } from '../../../types/product.types';

// ===== TYPES =====
export interface ProductFiltersProps {
  filters: ProductFilter;
  maxPrice: number;
  onFiltersChange: (filters: ProductFilter) => void;
  onReset: () => void;
  className?: string;
  sx?: SxProps<Theme>;
}

// ===== UTILS =====
const CACHE_KEY = 'pf_expanded_panels_v1';

// Chuẩn hoá format tiền tệ (vi-VN)
const fmt = new Intl.NumberFormat('vi-VN');
const formatPrice = (price: number): string => `${fmt.format(Math.max(0, Math.floor(price)))}đ`;

// Ràng buộc min/max
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// ===== MAIN =====
export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  maxPrice,
  onFiltersChange,
  onReset,
  className,
  sx,
}) => {
  // Khởi tạo panel mở/đóng từ cache
  const [expandedPanels, setExpandedPanels] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr;
      }
    } catch {}
    return ['category', 'price', 'brand'];
  });

  useEffect(() => {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(expandedPanels)); } catch {}
  }, [expandedPanels]);

  // ===== HANDLERS =====
  const handlePanelToggle = useCallback((panel: string) => {
    setExpandedPanels(prev => prev.includes(panel) ? prev.filter(p => p !== panel) : [...prev, panel]);
  }, []);

  // Debounce slider: gom sự kiện kéo nhanh
  const priceDebounceRef = useRef<number | null>(null);
  const commitPrice = useCallback((min: number, max: number) => {
    onFiltersChange({
      ...filters,
      min_price: min > 0 ? min : undefined,
      max_price: max < maxPrice ? max : undefined,
    });
  }, [filters, maxPrice, onFiltersChange]);

  const handlePriceChange = useCallback((
    _e: Event | React.SyntheticEvent,
    v: number | number[]
  ) => {
    const [min, max] = v as number[];
    if (priceDebounceRef.current) window.clearTimeout(priceDebounceRef.current);
    priceDebounceRef.current = window.setTimeout(() => commitPrice(min, max), 180);
  }, [commitPrice]);

  const handlePriceCommitted = useCallback((
    _e: Event | React.SyntheticEvent,
    v: number | number[]
  ) => {
    const [min, max] = v as number[];
    // đảm bảo commit lần cuối khi thả chuột
    commitPrice(min, max);
  }, [commitPrice]);

  // Nhập số thủ công
  const priceValue: [number, number] = useMemo(() => [
    filters.min_price ?? 0,
    filters.max_price ?? maxPrice,
  ], [filters.min_price, filters.max_price, maxPrice]);

  const onMinInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = Number(e.target.value || 0);
    const min = clamp(raw, 0, priceValue[1]);
    commitPrice(min, priceValue[1]);
  }, [commitPrice, priceValue]);

  const onMaxInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = Number(e.target.value || 0);
    const max = clamp(raw, priceValue[0], maxPrice);
    commitPrice(priceValue[0], max);
  }, [commitPrice, priceValue, maxPrice]);

  // Brand: chuẩn hoá/sắp xếp để UX dễ chọn
  // brands & categories removed: this filter only exposes price range to user

  // Tính số filter đang áp dụng (CHỈ đếm khoảng giá)
  const activeFiltersCount = useMemo(() => {
    let c = 0;
    if (filters.min_price != null) c += 1;
    if (filters.max_price != null && filters.max_price !== maxPrice) c += 1;
    return c;
  }, [filters, maxPrice]);

  // Mark ticks cho slider (memo)
  const sliderMarks = useMemo(() => ([
    { value: 0, label: '0đ' },
    { value: Math.floor(maxPrice / 2), label: formatPrice(Math.floor(maxPrice / 2)) },
    { value: maxPrice, label: formatPrice(maxPrice) },
  ]), [maxPrice]);

  return (
    <Box className={className} sx={{ p: 2, ...sx }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography component="div" variant="h6" fontWeight={600}>
          Bộ lọc
          {activeFiltersCount > 0 && <Chip label={activeFiltersCount} size="small" color="primary" sx={{ ml: 1 }} />}
        </Typography>
        <Button size="small" startIcon={<ClearIcon />} onClick={onReset} disabled={activeFiltersCount === 0}>
          Xóa khoảng giá
        </Button>
      </Box>

      <Stack spacing={1}>
        {/* Price only */}
        <Accordion expanded={expandedPanels.includes('price')} onChange={() => handlePanelToggle('price')} disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography component="div" fontWeight={500}>
              Khoảng giá
              {(filters.min_price != null || (filters.max_price != null && filters.max_price !== maxPrice)) && (
                <Chip label="Đã chọn" size="small" color="primary" sx={{ ml: 1 }} />
              )}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ px: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {formatPrice(priceValue[0])} – {formatPrice(priceValue[1])}
              </Typography>

              {/* Inputs số để gõ nhanh */}
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <TextField
                  label="Tối thiểu"
                  size="small"
                  type="number"
                  inputProps={{ min: 0, max: priceValue[1], step: 10000 }}
                  value={priceValue[0]}
                  onChange={onMinInput}
                />
                <TextField
                  label="Tối đa"
                  size="small"
                  type="number"
                  inputProps={{ min: priceValue[0], max: maxPrice, step: 10000 }}
                  value={priceValue[1]}
                  onChange={onMaxInput}
                />
              </Stack>

              <Slider
                value={priceValue}
                onChange={handlePriceChange}
                onChangeCommitted={handlePriceCommitted}
                valueLabelDisplay="auto"
                valueLabelFormat={formatPrice}
                min={0}
                max={maxPrice}
                step={100000}
                marks={sliderMarks}
              />
            </Box>
          </AccordionDetails>
        </Accordion>
      </Stack>
    </Box>
  );
};

export default ProductFilters;
