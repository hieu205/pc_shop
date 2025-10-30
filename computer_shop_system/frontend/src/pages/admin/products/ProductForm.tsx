import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Paper, 
  Typography, 
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  Card,
  CardMedia,
  IconButton,
  Alert,
  Chip,
  Stack
} from '@mui/material';
import { 
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { productService } from '../../../services/product.service';
import { categoryService } from '../../../services/category.service';
import type { Product, Category } from '../../../types/product.types';
import { useSnackbar } from '../../../hooks/useSnackbar';

const ProductForm: React.FC = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showError, showSuccess } = useSnackbar();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<Partial<Product>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<Array<{ id?: number; file_path: string; is_primary: boolean; file?: File }>>([]);
  const [uploadingImages, _setUploadingImages] = useState(false);
  const [specifications, setSpecifications] = useState<Array<{ key: string; value: string }>>([]);

  useEffect(() => {
    const load = async () => {
      // Load categories
      try { 
        const cats = await categoryService.getActiveCategories();
        setCategories(cats);
      } catch (e) { 
        console.warn('Could not load categories:', e);
      }

      if (isEdit && id) {
        setLoading(true);
        try {
          const p = await productService.getProductById(Number(id));
          setProduct({
            ...p,
            quantity: p.quantity || 0
          } as Partial<Product>);
          
          // Load existing images
          if (p.images && p.images.length > 0) {
            setImages(p.images.map(img => ({
              id: img.id,
              file_path: img.file_path,
              is_primary: img.is_primary
            })));
          }

          // Load specifications
          if (p.specifications) {
            const specs = Object.entries(p.specifications).map(([key, value]) => ({
              key,
              value: String(value)
            }));
            setSpecifications(specs);
          }
        } catch (err: any) {
          showError('Không tải được sản phẩm: ' + (err.message || err));
        } finally { setLoading(false); }
      }
    };
    load();
  }, [id, isEdit, showError]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages = Array.from(files).map(file => ({
      file_path: URL.createObjectURL(file), // Temporary URL for preview
      is_primary: images.length === 0, // First image is primary by default
      file: file
    }));

    setImages(prev => [...prev, ...newImages]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSetPrimaryImage = (index: number) => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      is_primary: i === index
    })));
  };

  const handleAddSpecification = () => {
    setSpecifications(prev => [...prev, { key: '', value: '' }]);
  };

  const handleUpdateSpecification = (index: number, field: 'key' | 'value', value: string) => {
    setSpecifications(prev => prev.map((spec, i) => 
      i === index ? { ...spec, [field]: value } : spec
    ));
  };

  const handleRemoveSpecification = (index: number) => {
    setSpecifications(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Convert specifications array to object
      const specsObject = specifications.reduce((acc, spec) => {
        if (spec.key.trim() && spec.value.trim()) {
          acc[spec.key.trim()] = spec.value.trim();
        }
        return acc;
      }, {} as Record<string, string>);

      // Ensure backend receives a non-null integer quantity. Some backend endpoints
      // expect `quantity` while others use `stock_quantity`. Send both to be safe.
      const qty = Number(product.quantity ?? 0);
      const payload = {
        name: product.name || '',
        description: product.description || '',
        price: Number(product.price || 0),
        // include both fields so backend won't see null for `quantity`
        quantity: qty,
        stock_quantity: qty,
        low_stock_threshold: Number(product.low_stock_threshold ?? 10),
        category_id: Number((product.category as any)?.id || 0),
        specifications: specsObject,
        is_active: product.is_active !== undefined ? product.is_active : true,
      } as any;

      if (isEdit && id) {
        await productService.updateProduct(Number(id), payload);
        showSuccess('Cập nhật thành công');
      } else {
        const imageFiles = images
          .filter((img) => !!img.file)
          .map((img) => img.file!) as File[];
        const primaryImageIndex = Math.max(0, images.findIndex((img) => img.is_primary));

        await productService.createProduct(payload, { images: imageFiles, primaryImageIndex });
        showSuccess('Tạo sản phẩm thành công');
      }
      navigate('/admin/products');
    } catch (err: any) {
      showError('Lỗi khi lưu sản phẩm: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6">{isEdit ? 'Chỉnh sửa sản phẩm' : 'Tạo sản phẩm'}</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" gutterBottom>
              Thông tin cơ bản
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField 
              fullWidth 
              label="Tên sản phẩm" 
              value={product.name || ''} 
              onChange={e => setProduct({ ...product, name: e.target.value })} 
              required 
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth required>
              <InputLabel>Danh mục</InputLabel>
              <Select
                value={(product.category as any)?.id || ''}
                onChange={e => setProduct({ ...product, category: { id: Number(e.target.value) } as any })}
                label="Danh mục"
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField 
              fullWidth 
              label="Giá (VNĐ)" 
              type="number" 
              value={product.price ?? ''} 
              onChange={e => setProduct({ ...product, price: Number(e.target.value) })} 
              required
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField 
              fullWidth 
              label="Số lượng tồn kho" 
              type="number" 
              value={product.quantity ?? ''} 
              onChange={e => setProduct({ ...product, quantity: Number(e.target.value) })} 
              required
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField 
              fullWidth 
              label="Ngưỡng cảnh báo tồn kho" 
              type="number" 
              value={product.low_stock_threshold ?? 10} 
              onChange={e => setProduct({ ...product, low_stock_threshold: Number(e.target.value) })} 
              helperText="Số lượng tối thiểu để cảnh báo sắp hết hàng"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Trạng thái sản phẩm</InputLabel>
              <Select
                value={product.is_active !== undefined ? String(product.is_active) : 'true'}
                onChange={e => setProduct({ ...product, is_active: (e.target.value === 'true') })}
                label="Trạng thái sản phẩm"
              >
                <MenuItem value={'true'}>Đang bán</MenuItem>
                <MenuItem value={'false'}>Ngừng bán</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12 }}>
            <TextField 
              fullWidth 
              multiline 
              minRows={4} 
              label="Mô tả sản phẩm" 
              value={product.description || ''} 
              onChange={e => setProduct({ ...product, description: e.target.value })} 
            />
          </Grid>
        </Grid>

        {/* Image Management Section */}
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" gutterBottom>
              Hình ảnh sản phẩm
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          {/* Upload Section */}
          <Grid size={{ xs: 12 }}>
            <Box sx={{ mb: 2 }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="image-upload"
                multiple
                type="file"
                onChange={handleImageUpload}
              />
              <label htmlFor="image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                  disabled={uploadingImages}
                >
                  {uploadingImages ? 'Đang tải lên...' : 'Chọn hình ảnh'}
                </Button>
              </label>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Chọn nhiều hình ảnh cùng lúc. Hình đầu tiên sẽ là hình chính.
              </Typography>
            </Box>
          </Grid>

          {/* Image Preview Grid */}
          {images.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
                {images.map((image, index) => (
                  <Card key={index} sx={{ width: 150, position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="120"
                      image={image.file_path}
                      alt={`Product image ${index + 1}`}
                      sx={{ objectFit: 'cover' }}
                    />
                    <Box sx={{ p: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip
                          label={image.is_primary ? 'Hình chính' : 'Hình phụ'}
                          size="small"
                          color={image.is_primary ? 'primary' : 'default'}
                          icon={image.is_primary ? <StarIcon /> : <StarBorderIcon />}
                        />
                        <Box>
                          {!image.is_primary && (
                            <IconButton
                              size="small"
                              onClick={() => handleSetPrimaryImage(index)}
                              title="Đặt làm hình chính"
                            >
                              <StarBorderIcon />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveImage(index)}
                            title="Xóa hình"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  </Card>
                ))}
              </Stack>
            </Grid>
          )}

          {images.length === 0 && (
            <Grid size={{ xs: 12 }}>
              <Alert severity="info">
                Chưa có hình ảnh nào. Hãy tải lên ít nhất một hình ảnh cho sản phẩm.
              </Alert>
            </Grid>
          )}
        </Grid>

        {/* Specifications Section */}
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" gutterBottom>
              Thông số kỹ thuật
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                onClick={handleAddSpecification}
                startIcon={<AddIcon />}
              >
                Thêm thông số
              </Button>
        </Box>
          </Grid>

          {specifications.map((spec, index) => (
            <Grid size={{ xs: 12 }} key={index}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  label="Tên thông số"
                  value={spec.key}
                  onChange={(e) => handleUpdateSpecification(index, 'key', e.target.value)}
                  placeholder="Ví dụ: CPU, RAM, Ổ cứng..."
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Giá trị"
                  value={spec.value}
                  onChange={(e) => handleUpdateSpecification(index, 'value', e.target.value)}
                  placeholder="Ví dụ: Intel i7, 16GB, SSD 512GB..."
                  sx={{ flex: 1 }}
                />
                <IconButton
                  onClick={() => handleRemoveSpecification(index)}
                  color="error"
                  title="Xóa thông số"
                >
                  <DeleteIcon />
                </IconButton>
        </Box>
            </Grid>
          ))}

          {specifications.length === 0 && (
            <Grid size={{ xs: 12 }}>
              <Alert severity="info">
                Chưa có thông số kỹ thuật nào. Hãy thêm các thông số như CPU, RAM, ổ cứng, v.v.
              </Alert>
            </Grid>
          )}
        </Grid>

        <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Tạo sản phẩm')}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/admin/products')}>
            Hủy
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default ProductForm;
