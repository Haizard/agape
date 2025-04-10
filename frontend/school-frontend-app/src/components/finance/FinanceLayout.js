import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';

/**
 * FinanceLayout component
 * This component serves as a layout wrapper for finance pages
 * It doesn't include its own navigation to avoid duplication with the main navigation
 */
const FinanceLayout = () => {
  return (
    <Box sx={{ width: '100%' }}>
      <Outlet />
    </Box>
  );
};

export default FinanceLayout;
