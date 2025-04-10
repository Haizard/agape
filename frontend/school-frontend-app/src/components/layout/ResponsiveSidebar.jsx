import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Box,
  IconButton,
  useTheme,
  useMediaQuery,
  Divider
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

/**
 * ResponsiveSidebar Component
 * A responsive sidebar that adapts to different screen sizes and organizes menu items into categories
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the sidebar is open
 * @param {Function} props.onClose - Function to call when closing the sidebar
 * @param {Object} props.menuGroups - Object containing menu groups with their items
 * @param {string} props.role - User role (admin, teacher, student, etc.)
 */
const ResponsiveSidebar = ({ open, onClose, menuGroups, role }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery('(max-width:374px)');
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  const navigate = useNavigate();
  const [openCategories, setOpenCategories] = useState({});

  // Toggle category open/closed
  const handleCategoryToggle = (category) => {
    setOpenCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Determine if a path is active
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Adjust drawer width based on screen size
  const drawerWidth = isSmallScreen ? 240 : (isMobile ? 280 : 320);

  // Get category color based on category name
  const getCategoryColor = (category) => {
    switch (category) {
      case 'dashboard':
        return theme.palette.primary.main;
      case 'userManagement':
        return theme.palette.secondary.main;
      case 'academicManagement':
        return theme.palette.success.main;
      case 'examManagement':
        return theme.palette.warning.main;
      case 'resultManagement':
        return theme.palette.info.main;
      case 'communication':
        return theme.palette.error.main;
      case 'finance':
        return '#9c27b0'; // Purple
      case 'classes':
        return '#00bcd4'; // Cyan
      case 'assessment':
        return '#ff5722'; // Deep Orange
      case 'reports':
        return '#607d8b'; // Blue Grey
      default:
        return theme.palette.grey[500];
    }
  };

  // Format category name for display
  const formatCategoryName = (category) => {
    return category
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
  };

  // Initialize open categories based on active path
  useEffect(() => {
    if (menuGroups) {
      const newOpenCategories = {};

      // Check each category and its items
      Object.entries(menuGroups).forEach(([category, items]) => {
        // If any item in this category is active, open the category
        const hasActiveItem = items.some(item => isActive(item.path));
        if (hasActiveItem) {
          newOpenCategories[category] = true;
        }
      });

      setOpenCategories(newOpenCategories);
    }
  }, [location.pathname, menuGroups]);

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        display: 'block', // Ensure the drawer is displayed
        zIndex: 1200, // Higher z-index to ensure visibility
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#3f51b5', // Match the primary color for better visibility
          color: '#ffffff', // White text for better contrast
          borderRight: '1px solid rgba(255, 255, 255, 0.12)',
        },
      }}
    >
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2
      }}>
        <Typography
          variant={isSmallScreen ? "subtitle1" : "h6"}
          sx={{
            fontWeight: 'bold',
            fontSize: isSmallScreen ? '0.9rem' : undefined
          }}
        >
          {role.toUpperCase()} PANEL
        </Typography>
        <IconButton onClick={onClose}>
          <ChevronLeftIcon />
        </IconButton>
      </Box>

      <Divider />

      <Box sx={{ overflow: 'auto', mt: 1 }}>
        {menuGroups && Object.entries(menuGroups).map(([category, items]) => (
          <React.Fragment key={category}>
            <ListItem
              button
              onClick={() => handleCategoryToggle(category)}
              sx={{
                backgroundColor: openCategories[category] ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                borderRadius: '8px',
                mx: 1,
                mb: 0.5,
                // Different colors for different categories
                borderLeft: '4px solid',
                borderColor: getCategoryColor(category),
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <ListItemText
                primary={formatCategoryName(category)}
                primaryTypographyProps={{
                  fontSize: isSmallScreen ? '0.85rem' : '0.95rem',
                  fontWeight: 'bold',
                  color: '#ffffff' // White text for better visibility
                }}
              />
              {openCategories[category] ? <ExpandLess /> : <ExpandMore />}
            </ListItem>

            <Collapse in={openCategories[category]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {items.map((item) => (
                  <ListItem
                    key={item.text}
                    button
                    component={Link}
                    to={item.path}
                    selected={isActive(item.path)}
                    sx={{
                      pl: 4,
                      py: isSmallScreen ? 1 : 1.5,
                      borderRadius: '8px',
                      mx: 1,
                      mb: 0.5,
                      color: '#ffffff',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        borderLeft: '4px solid',
                        borderColor: 'secondary.main',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.25)',
                        },
                      },
                    }}
                  >
                    <ListItemIcon sx={{
                      minWidth: isSmallScreen ? 36 : 40,
                      color: isActive(item.path) ? '#ffeb3b' : '#ffffff'
                    }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: isSmallScreen ? '0.8rem' : '0.9rem',
                        fontWeight: isActive(item.path) ? 'bold' : 'normal'
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </React.Fragment>
        ))}
      </Box>
    </Drawer>
  );
};

export default ResponsiveSidebar;
