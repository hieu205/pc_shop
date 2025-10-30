import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  useTheme,
  Collapse,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import ComputerIcon from '@mui/icons-material/Computer';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import PowerSettingsIcon from '@mui/icons-material/PowerSettingsNew';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import type { Category } from '../../types/product.types';
import { categoryService } from '../../services/category.service';
import { useAppSelector, useAppDispatch } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import { useNavigate, useLocation } from 'react-router-dom';
import type { AuthState } from '../../types/auth.types';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant?: 'permanent' | 'persistent' | 'temporary';
  anchor?: 'left' | 'right';
}

interface SidebarItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  roles?: string[];
  children?: SidebarItem[];
}

const SIDEBAR_WIDTH = 280;

export const Sidebar: React.FC<SidebarProps> = ({
  open,
  onClose,
  variant = 'temporary',
  anchor = 'left',
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  
  const { user } = useAppSelector((state) => state.auth) as AuthState;
  const [catItems, setCatItems] = React.useState<SidebarItem[]>([]);
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  // Parse single role string to array format  
  const userRoles = user?.role ? [user.role] : [];
  const hasRole = (roles?: string[]) => {
    if (!roles || roles.length === 0) return true;
    return roles.some(role => userRoles.includes(role));
  };

  const mapRoleLabel = (r?: string) => {
    if (!r) return 'Không có vai trò';
    const up = String(r).toUpperCase();
    switch (up) {
      case 'ADMIN': return 'Quản trị';
      case 'STAFF': return 'Nhân viên';
      case 'CUSTOMER': return 'Khách hàng';
      default: return up;
    }
  };

  // Debug: measure approximate size of sidebar payload and render time to detect heavy renders
  React.useEffect(() => {
    try {
      const t0 = performance.now();
      // rough size estimate
      const approxSize = JSON.stringify(sidebarItems).length;
      const t1 = performance.now();
      if (import.meta.env.DEV) {
        // log timing and size info useful to trace freezes
        // eslint-disable-next-line no-console
        console.debug('[Sidebar] approxPayloadBytes=', approxSize, 'serializeMs=', (t1 - t0).toFixed(2));
      }
      // If size is huge, warn (but don't mutate)
      if (approxSize > 200 * 1024 && import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('[Sidebar] Large sidebar payload detected; consider trimming server response or lazy-loading items');
      }
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[Sidebar] size measurement failed', err);
    }
  }, []);

  // Build dynamic category children for Products from backend categories
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cats: Category[] = await categoryService.getActiveCategories();
        if (!mounted) return;
        const toIcon = (c: Category) => {
          const key = (c.slug || c.name || '').toLowerCase();
          if (key.includes('cpu')) return <ComputerIcon />;
          if (key.includes('vga') || key.includes('gpu') || key.includes('graphics')) return <GraphicEqIcon />;
          if (key.includes('ram') || key.includes('memory')) return <MemoryIcon />;
          if (key.includes('main') || key.includes('board') || key.includes('mb')) return <StorageIcon />;
          if (key.includes('psu') || key.includes('power')) return <PowerSettingsIcon />;
          return <CategoryIcon />;
        };
        const children: SidebarItem[] = cats.slice(0, 20).map((c) => ({
          text: c.name,
          icon: toIcon(c),
          // navigate with query param for ProductsList to consume (align with public ProductsPage: category=<id>)
          path: `/admin/products?category=${c.id}`,
        }));
        setCatItems(children);
      } catch (err) {
        if (import.meta.env.DEV) console.warn('[Sidebar] Load categories failed:', err);
        // keep empty children on failure
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Auto-expand the group that matches current location (e.g., products)
  React.useEffect(() => {
    const groupsToCheck = ['/admin/products'];
    setExpanded((prev) => {
      const next = { ...prev };
      groupsToCheck.forEach((p) => {
        if (location.pathname === p || location.pathname.startsWith(p + '/')) {
          next[p] = true;
        }
      });
      return next;
    });
  }, [location.pathname]);

  const sidebarItems: SidebarItem[] = [
    {
      text: 'Trang tổng quan',
      icon: <DashboardIcon />,
      path: '/admin',
      roles: ['ADMIN', 'STAFF'],
    },
    {
      text: 'Quản lý người dùng',
      icon: <PeopleIcon />,
      path: '/admin/users',
      roles: ['ADMIN'],
    },
    {
      text: 'Quản lý danh mục',
      icon: <CategoryIcon />,
      path: '/admin/categories',
      roles: ['ADMIN', 'STAFF'],
    },
    {
      text: 'Quản lý sản phẩm',
      icon: <InventoryIcon />,
      path: '/admin/products',
      roles: ['ADMIN', 'STAFF'],
      children: catItems,
    },
    {
      text: 'Quản lý kho',
      icon: <StorageIcon />,
      path: '/admin/inventory',
      roles: ['ADMIN', 'STAFF'],
    },
    {
      text: 'Quản lý đơn hàng',
      icon: <ShoppingCartIcon />,
      path: '/admin/orders',
      roles: ['ADMIN', 'STAFF'],
    },
    {
      text: 'Quản lý khuyến mãi',
      icon: <LocalOfferIcon />,
      path: '/admin/promotions',
      roles: ['ADMIN', 'STAFF'],
    },
    {
      text: 'Báo cáo thống kê',
      icon: <BarChartIcon />,
      path: '/admin/reports',
      roles: ['ADMIN'],
    },
    {
      text: 'Cài đặt hệ thống',
      icon: <SettingsIcon />,
      path: '/admin/settings',
      roles: ['ADMIN'],
    },
  ];

  const handleItemClick = (path: string) => {
    navigate(path);
    if (variant === 'temporary') {
      onClose();
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/');
    onClose();
  };

  const isItemActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const renderSidebarItem = (item: SidebarItem, level: number = 0) => {
    if (!hasRole(item.roles)) {
      return null;
    }

    const isActive = isItemActive(item.path);
    const paddingLeft = level * 2 + 2;
    const hasChildren = !!item.children && item.children.length > 0;
    const isExpanded = expanded[item.path] ?? (isActive && hasChildren);

    const onItemClick = () => {
      if (hasChildren) {
        setExpanded((prev) => ({ ...prev, [item.path]: !isExpanded }));
        // Navigate to parent path as well
        handleItemClick(item.path);
      } else {
        handleItemClick(item.path);
      }
    };

    return (
      <React.Fragment key={item.path}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={onItemClick}
            selected={isActive}
            sx={{
              pl: paddingLeft,
              '&.Mui-selected': {
                bgcolor: theme.palette.primary.main + '20',
                borderRight: `3px solid ${theme.palette.primary.main}`,
                '& .MuiListItemIcon-root': {
                  color: theme.palette.primary.main,
                },
                '& .MuiListItemText-primary': {
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                },
              },
              '&:hover': {
                bgcolor: theme.palette.action.hover,
              },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                fontSize: level > 0 ? '0.875rem' : '1rem',
                fontWeight: isActive ? 600 : 400,
              }}
            />
            {hasChildren && (isExpanded ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>
        </ListItem>

        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map(child => renderSidebarItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const drawerContent = (
    <Box sx={{ width: SIDEBAR_WIDTH }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          minHeight: 64,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          Quản trị Computer Shop
        </Typography>
      </Box>

      <Divider />

      {/* User Info */}
      {user && (
        <Box sx={{ p: 2, bgcolor: theme.palette.grey[50] }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Xin chào,
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {user.full_name}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {mapRoleLabel(user.role)}
          </Typography>
        </Box>
      )}

      <Divider />

      {/* Navigation Items */}
      <List sx={{ pt: 1 }}>
        {sidebarItems.map(item => renderSidebarItem(item))}
      </List>

      <Divider />

      {/* Logout */}
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <ExitToAppIcon />
            </ListItemIcon>
            <ListItemText primary="Đăng xuất" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      anchor={anchor}
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // Better mobile performance
      }}
      sx={{
        '& .MuiDrawer-paper': {
          width: SIDEBAR_WIDTH,
          boxSizing: 'border-box',
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};
