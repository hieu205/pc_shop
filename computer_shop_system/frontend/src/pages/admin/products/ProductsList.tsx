import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CircularProgress, 
  IconButton, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Typography, 
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Switch,
  FormControlLabel,
  Grid,
  InputAdornment,
  Paper
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { Checkbox } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { productService } from '../../../services/product.service';
import { categoryService } from '../../../services/category.service';
import type { Product, Category } from '../../../types/product.types';
import { useSnackbar } from '../../../hooks/useSnackbar';
import { useDebounce } from '../../../hooks/useDebounce';

const PAGE_SIZE = 24;

const ProductsList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showError, showSuccess } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Search and filter states
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'created_at' | 'updated_at'>('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Bulk operations
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<'activate' | 'deactivate' | 'delete'>('activate');
  
  // Debounced search
  const debouncedSearchKeyword = useDebounce(searchKeyword, 500);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: any = { 
        page: page - 1, 
        size: PAGE_SIZE,
        sort: `${sortBy},${sortOrder}`
      };

      // Add search keyword if provided
      if (debouncedSearchKeyword.trim()) {
        params.keyword = debouncedSearchKeyword.trim();
      }

      // If a category is selected, prefer category-specific endpoint for accurate server filtering
      if (selectedCategory) {
        const resp = await productService.getProductsByCategory(Number(selectedCategory), {
          page: params.page,
          size: params.size,
          sort: params.sort,
        });
        setProducts(resp.content || []);
        setTotal(resp.totalElements || 0);
        return; // early return to avoid calling general endpoint below
      }

      // Add status filter
      if (statusFilter !== 'all') {
        params.isActive = statusFilter === 'active';
      }

      // Add stock filter
      if (stockFilter !== 'all') {
        params.stockFilter = stockFilter;
      }

      const resp = await productService.getAllProducts(params);
      setProducts(resp.content || []);
      setTotal(resp.totalElements || 0);
    } catch (err: any) {
      const serverMsg = err?.message || err?.response?.data?.message || (err?.status_code ? `${err.status_code}` : null);
      const details = err?.errors ? ` (${JSON.stringify(err.errors)})` : '';
      showError('Không tải được sản phẩm: ' + (serverMsg || String(err)) + details);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const cats = await categoryService.getActiveCategories();
      setCategories(cats);
    } catch (err: any) {
      console.warn('Could not load categories:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Sync selectedCategory with URL query (?categoryId=123)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const idStr = params.get('category') || params.get('categoryId') || params.get('category_id') || '';
    const idNum = Number(idStr);
    if (idStr === '') {
      setSelectedCategory('');
    } else if (!Number.isNaN(idNum)) {
      setSelectedCategory(idNum);
    }
  }, [location.search]);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearchKeyword, selectedCategory, statusFilter, stockFilter, sortBy, sortOrder]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchKeyword, selectedCategory, statusFilter, stockFilter, sortBy, sortOrder]);

  const handleEdit = (id?: number) => navigate(`/admin/products/${id}/edit`);
  const handleView = (id?: number) => navigate(`/products/${id}`);
  
  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này không?')) return;
    try {
      await productService.deleteProduct(id);
      showSuccess('Xóa sản phẩm thành công');
      fetchProducts();
    } catch (err: any) {
      const serverMsg = err?.message || err?.response?.data?.message || (err?.status_code ? `${err.status_code}` : null);
      const details = err?.errors ? ` (${JSON.stringify(err.errors)})` : '';
      showError('Xóa sản phẩm thất bại: ' + (serverMsg || String(err)) + details);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      // Create minimal payload for status update
      const updatePayload = {
        name: product.name,
        description: product.description || '',
        price: product.price,
        stock_quantity: product.quantity,
        low_stock_threshold: product.low_stock_threshold || 10,
        category_id: product.category?.id || 0,
        specifications: product.specifications || {},
        is_active: !product.is_active
      };
      
      await productService.updateProduct(product.id!, updatePayload);
      showSuccess(`Sản phẩm đã được ${product.is_active ? 'ẩn' : 'hiển thị'}`);
      fetchProducts();
    } catch (err: any) {
      showError('Cập nhật trạng thái thất bại: ' + (err.message || err));
    }
  };

  const clearFilters = () => {
    setSearchKeyword('');
    setSelectedCategory('');
    setStatusFilter('all');
    setStockFilter('all');
    setSortBy('updated_at');
    setSortOrder('desc');
  };

  const getStockStatus = (product: Product) => {
    if (product.quantity === 0) return { label: 'Hết hàng', color: 'error' as const };
    if (product.is_low_stock) return { label: 'Sắp hết', color: 'warning' as const };
    return { label: 'Còn hàng', color: 'success' as const };
  };

  const handleSelectProduct = (productId: number, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(products.map(p => p.id!));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleBulkAction = async () => {
    if (selectedProducts.length === 0) {
      showError('Vui lòng chọn ít nhất một sản phẩm');
      return;
    }

    const actionText = bulkAction === 'delete' ? 'xóa' : 
                      bulkAction === 'activate' ? 'kích hoạt' : 'vô hiệu hóa';
    
    if (!confirm(`Bạn có chắc muốn ${actionText} ${selectedProducts.length} sản phẩm đã chọn?`)) {
      return;
    }

    try {
      if (bulkAction === 'delete') {
        // Delete multiple products
        await Promise.all(selectedProducts.map(id => productService.deleteProduct(id)));
        showSuccess(`Đã xóa ${selectedProducts.length} sản phẩm thành công`);
      } else {
        // Update status for multiple products
        const isActive = bulkAction === 'activate';
        await Promise.all(selectedProducts.map(id => {
          const product = products.find(p => p.id === id);
          if (!product) return Promise.resolve();
          
          const updatePayload = {
            name: product.name,
            description: product.description || '',
            price: product.price,
            stock_quantity: product.quantity,
            low_stock_threshold: product.low_stock_threshold || 10,
            category_id: product.category?.id || 0,
            specifications: product.specifications || {},
            is_active: isActive
          };
          
          return productService.updateProduct(id, updatePayload);
        }));
        showSuccess(`Đã ${actionText} ${selectedProducts.length} sản phẩm thành công`);
      }
      
      setSelectedProducts([]);
      fetchProducts();
    } catch (err: any) {
      showError(`Lỗi khi ${actionText} sản phẩm: ` + (err.message || err));
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Quản lý sản phẩm</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/admin/products/create')}>
          Tạo sản phẩm
        </Button>
      </Box>

      {/* Category chips removed to avoid clutter; category filter is provided via Sidebar links */}

      {/* Search and Filter Section */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              placeholder="Tìm kiếm sản phẩm..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Danh mục</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as number | '')}
                label="Danh mục"
              >
                <MenuItem value="">Tất cả</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                label="Trạng thái"
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="active">Đang bán</MenuItem>
                <MenuItem value="inactive">Ngừng bán</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Tồn kho</InputLabel>
              <Select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
                label="Tồn kho"
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="in_stock">Còn hàng</MenuItem>
                <MenuItem value="low_stock">Sắp hết</MenuItem>
                <MenuItem value="out_of_stock">Hết hàng</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={clearFilters}
                size="small"
              >
                Xóa lọc
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Sort Options */}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Sắp xếp theo</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                label="Sắp xếp theo"
              >
                <MenuItem value="name">Tên sản phẩm</MenuItem>
                <MenuItem value="price">Giá</MenuItem>
                <MenuItem value="created_at">Ngày tạo</MenuItem>
                <MenuItem value="updated_at">Ngày cập nhật</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Thứ tự</InputLabel>
              <Select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                label="Thứ tự"
              >
                <MenuItem value="asc">Tăng dần</MenuItem>
                <MenuItem value="desc">Giảm dần</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Bulk Operations */}
      {selectedProducts.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body1">
                Đã chọn {selectedProducts.length} sản phẩm
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: 'inherit' }}>Hành động</InputLabel>
                <Select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value as any)}
                  label="Hành động"
                  sx={{ color: 'inherit' }}
                >
                  <MenuItem value="activate">Kích hoạt</MenuItem>
                  <MenuItem value="deactivate">Vô hiệu hóa</MenuItem>
                  <MenuItem value="delete">Xóa</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleBulkAction}
                  size="small"
                  sx={{ bgcolor: 'white', color: 'primary.main' }}
                >
                  Thực hiện
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setSelectedProducts([])}
                  size="small"
                  sx={{ borderColor: 'white', color: 'white' }}
                >
                  Hủy
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

  <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedProducts.length === products.length && products.length > 0}
                        indeterminate={selectedProducts.length > 0 && selectedProducts.length < products.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>ID</TableCell>
                    <TableCell>Tên sản phẩm</TableCell>
                    <TableCell>Danh mục</TableCell>
                    <TableCell>Giá (VNĐ)</TableCell>
                    <TableCell>Tồn kho</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Ngày cập nhật</TableCell>
                    <TableCell align="right">Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((p) => {
                    const stockStatus = getStockStatus(p);
                    return (
                      <TableRow key={p.id} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedProducts.includes(p.id!)}
                            onChange={(e) => handleSelectProduct(p.id!, e.target.checked)}
                          />
                        </TableCell>
                        <TableCell>{p.id}</TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {p.name}
                            </Typography>
                            {p.description && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {p.description}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={p.category?.name || 'Chưa phân loại'} 
                            size="small" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {p.price?.toLocaleString('vi-VN')} ₫
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
                              {p.quantity ?? 0}
                            </Typography>
                            <Chip 
                              label={stockStatus.label} 
                              size="small" 
                              color={stockStatus.color}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={p.is_active}
                                onChange={() => handleToggleStatus(p)}
                                size="small"
                              />
                            }
                            label={p.is_active ? 'Đang bán' : 'Ngừng bán'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {new Date(p.updated_at).toLocaleDateString('vi-VN')}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Xem chi tiết">
                              <IconButton size="small" onClick={() => handleView(p.id!)}>
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Chỉnh sửa">
                              <IconButton size="small" onClick={() => handleEdit(p.id!)}>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Xóa">
                              <IconButton size="small" onClick={() => handleDelete(p.id!)}>
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Hiển thị {products.length} sản phẩm trên tổng {total} sản phẩm
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Trang {page} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                disabled={page <= 1} 
                onClick={() => setPage(1)}
              >
                Đầu
              </Button>
              <Button 
                variant="outlined" 
                size="small"
                disabled={page <= 1} 
                onClick={() => setPage(page - 1)}
              >
                Trước
              </Button>
              <Button 
                variant="outlined" 
                size="small"
                disabled={page >= Math.max(1, Math.ceil(total / PAGE_SIZE))} 
                onClick={() => setPage(page + 1)}
              >
                Sau
              </Button>
              <Button 
                variant="outlined" 
                size="small"
                disabled={page >= Math.max(1, Math.ceil(total / PAGE_SIZE))} 
                onClick={() => setPage(Math.ceil(total / PAGE_SIZE))}
              >
                Cuối
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProductsList;
