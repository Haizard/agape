import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Button,
  Badge,
  Menu,
  MenuItem,
  ListSubheader,
  Collapse
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Class as ClassIcon,
  Book as BookIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  CloudOff as CloudOffIcon,
  CloudDone as CloudDoneIcon,
  Download as DownloadIcon,
  Sync as SyncIcon
} from '@mui/icons-material';

// Import offline data service
import offlineDataService from '../../services/offlineDataService';

const Navigation = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [academicOpen, setAcademicOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [marksOpen, setMarksOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState(null);
  
  // Check online status and sync status on component mount
  React.useEffect(() => {
    // Set up network listeners
    offlineDataService.setupNetworkListeners(
      // Online callback
      () => {
        setIsOnline(true);
        fetchSyncStatus();
      },
      // Offline callback
      () => {
        setIsOnline(false);
      }
    );
    
    // Check initial online status
    setIsOnline(offlineDataService.isOnline());
    
    // Fetch initial sync status
    fetchSyncStatus();
    
    // Cleanup
    return () => {
      // Remove network listeners if needed
    };
  }, []);
  
  // Fetch sync status
  const fetchSyncStatus = async () => {
    try {
      const status = await offlineDataService.getSyncStatus();
      setSyncStatus(status);
    } catch (err) {
      console.error('Error fetching sync status:', err);
    }
  };
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const handleAcademicClick = () => {
    setAcademicOpen(!academicOpen);
  };
  
  const handleReportsClick = () => {
    setReportsOpen(!reportsOpen);
  };
  
  const handleMarksClick = () => {
    setMarksOpen(!marksOpen);
  };
  
  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          St. John Vianney
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        <ListItem button component={RouterLink} to="/dashboard">
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        
        {/* Academic Management */}
        <ListItem button onClick={handleAcademicClick}>
          <ListItemIcon>
            <SchoolIcon />
          </ListItemIcon>
          <ListItemText primary="Academic" />
          {academicOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        <Collapse in={academicOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem button component={RouterLink} to="/academic/unified" sx={{ pl: 4 }}>
              <ListItemIcon>
                <SchoolIcon />
              </ListItemIcon>
              <ListItemText primary="Unified Academic" />
            </ListItem>
          </List>
        </Collapse>
        
        {/* Marks Management */}
        <ListItem button onClick={handleMarksClick}>
          <ListItemIcon>
            <AssessmentIcon />
          </ListItemIcon>
          <ListItemText primary="Marks" />
          {marksOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        <Collapse in={marksOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem button component={RouterLink} to="/marks/entry" sx={{ pl: 4 }}>
              <ListItemIcon>
                <AssessmentIcon />
              </ListItemIcon>
              <ListItemText primary="Marks Entry" />
            </ListItem>
            <ListItem button component={RouterLink} to="/marks/offline-entry" sx={{ pl: 4 }}>
              <ListItemIcon>
                {!isOnline ? (
                  <Badge color="warning" variant="dot">
                    <CloudOffIcon />
                  </Badge>
                ) : syncStatus && syncStatus.pendingSyncItems > 0 ? (
                  <Badge badgeContent={syncStatus.pendingSyncItems} color="warning">
                    <SyncIcon />
                  </Badge>
                ) : (
                  <CloudDoneIcon />
                )}
              </ListItemIcon>
              <ListItemText 
                primary="Offline Marks Entry" 
                secondary={!isOnline ? "Offline Mode" : syncStatus && syncStatus.pendingSyncItems > 0 ? "Pending Sync" : ""}
              />
            </ListItem>
          </List>
        </Collapse>
        
        {/* Reports */}
        <ListItem button onClick={handleReportsClick}>
          <ListItemIcon>
            <BookIcon />
          </ListItemIcon>
          <ListItemText primary="Reports" />
          {reportsOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        <Collapse in={reportsOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem button component={RouterLink} to="/reports/student" sx={{ pl: 4 }}>
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText primary="Student Reports" />
            </ListItem>
            <ListItem button component={RouterLink} to="/reports/batch-download" sx={{ pl: 4 }}>
              <ListItemIcon>
                <DownloadIcon />
              </ListItemIcon>
              <ListItemText primary="Batch Download" />
            </ListItem>
          </List>
        </Collapse>
        
        {/* Settings */}
        <ListItem button component={RouterLink} to="/settings">
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItem>
      </List>
    </div>
  );
  
  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            St. John Vianney School Management System
          </Typography>
          {!isOnline && (
            <Badge color="warning" variant="dot">
              <CloudOffIcon sx={{ mr: 1 }} />
              <Typography variant="body2" sx={{ mr: 2 }}>
                Offline
              </Typography>
            </Badge>
          )}
          <Button color="inherit" component={RouterLink} to="/profile">
            Profile
          </Button>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: 240 }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - 240px)` } }}
      >
        <Toolbar />
        {/* Page content will be rendered here */}
      </Box>
    </Box>
  );
};

export default Navigation;
