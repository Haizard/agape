import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  Snackbar,
  Alert,
  Paper,
  Divider,
  useTheme,
  useMediaQuery,
  IconButton,
  Avatar,
  Fade,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import SendIcon from '@mui/icons-material/Send';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SchoolIcon from '@mui/icons-material/School';
import axios from 'axios';

const ContactPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [loading, setLoading] = useState(false);
  const [animateForm, setAnimateForm] = useState(false);

  // Trigger animations after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateForm(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call with a delay since the endpoint might not be implemented yet
      // await axios.post('/api/contact', formData);
      await new Promise(resolve => setTimeout(resolve, 1500));

      setSnackbar({
        open: true,
        message: 'Message sent successfully! We will get back to you soon.',
        severity: 'success'
      });
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to send message. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="fade-in">
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(45deg, var(--primary-color) 0%, var(--primary-dark) 100%)',
          color: 'white',
          py: { xs: 6, md: 10 },
          mb: 6,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(/images/pattern.png)',
            backgroundSize: 'cover',
            opacity: 0.1,
            zIndex: 1,
          }
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7} className="slide-in-left">
              <Typography
                variant="overline"
                sx={{
                  color: 'secondary.light',
                  fontWeight: 600,
                  letterSpacing: 2,
                  fontSize: '0.9rem',
                  display: 'block',
                  mb: 1,
                }}
              >
                GET IN TOUCH
              </Typography>
              <Typography
                variant="h1"
                sx={{
                  fontWeight: 800,
                  mb: 2,
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' },
                  textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                  lineHeight: 1.2,
                  background: 'linear-gradient(45deg, #fff, rgba(255,255,255,0.8))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Contact Us
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  mb: 4,
                  fontWeight: 400,
                  maxWidth: '600px',
                  opacity: 0.9,
                  lineHeight: 1.6,
                }}
              >
                We'd love to hear from you! Whether you have a question about our programs, admissions, or anything else, our team is ready to answer all your questions.
              </Typography>
            </Grid>
            <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                }}
                className="zoom-in"
              >
                <Avatar
                  sx={{
                    width: 180,
                    height: 180,
                    bgcolor: 'rgba(255,255,255,0.1)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                    border: '4px solid rgba(255,255,255,0.2)',
                  }}
                >
                  <SchoolIcon sx={{ fontSize: 100, color: 'white' }} />
                </Avatar>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Contact Information and Form */}
      <Container maxWidth="lg" sx={{ py: 4, mb: 8 }}>
        <Grid container spacing={4}>
          {/* Contact Information */}
          <Grid item xs={12} md={4}>
            <Fade in={animateForm} style={{ transitionDelay: '100ms' }}>
              <Card
                elevation={3}
                sx={{
                  height: '100%',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-md)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-10px)',
                    boxShadow: 'var(--shadow-lg)',
                  }
                }}
              >
                <Box
                  sx={{
                    bgcolor: 'primary.main',
                    py: 4,
                    px: 3,
                    color: 'white',
                    background: 'linear-gradient(45deg, var(--primary-color) 0%, var(--primary-dark) 100%)',
                  }}
                >
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    Get in Touch
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                    We're here to help and answer any questions you might have.
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ my: 3, display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}>
                      <LocationOnIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Address
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        123 School Street<br />
                        City, State 12345
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ my: 3, display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}>
                      <PhoneIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Phone
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        (123) 456-7890
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ my: 3, display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}>
                      <EmailIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Email
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        info@agapelutheran.edu
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ my: 3, display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}>
                      <AccessTimeIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Office Hours
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        Monday - Friday: 8:00 AM - 4:00 PM<br />
                        Saturday: 9:00 AM - 12:00 PM
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          {/* Contact Form */}
          <Grid item xs={12} md={8}>
            <Fade in={animateForm} style={{ transitionDelay: '300ms' }}>
              <Paper
                elevation={3}
                sx={{
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <Box
                  sx={{
                    bgcolor: 'grey.50',
                    py: 4,
                    px: 3,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    Send us a Message
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Fill out the form below and we'll get back to you as soon as possible.
                  </Typography>
                </Box>

                <Box sx={{ p: 3 }}>
                  <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          variant="outlined"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 'var(--radius-md)',
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          variant="outlined"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 'var(--radius-md)',
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                          variant="outlined"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 'var(--radius-md)',
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Message"
                          name="message"
                          multiline
                          rows={6}
                          value={formData.message}
                          onChange={handleChange}
                          required
                          variant="outlined"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 'var(--radius-md)',
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                          size="large"
                          disabled={loading}
                          endIcon={<SendIcon />}
                          sx={{
                            py: 1.5,
                            px: 4,
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 600,
                            boxShadow: 'var(--shadow-md)',
                            background: 'linear-gradient(45deg, var(--primary-color) 30%, var(--primary-light) 90%)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-3px)',
                              boxShadow: 'var(--shadow-lg)',
                            }
                          }}
                        >
                          {loading ? 'Sending...' : 'Send Message'}
                        </Button>
                      </Grid>
                    </Grid>
                  </form>
                </Box>
              </Paper>
            </Fade>
          </Grid>
        </Grid>
      </Container>

      {/* Google Map */}
      <Box sx={{ height: '400px', width: '100%', mb: 0 }}>
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.8177679933237!2d36.82221597486775!3d-1.2834802356327383!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f10d22f42bf05%3A0x5f90b691d4f7f3ea!2sNairobi%2C%20Kenya!5e0!3m2!1sen!2sus!4v1684234762982!5m2!1sen!2sus"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="St. John Vianney School Location Map"
        />
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          variant="filled"
          sx={{ width: '100%', boxShadow: 'var(--shadow-md)' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ContactPage;