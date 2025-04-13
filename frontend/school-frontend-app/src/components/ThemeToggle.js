import React from 'react';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import { useColorMode } from '../theme/AdvancedThemeProvider';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { motion } from 'framer-motion';

const ThemeToggle = () => {
  const theme = useTheme();
  const { mode, toggleColorMode } = useColorMode();

  return (
    <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
      <IconButton
        onClick={toggleColorMode}
        color="inherit"
        aria-label="toggle theme"
        sx={{
          p: 1,
          borderRadius: '50%',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(0, 0, 0, 0.05)',
            transform: 'rotate(30deg)',
          },
        }}
        component={motion.button}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {mode === 'dark' ? (
          <motion.div
            initial={{ rotate: -30, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Brightness7Icon />
          </motion.div>
        ) : (
          <motion.div
            initial={{ rotate: 30, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Brightness4Icon />
          </motion.div>
        )}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
