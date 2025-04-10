import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  ListSubheader,
  Collapse
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Book as BookIcon,
  Assignment as AssignmentIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Add as AddIcon,
  ViewList as ViewListIcon,
  ExpandLess,
  ExpandMore,
  MonitorHeart as MonitorIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  }),
);

const AppBarStyled = styled(AppBar, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: `${drawerWidth}px`,
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }),
  }),
);

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const MainLayout = () => {
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [teacherMenuOpen, setTeacherMenuOpen] = useState(true);
  const [adminMenuOpen, setAdminMenuOpen] = useState(true);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleTeacherMenuToggle = () => {
    setTeacherMenuOpen(!teacherMenuOpen);
  };

  const handleAdminMenuToggle = () => {
    setAdminMenuOpen(!adminMenuOpen);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBarStyled position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2, ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            AGAPE LUTHERAN JUNIOR SEMINARY
          </Typography>
          {currentUser && (
            <div>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  {currentUser.firstName ? currentUser.firstName.charAt(0) : 'U'}
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>Profile</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </div>
          )}
        </Toolbar>
      </AppBarStyled>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        </DrawerHeader>
        <Divider />
        
        {currentUser && currentUser.role === 'admin' && (
          <>
            <List>
              <ListItem button onClick={handleAdminMenuToggle}>
                <ListItemIcon>
                  <DashboardIcon />
                </ListItemIcon>
                <ListItemText primary="Admin" />
                {adminMenuOpen ? <ExpandLess /> : <ExpandMore />}
              </ListItem>
              <Collapse in={adminMenuOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItem 
                    button 
                    sx={{ pl: 4, bgcolor: isActive('/admin') ? 'rgba(0, 0, 0, 0.08)' : 'inherit' }}
                    onClick={() => navigate('/admin')}
                  >
                    <ListItemIcon>
                      <DashboardIcon />
                    </ListItemIcon>
                    <ListItemText primary="Dashboard" />
                  </ListItem>
                  <ListItem 
                    button 
                    sx={{ pl: 4, bgcolor: isActive('/admin/results/monitor') ? 'rgba(0, 0, 0, 0.08)' : 'inherit' }}
                    onClick={() => navigate('/admin/results/monitor')}
                  >
                    <ListItemIcon>
                      <MonitorIcon />
                    </ListItemIcon>
                    <ListItemText primary="Monitor Results" />
                  </ListItem>
                </List>
              </Collapse>
            </List>
            <Divider />
          </>
        )}
        
        {currentUser && (currentUser.role === 'teacher' || currentUser.role === 'admin') && (
          <>
            <List>
              <ListItem button onClick={handleTeacherMenuToggle}>
                <ListItemIcon>
                  <SchoolIcon />
                </ListItemIcon>
                <ListItemText primary="Teacher" />
                {teacherMenuOpen ? <ExpandLess /> : <ExpandMore />}
              </ListItem>
              <Collapse in={teacherMenuOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItem 
                    button 
                    sx={{ pl: 4, bgcolor: isActive('/teacher') ? 'rgba(0, 0, 0, 0.08)' : 'inherit' }}
                    onClick={() => navigate('/teacher')}
                  >
                    <ListItemIcon>
                      <DashboardIcon />
                    </ListItemIcon>
                    <ListItemText primary="Dashboard" />
                  </ListItem>
                  <ListItem 
                    button 
                    sx={{ pl: 4, bgcolor: isActive('/teacher/enter-marks') ? 'rgba(0, 0, 0, 0.08)' : 'inherit' }}
                    onClick={() => navigate('/teacher/enter-marks')}
                  >
                    <ListItemIcon>
                      <AddIcon />
                    </ListItemIcon>
                    <ListItemText primary="Enter Marks" />
                  </ListItem>
                  <ListItem 
                    button 
                    sx={{ pl: 4, bgcolor: isActive('/teacher/batch-marks') ? 'rgba(0, 0, 0, 0.08)' : 'inherit' }}
                    onClick={() => navigate('/teacher/batch-marks')}
                  >
                    <ListItemIcon>
                      <ViewListIcon />
                    </ListItemIcon>
                    <ListItemText primary="Batch Marks" />
                  </ListItem>
                </List>
              </Collapse>
            </List>
            <Divider />
          </>
        )}
        
        {currentUser && currentUser.role === 'student' && (
          <>
            <List>
              <ListItem 
                button 
                sx={{ bgcolor: isActive('/student') ? 'rgba(0, 0, 0, 0.08)' : 'inherit' }}
                onClick={() => navigate('/student')}
              >
                <ListItemIcon>
                  <DashboardIcon />
                </ListItemIcon>
                <ListItemText primary="Student Dashboard" />
              </ListItem>
            </List>
            <Divider />
          </>
        )}
        
        <List>
          <ListItem button onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        </List>
      </Drawer>
      <Main open={open}>
        <DrawerHeader />
        <Outlet />
      </Main>
    </Box>
  );
};

export default MainLayout;
