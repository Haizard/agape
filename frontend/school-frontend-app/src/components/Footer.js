import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery,
  Button,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SchoolIcon from '@mui/icons-material/School';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import {
  createFacebookLink,
  createTwitterLink,
  createInstagramLink,
  createLinkedInLink,
  createWhatsAppLink,
  createPhoneLink,
  createEmailLink,
  getSocialLinkAttributes
} from '../utils/socialMediaUtils';

const Footer = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <Box component="footer" sx={{ mt: 'auto' }}>
      {/* Back to top button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          transform: 'translateY(50%)',
          zIndex: 2,
          position: 'relative'
        }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={scrollToTop}
          sx={{
            borderRadius: '50%',
            minWidth: '50px',
            height: '50px',
            boxShadow: 'var(--shadow-lg)',
            '&:hover': {
              transform: 'translateY(-5px)',
            },
            transition: 'transform 0.3s ease'
          }}
        >
          <KeyboardArrowUpIcon />
        </Button>
      </Box>

      {/* Main Footer */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          background: 'linear-gradient(to bottom, #f8f9fa, #ffffff)',
          color: 'text.primary',
          pt: 8,
          pb: 6,
          position: 'relative',
          boxShadow: 'inset 0 5px 15px rgba(0,0,0,0.1)',
          borderTop: '1px solid rgba(0,0,0,0.1)'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {/* Logo and About */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SchoolIcon sx={{ fontSize: 36, mr: 1, color: 'primary.main' }} />
                <Typography variant="h5" fontWeight={700} color="primary.main">
                  Agape Lutheran
                </Typography>
              </Box>
              <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
                A Beacon of Truth
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Preparing faithful leaders who will serve the Church and nation by promoting Christian morals and ethics among the youths.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  aria-label="Facebook"
                  href={createFacebookLink('agapelutheranjuniorseminary')}
                  {...getSocialLinkAttributes()}
                  sx={{
                    bgcolor: 'rgba(59, 89, 152, 0.1)',
                    color: '#3b5998',
                    '&:hover': { bgcolor: '#3b5998', color: 'white' }
                  }}
                >
                  <FacebookIcon />
                </IconButton>
                <IconButton
                  aria-label="Twitter"
                  href={createTwitterLink('agapeseminary')}
                  {...getSocialLinkAttributes()}
                  sx={{
                    bgcolor: 'rgba(29, 161, 242, 0.1)',
                    color: '#1da1f2',
                    '&:hover': { bgcolor: '#1da1f2', color: 'white' }
                  }}
                >
                  <TwitterIcon />
                </IconButton>
                <IconButton
                  aria-label="Instagram"
                  href={createInstagramLink('agapelutheranjuniorseminary')}
                  {...getSocialLinkAttributes()}
                  sx={{
                    bgcolor: 'rgba(225, 48, 108, 0.1)',
                    color: '#e1306c',
                    '&:hover': { bgcolor: '#e1306c', color: 'white' }
                  }}
                >
                  <InstagramIcon />
                </IconButton>
                <IconButton
                  aria-label="LinkedIn"
                  href={createLinkedInLink('company', 'agapelutheranjuniorseminary')}
                  {...getSocialLinkAttributes()}
                  sx={{
                    bgcolor: 'rgba(0, 119, 181, 0.1)',
                    color: '#0077b5',
                    '&:hover': { bgcolor: '#0077b5', color: 'white' }
                  }}
                >
                  <LinkedInIcon />
                </IconButton>
                <IconButton
                  aria-label="WhatsApp"
                  href={createWhatsAppLink('255759767735')}
                  {...getSocialLinkAttributes()}
                  sx={{
                    bgcolor: 'rgba(37, 211, 102, 0.1)',
                    color: '#25D366',
                    '&:hover': { bgcolor: '#25D366', color: 'white' }
                  }}
                >
                  <WhatsAppIcon />
                </IconButton>
              </Box>
            </Grid>

            {/* Quick Links */}
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Quick Links
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                {[
                  { name: 'Home', path: '/' },
                  { name: 'About', path: '/about' },
                  { name: 'Academics', path: '/academics' },
                  { name: 'Campus Life', path: '/campus-life' },
                  { name: 'News', path: '/news' },
                ].map((link) => (
                  <Box component="li" key={link.name} sx={{ mb: 1 }}>
                    <Link
                      component={RouterLink}
                      to={link.path}
                      underline="none"
                      sx={{
                        color: 'text.secondary',
                        display: 'inline-flex',
                        alignItems: 'center',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          color: 'primary.main',
                          transform: 'translateX(5px)'
                        },
                      }}
                    >
                      {link.name}
                    </Link>
                  </Box>
                ))}
              </Box>
            </Grid>

            {/* Resources */}
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Resources
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                {[
                  { name: 'Student Portal', path: '/login' },
                  { name: 'Teacher Portal', path: '/login' },
                  { name: 'Admin Portal', path: '/login' },
                  { name: 'Calendar', path: '#' },
                  { name: 'Contact', path: '/contact' },
                ].map((link) => (
                  <Box component="li" key={link.name} sx={{ mb: 1 }}>
                    <Link
                      component={RouterLink}
                      to={link.path}
                      underline="none"
                      sx={{
                        color: 'text.secondary',
                        display: 'inline-flex',
                        alignItems: 'center',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          color: 'primary.main',
                          transform: 'translateX(5px)'
                        },
                      }}
                    >
                      {link.name}
                    </Link>
                  </Box>
                ))}
              </Box>
            </Grid>

            {/* Contact Info */}
            <Grid item xs={12} md={4}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Contact Us
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', mb: 2 }}>
                  <LocationOnIcon sx={{ color: 'primary.main', mr: 2, fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">
                    P.O. Box 8882<br />
                    Moshi, Kilimanjaro, Tanzania
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', mb: 2 }}>
                  <PhoneIcon sx={{ color: 'primary.main', mr: 2, fontSize: 20 }} />
                  <Box>
                    <Link
                      href={createPhoneLink('+255759767735')}
                      underline="hover"
                      color="text.secondary"
                      sx={{
                        display: 'block',
                        '&:hover': { color: 'primary.main' }
                      }}
                    >
                      +255 759 767 735
                    </Link>
                    <Link
                      href={createPhoneLink('+255765293177')}
                      underline="hover"
                      color="text.secondary"
                      sx={{
                        display: 'block',
                        '&:hover': { color: 'primary.main' }
                      }}
                    >
                      +255 765 293 177
                    </Link>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', mb: 2 }}>
                  <EmailIcon sx={{ color: 'primary.main', mr: 2, fontSize: 20 }} />
                  <Link
                    href={createEmailLink('agapeljseminary@gmail.com', 'Inquiry from Website')}
                    underline="hover"
                    color="text.secondary"
                    sx={{
                      wordBreak: 'break-all',
                      '&:hover': { color: 'primary.main' }
                    }}
                  >
                    agapeljseminary@gmail.com
                  </Link>
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* Copyright */}
          <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'center' : 'flex-start' }}>
            <Typography variant="body2" color="text.secondary" align={isMobile ? 'center' : 'left'}>
              © {new Date().getFullYear()} Agape Lutheran Junior Seminary. All rights reserved.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: isMobile ? 2 : 0 }}>
              <Link href="#" underline="hover" color="text.secondary" variant="body2">
                Privacy Policy
              </Link>
              <Link href="#" underline="hover" color="text.secondary" variant="body2">
                Terms of Service
              </Link>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Footer;
