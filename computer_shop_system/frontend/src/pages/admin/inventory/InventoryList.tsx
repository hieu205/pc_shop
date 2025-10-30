import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  
  Paper,
  Alert
} from '@mui/material';
import { Edit as EditIcon, Refresh as RefreshIcon, Warning as WarningIcon } from '@mui/icons-material';
import { inventoryService } from '../../../services/inventory.service';
import { useSnackbar } from '../../../hooks/useSnackbar';

const PAGE_SIZE = 10;

const InventoryList: React.FC = () => {
  const { showError, showSuccess } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [adjustmentData, setAdjustmentData] = useState({ quantityChange: 0, reason: '' });
  const [filters, setFilters] = useState({ status: '', search: '' });

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await inventoryService.getInventory({ page, size: PAGE_SIZE, ...filters });
      setInventory(response.content || []);
      setTotal(response.totalElements || 0);
    } catch (err: any) {
      showError('Không tải được danh sách tồn kho: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, [page, filters]);

  const handleAdjustInventory = (item: any) => { setSelectedItem(item); setAdjustmentData({ quantityChange: 0, reason: '' }); setAdjustDialogOpen(true); };

  const handleAdjustmentSubmit = async () => {
    if (!selectedItem || !adjustmentData.reason.trim()) { showError('Vui lòng nhập lý do điều chỉnh'); return; }
    try {
      // Map UI adjustment shape to backend StockAdjustmentRequest
      const payload = {
        change_type: 'ADJUSTMENT',
        quantity: adjustmentData.quantityChange,
        reason: adjustmentData.reason
      } as any;
      await inventoryService.adjustInventory(selectedItem.productId, payload);
      showSuccess('Điều chỉnh tồn kho thành công');
      setAdjustDialogOpen(false);
      fetchInventory();
    } catch (err: any) { showError('Điều chỉnh thất bại: ' + (err.message || err)); }
  };

  const lowStockItems = inventory.filter(item => item.status === 'LOW_STOCK' || item.status === 'OUT_OF_STOCK');

  const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '-';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Quản lý tồn kho</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchInventory} disabled={loading}>Làm mới</Button>
        </Box>
      </Box>

      {lowStockItems.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}><WarningIcon sx={{ mr: 1 }} /><Typography>Có {lowStockItems.length} sản phẩm sắp hết hàng hoặc hết hàng cần kiểm tra</Typography></Box>
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Bộ lọc</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ minWidth: 220, flex: '1 1 220px' }}>
            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} label="Trạng thái">
                <option value="">Tất cả</option>
                <option value="IN_STOCK">Còn hàng</option>
                <option value="LOW_STOCK">Sắp hết hàng</option>
                <option value="OUT_OF_STOCK">Hết hàng</option>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: '1 1 320px' }}>
            <TextField fullWidth label="Tìm kiếm sản phẩm" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          </Box>
        </Box>
      </Paper>

      <Card>
        <CardContent>
          {loading ? (<Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Sản phẩm</TableCell>
                    <TableCell>Danh mục</TableCell>
                    <TableCell>Tồn kho hiện tại</TableCell>
                    <TableCell>Ngưỡng cảnh báo</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Giá</TableCell>
                    <TableCell>Lần nhập cuối</TableCell>
                    <TableCell align="right">Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventory.map(item => (
                    <TableRow key={item.id} hover>
                      <TableCell><Typography variant="body2" fontWeight="medium">{item.productName}<br/><Typography variant="caption">ID: {item.productId}</Typography></Typography></TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.currentQuantity}</TableCell>
                      <TableCell>{item.lowStockThreshold}</TableCell>
                      <TableCell><Chip label={item.status} size="small" /></TableCell>
                      <TableCell>{formatCurrency(item.price)}</TableCell>
                      <TableCell>{formatDate(item.lastRestocked)}</TableCell>
                      <TableCell align="right"><Tooltip title="Điều chỉnh tồn kho"><IconButton size="small" onClick={() => handleAdjustInventory(item)}><EditIcon /></IconButton></Tooltip></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Typography variant="body2">Hiển thị {inventory.length} trên tổng {total} sản phẩm</Typography>
            <Box>
              <Button disabled={page <= 0} onClick={() => setPage(0)}>Đầu</Button>
              <Button disabled={page <= 0} onClick={() => setPage(page - 1)}>Trước</Button>
              <Button disabled>{page + 1}</Button>
              <Button disabled={page >= Math.max(0, Math.ceil(total / PAGE_SIZE) - 1)} onClick={() => setPage(page + 1)}>Sau</Button>
              <Button disabled={page >= Math.max(0, Math.ceil(total / PAGE_SIZE) - 1)} onClick={() => setPage(Math.ceil(total / PAGE_SIZE) - 1)}>Cuối</Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Dialog open={adjustDialogOpen} onClose={() => setAdjustDialogOpen(false)}>
        <DialogTitle>Điều chỉnh tồn kho</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">Sản phẩm: {selectedItem?.productName}</Typography>
            <Typography variant="body2" color="text.secondary">Tồn kho hiện tại: {selectedItem?.currentQuantity}</Typography>
            <TextField fullWidth label="Số lượng thay đổi" type="number" value={adjustmentData.quantityChange} onChange={(e) => setAdjustmentData({ ...adjustmentData, quantityChange: parseInt(e.target.value) || 0 })} sx={{ mt: 2 }} helperText="Nhập số dương để tăng, âm để giảm" />
            <TextField fullWidth label="Lý do" multiline rows={3} value={adjustmentData.reason} onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })} sx={{ mt: 2 }} required />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleAdjustmentSubmit} variant="contained">Điều chỉnh</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventoryList;
