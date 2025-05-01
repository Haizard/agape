import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Divider,
  useTheme,
  useMediaQuery,
  Container
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';

// Styled components for menu buttons
const MenuButton = styled(Button)(({ theme, active }) => ({
  borderRadius: '12px',
  padding: '12px 20px',
  marginBottom: '12px',
  marginRight: '12px',
  textAlign: 'left',
  justifyContent: 'flex-start',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  fontWeight: active ? 600 : 500,
  backgroundColor: active ? theme.palette.primary.main : theme.palette.background.paper,
  color: active ? theme.palette.primary.contrastText : theme.palette.text.primary,
  boxShadow: active
    ? '0 4px 10px rgba(0, 0, 0, 0.15)'
    : '0 2px 5px rgba(0, 0, 0, 0.05)',
  '&:hover': {
    backgroundColor: active
      ? theme.palette.primary.dark
      : theme.palette.action.hover,
    transform: 'translateY(-3px)',
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.1)',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: active ? '100%' : '0%',
    height: '3px',
    backgroundColor: theme.palette.secondary.main,
    transition: 'width 0.3s ease',
  },
  '&:hover::after': {
    width: '100%',
  },
  [theme.breakpoints.down('sm')]: {
    width: 'calc(50% - 12px)', // Two buttons per row with gap
    fontSize: '0.875rem',
    padding: '10px 15px',
  },
}));

// Animation variants for framer-motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24
    }
  }
};

const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.3,
      duration: 0.5,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3
    }
  }
};

/**
 * DepartmentLayout - A component that displays a set of menu buttons and renders
 * the selected component below them using React Router.
 *
 * @param {Object} props
 * @param {string} props.title - The title of the department
 * @param {Array} props.menuItems - Array of menu items with { id, label, path, icon }
 * @param {string} props.defaultSelected - ID of the default selected menu item
 * @param {ReactNode} props.children - Child components (Routes)
 */
const DepartmentLayout = ({ title, menuItems, defaultSelected, children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  const navigate = useNavigate();

  // Get current path without the base path
  const currentPath = location.pathname.split('/').pop();

  // Handle menu item click using relative navigation
  const handleMenuItemClick = (path) => {
    navigate(path);
  };

  // Find the currently active menu item
  const activeMenuItem = menuItems.find(item => item.path === currentPath) || menuItems.find(item => item.id === defaultSelected);


  return (
    <Container maxWidth="xl">
      <Box sx={{ p: 3 }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 600,
              color: theme.palette.primary.main,
              mb: 3,
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -8,
                left: 0,
                width: '60px',
                height: '4px',
                backgroundColor: theme.palette.secondary.main,
                borderRadius: '2px'
              }
            }}
          >
            {title}
          </Typography>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 3,
              mb: 4,
              borderRadius: '12px',
              background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
            }}
          >
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <Grid container spacing={isMobile ? 1 : 2}>
                {menuItems.map((item) => (
                  <Grid
                    item
                    xs={6}
                    sm={4}
                    md={3}
                    lg={2}
                    key={item.id}
                  >
                    <motion.div
                      variants={itemVariants}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <MenuButton
                        fullWidth
                        startIcon={item.icon}
                        active={activeMenuItem?.id === item.id ? 1 : 0}
                        onClick={() => handleMenuItemClick(item.path)}
                      >
                        {item.label}
                      </MenuButton>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </motion.div>
          </Paper>
        </motion.div>

        <Divider sx={{ mb: 4 }} />

        <motion.div
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          key={activeMenuItem?.id} // Re-render animation when selection changes
          layout
        >
          <Box>
            {children}
          </Box>
        </motion.div>
      </Box>
    </Container>
  );
};

DepartmentLayout.propTypes = {
  title: PropTypes.string.isRequired,
  menuItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.node,
      path: PropTypes.string.isRequired
    })
  ).isRequired,
  defaultSelected: PropTypes.string,
  children: PropTypes.node
};

export default DepartmentLayout;
