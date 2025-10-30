import React, { useState } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { Outlet } from 'react-router-dom';
const Sidebar = React.lazy(() => import('./Sidebar').then(m => ({ default: m.Sidebar })));
import { Breadcrumbs } from './Breadcrumbs';

interface AdminLayoutProps {
  children?: React.ReactNode;
  showBreadcrumbs?: boolean;
}

const DRAWER_WIDTH = 280;

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  showBreadcrumbs = true,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const handleSidebarToggle = () => setSidebarOpen((s) => !s);

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Admin Header - minimal and separate from public AppBar */}
      <Box
        component="header"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          bgcolor: 'background.paper',
          borderBottom: `1px solid ${theme.palette.divider}`,
          zIndex: theme.zIndex.appBar,
          display: 'flex',
          alignItems: 'center',
          px: 2,
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box component="button" onClick={handleSidebarToggle} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
            ☰
          </Box>
          <Box component="span" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>Computer Shop - Admin</Box>
        </Box>
        <Box>
          {/* placeholder for admin actions (breadcrumbs, quick links) */}
        </Box>
      </Box>

      {/* Sidebar (lazy) */}
      <React.Suspense fallback={null}>
        <Sidebar
          open={sidebarOpen}
          onClose={handleSidebarClose}
          variant={isMobile ? 'temporary' : 'persistent'}
          anchor="left"
        />
      </React.Suspense>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: {
            md: sidebarOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%',
          },
          ml: {
            md: sidebarOpen ? `${DRAWER_WIDTH}px` : 0,
          },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginTop: '64px', // Admin header height
          bgcolor: 'background.default',
        }}
      >
        {/* Breadcrumbs */}
        {showBreadcrumbs && (
          <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 1 }}>
            <Breadcrumbs />
          </Box>
        )}

        {/* Page Content */}
        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3, md: 4 },
          }}
        >
          {children || <Outlet />}
        </Box>

        {/* Intentionally no public Footer here - admin area uses separate footer if needed */}
      </Box>
    </Box>
  );
};
