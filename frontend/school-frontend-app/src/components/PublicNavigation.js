import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useMediaQuery,
  useTheme,
  Dialog,
  Container,
  Slide,
  Fade,
  Divider,
  Avatar
} from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import SchoolIcon from '@mui/icons-material/School';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import LoginIcon from '@mui/icons-material/Login';
import CloseIcon from '@mui/icons-material/Close';
import LoginForm from './LoginForm';
import FixedLoginForm from './FixedLoginForm';

// Removed SlideTransition as it might be causing issues

const PublicNavigation = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation items with icons
  const navigationItems = [
    { label: 'Home', path: '/', icon: <HomeIcon /> },
    { label: 'About', path: '/about', icon: <InfoIcon /> },
    { label: 'Academics', path: '/academics', icon: <MenuBookIcon /> },
    { label: 'News', path: '/news', icon: <NewspaperIcon /> },
    { label: 'Contact', path: '/contact', icon: <ContactMailIcon /> }
  ];

  // Handle scroll effect for AppBar
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLoginClick = () => {
    setLoginOpen(true);
    if (mobileOpen) setMobileOpen(false);
  };

  return (
    <>
      <AppBar
        position="fixed"
        elevation={4}
        sx={{
          backgroundColor: '#3f51b5',
          zIndex: 1300,
          width: '100%',
          left: 0,
          right: 0,
          top: 0,
          visibility: 'visible',
          display: 'block',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ py: { xs: 1.5, md: 2 }, minHeight: { xs: '64px', md: '70px' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                sx={{
                  bgcolor: 'secondary.main',
                  mr: 2,
                  width: { xs: 40, md: 50 },
                  height: { xs: 40, md: 50 },
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.3s ease',
                  '&:hover': { transform: 'scale(1.05)' }
                }}
                className="pulse"
              >
                <SchoolIcon sx={{ fontSize: { xs: 24, md: 30 } }} />
              </Avatar>

              <Typography
                variant="h5"
                component={Link}
                to="/"
                className="fade-in"
                sx={{
                  flexGrow: 1,
                  fontWeight: 700,
                  textDecoration: 'none',
                  color: 'white',
                  fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.6rem' },
                  letterSpacing: '0.5px',
                  textShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': { transform: 'translateY(-2px)' }
                }}
              >
                AGAPE LUTHERAN JUNIOR SEMINARY
              </Typography>
            </Box>

            {isMobile ? (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="end"
                onClick={handleDrawerToggle}
                sx={{
                  ml: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': { transform: 'rotate(90deg)' }
                }}
              >
                <MenuIcon />
              </IconButton>
            ) : (
              <Box sx={{ display: 'flex', gap: { xs: 1, md: 2 }, alignItems: 'center' }}>
                {navigationItems.map((item, index) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Button
                      key={item.label}
                      component={Link}
                      to={item.path}
                      color="inherit"
                      className="slide-in-right"
                      sx={{
                        position: 'relative',
                        fontWeight: isActive ? 700 : 500,
                        px: { xs: 1.5, md: 2 },
                        py: 1,
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: 0,
                          left: isActive ? '10%' : '50%',
                          width: isActive ? '80%' : '0%',
                          height: '3px',
                          bgcolor: 'secondary.main',
                          transition: 'all 0.3s ease',
                          borderRadius: '3px 3px 0 0',
                        },
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                          transform: 'translateY(-3px)',
                          '&::after': {
                            left: '10%',
                            width: '80%',
                          }
                        },
                        animationDelay: `${index * 0.1}s`,
                      }}
                    >
                      {item.label}
                    </Button>
                  );
                })}
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleLoginClick}
                  startIcon={<LoginIcon />}
                  className="zoom-in"
                  sx={{
                    ml: 1,
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-md)',
                    background: 'linear-gradient(45deg, var(--secondary-color) 30%, var(--secondary-light) 90%)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: 'var(--shadow-lg)',
                    }
                  }}
                >
                  Sign In
                </Button>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            background: 'linear-gradient(180deg, var(--primary-color) 0%, var(--primary-dark) 100%)',
            color: 'white',
            boxShadow: 'var(--shadow-lg)',
          }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Drawer Header */}
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                <SchoolIcon />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Menu
              </Typography>
            </Box>
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleDrawerToggle}
              sx={{
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'rotate(90deg)' }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />

          {/* Navigation Links */}
          <List sx={{ flexGrow: 1, pt: 2 }}>
            {navigationItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItem
                  button
                  key={item.label}
                  component={Link}
                  to={item.path}
                  onClick={handleDrawerToggle}
                  className="slide-in-left"
                  sx={{
                    borderRadius: 'var(--radius-md)',
                    mx: 1,
                    mb: 1,
                    bgcolor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.15)',
                      transform: 'translateX(5px)',
                    },
                    animationDelay: `${index * 0.1}s`,
                  }}
                >
                  <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 400,
                    }}
                  />
                </ListItem>
              );
            })}
          </List>

          {/* Sign In Button */}
          <Box sx={{ p: 2 }}>
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              onClick={handleLoginClick}
              startIcon={<LoginIcon />}
              sx={{
                py: 1.5,
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                boxShadow: 'var(--shadow-md)',
                background: 'linear-gradient(45deg, var(--secondary-color) 30%, var(--secondary-light) 90%)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 'var(--shadow-lg)',
                }
              }}
            >
              Sign In
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Login Dialog */}
      <Dialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Fade}
        transitionDuration={300}
        PaperProps={{
          elevation: 24,
          sx: {
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xl)',
          }
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <IconButton
            onClick={() => setLoginOpen(false)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'grey.500',
              zIndex: 1,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'rotate(90deg)',
                color: 'grey.700'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
          <FixedLoginForm onClose={() => setLoginOpen(false)} />
        </Box>
      </Dialog>
    </>
  );
};

export default PublicNavigation;







