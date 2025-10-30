import React, { useEffect, useState } from 'react';
import { Box, Button, Paper, TextField, Typography, CircularProgress, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { promotionService } from '../../../services/promotion.service';
import { useSnackbar } from '../../../hooks/useSnackbar';

const PromotionForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showError, showSuccess } = useSnackbar();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    name: '', description: '', code: '', discount_type: 'PERCENTAGE', discount_value: 0, min_order_value: 0, max_discount: 0, usage_limit: 0, start_date: '', end_date: '', is_active: true
  });

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      (async () => {
        try {
          const data = await promotionService.getPromotionById(Number(id));
          // Map backend response (snake_case or camelCase) into form state (snake_case keys used in form)
          const mapped = {
            name: data.name ?? (data as any)?.title ?? '',
            description: data.description ?? (data as any)?.desc ?? '',
            code: (data as any).code ?? (data as any).promotion_code ?? '',
            discount_type: (data as any).discount_type ?? (data as any).discountType ?? 'PERCENTAGE',
            discount_value: Number((data as any).discount_value ?? (data as any).discountValue ?? 0),
            min_order_value: Number((data as any).min_order_value ?? (data as any).minOrderValue ?? 0),
            max_discount: Number((data as any).max_discount ?? (data as any).maxDiscount ?? 0),
            usage_limit: Number((data as any).usage_limit ?? (data as any).usageLimit ?? 0),
            start_date: (data as any).start_date ?? (data as any).startDate ?? '',
            end_date: (data as any).end_date ?? (data as any).endDate ?? '',
            is_active: (data as any).is_active ?? (data as any).isActive ?? true,
          };
          setForm(mapped);
        } catch (e) {
          // If cannot load by id, fallback to listing (no-op)
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [id, isEdit]);

  const handleChange = (k: string) => (e: any) => setForm((s:any) => ({ ...s, [k]: e.target.value }));

  const normalizeDateForInput = (v: string) => {
    if (!v) return '';
    // Accept forms: YYYY-MM-DD, YYYY-MM-DDTHH:mm, YYYY-MM-DDTHH:mm:ss
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v}T00:00`;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return v;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(v)) return v.slice(0,16);
    try {
      const d = new Date(v);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0,16);
    } catch {}
    return '';
  };

  const normalizeDateForBackend = (v: string, isEnd = false) => {
    if (!v) return '';
    // Accept: YYYY-MM-DD, YYYY-MM-DDTHH:mm, YYYY-MM-DDTHH:mm:ss
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return isEnd ? `${v}T23:59:59` : `${v}T00:00:00`;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return `${v}:00`;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(v)) return v;
    try {
      const d = new Date(v);
      if (!isNaN(d.getTime())) return d.toISOString().replace(/\.\d{3}Z$/, '');
    } catch {}
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Client-side validation to match backend requirements
    if (!form.name?.trim()) {
      showError('Vui lòng nhập tên khuyến mãi');
      return;
    }
    const startForBackend = normalizeDateForBackend(form.start_date, false);
    const endForBackend = normalizeDateForBackend(form.end_date, true);
    if (!startForBackend || !endForBackend) {
      showError('Vui lòng chọn ngày bắt đầu và ngày kết thúc');
      return;
    }
    // Check end > start
    try {
      const sd = new Date(startForBackend);
      const ed = new Date(endForBackend);
      if (!(ed.getTime() > sd.getTime())) {
        showError('Ngày kết thúc phải sau ngày bắt đầu');
        return;
      }
    } catch {}
    // Validate discount value
    const dv = Number(form.discount_value ?? 0);
    if (form.discount_type === 'PERCENTAGE') {
      if (isNaN(dv) || dv <= 0 || dv > 100) {
        showError('Giá trị phần trăm phải trong khoảng 1-100');
        return;
      }
    } else {
      if (isNaN(dv) || dv <= 0) {
        showError('Giá trị giảm cố định phải lớn hơn 0');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        start_date: startForBackend,
        end_date: endForBackend,
      };
      if (isEdit && id) {
        await promotionService.updatePromotion(Number(id), payload);
        showSuccess('Cập nhật khuyến mãi thành công');
      } else {
        await promotionService.createPromotion(payload);
        showSuccess('Tạo khuyến mãi thành công');
      }
      navigate('/admin/promotions');
    } catch (err: any) {
      showError('Lỗi khi lưu khuyến mãi: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress/></Box>;

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6">{isEdit ? 'Chỉnh sửa khuyến mãi' : 'Tạo khuyến mãi'}</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <TextField label="Tên" fullWidth value={form.name} onChange={handleChange('name')} required />
          <TextField label="Mã" fullWidth value={form.code} onChange={handleChange('code')} />
          <FormControl fullWidth>
            <InputLabel>Loại giảm</InputLabel>
            <Select value={form.discount_type} label="Loại giảm" onChange={handleChange('discount_type')}>
              <MenuItem value="PERCENTAGE">Phần trăm</MenuItem>
              <MenuItem value="FIXED_AMOUNT">Cố định</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Giá trị" type="number" fullWidth value={form.discount_value} onChange={handleChange('discount_value')} />
          <TextField label="Giá trị tối thiểu" type="number" fullWidth value={form.min_order_value} onChange={handleChange('min_order_value')} />
          <TextField label="Giảm tối đa (VND)" type="number" fullWidth value={form.max_discount} onChange={handleChange('max_discount')} />
          <TextField
            label="Ngày bắt đầu"
            type="datetime-local"
            fullWidth
            value={normalizeDateForInput(form.start_date)}
            onChange={e => setForm((s:any) => ({ ...s, start_date: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            label="Ngày kết thúc"
            type="datetime-local"
            fullWidth
            value={normalizeDateForInput(form.end_date)}
            onChange={e => setForm((s:any) => ({ ...s, end_date: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField label="Mô tả" fullWidth multiline rows={3} value={form.description} onChange={handleChange('description')} sx={{ gridColumn: '1 / -1' }} />
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</Button>
          <Button variant="outlined" onClick={() => navigate('/admin/promotions')}>Hủy</Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default PromotionForm;
