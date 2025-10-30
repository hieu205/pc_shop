import React from 'react';
import { Box, List, ListItemButton, ListItemText, Paper, Typography } from '@mui/material';

export type AccountSection = {
  id: string;
  title: string;
};

interface Props {
  sections: AccountSection[];
  activeId: string;
  onSelect: (id: string) => void;
  children: React.ReactNode;
}

const AccountLayout: React.FC<Props> = ({ sections, activeId, onSelect, children }) => {
  return (
    <Box display="flex" gap={2} sx={{ p: { xs: 1, md: 3 } }}>
      <Paper sx={{ width: { xs: '100%', md: 280 }, p: 1 }} elevation={1}>
        <Typography variant="h6" sx={{ px: 1, pb: 1 }}>
          Tài khoản
        </Typography>
        <List>
          {sections.map((s) => (
            <ListItemButton
              key={s.id}
              selected={s.id === activeId}
              onClick={() => onSelect(s.id)}
              sx={{ borderRadius: 1, mb: 1 }}
            >
              <ListItemText primary={s.title} />
            </ListItemButton>
          ))}
        </List>
      </Paper>

      <Box component={Paper} sx={{ flex: 1, p: 2 }} elevation={1}>
        {children}
      </Box>
    </Box>
  );
};

export default AccountLayout;
