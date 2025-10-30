import React, { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, IconButton } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../../services/user.service';
import type { UserResponse } from '../../../types/auth.types';
import { useSnackbar } from '../../../hooks/useSnackbar';

const UsersList: React.FC = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserResponse[]>([]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const resp = await userService.getAllUsers({ page: 0, size: 50 });
      // userService unwraps ApiResponse.data when possible and returns either a page wrapper or array
      const page = resp?.content ? resp : (Array.isArray(resp) ? { content: resp } : { content: [] });
      setUsers(page.content as UserResponse[]);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      // If backend returned structured ApiErrorResponse, show its message and status
      const serverMsg = err?.message || err?.response?.data?.message || (err?.status_code ? `${err.status_code}` : null);
      const details = err?.errors ? ` (${JSON.stringify(err.errors)})` : '';
      showError('Không tải được danh sách người dùng: ' + (serverMsg || String(err)) + details);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleEdit = (id: number) => navigate(`/admin/users/${id}/edit`);
  const handleDelete = async (id: number) => {
    if (!confirm('Xóa người dùng?')) return;
    try {
      await userService.deleteUser(id);
      showSuccess('Xóa người dùng thành công');
      fetchUsers();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      const serverMsg = err?.message || err?.response?.data?.message || (err?.status_code ? `${err.status_code}` : null);
      const details = err?.errors ? ` (${JSON.stringify(err.errors)})` : '';
      showError('Xóa thất bại: ' + (serverMsg || String(err)) + details);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Quản lý người dùng</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/admin/users/create')}>Tạo người dùng</Button>
      </Box>

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress/></Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Tên đăng nhập</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Vai trò</TableCell>
                    <TableCell align="right">Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.id} hover>
                      <TableCell>{u.id || 'N/A'}</TableCell>
                      <TableCell>{u.username || 'N/A'}</TableCell>
                      <TableCell>{u.email || 'N/A'}</TableCell>
                      <TableCell>{(
                        u.role ? (
                          u.role === 'ADMIN' ? 'Quản trị' : (u.role === 'STAFF' ? 'Nhân viên' : (u.role === 'CUSTOMER' ? 'Khách hàng' : u.role))
                        ) : 'N/A'
                      )}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleEdit(u.id!)}><EditIcon/></IconButton>
                        <IconButton size="small" onClick={() => handleDelete(u.id!)}><DeleteIcon/></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default UsersList;
