import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Paper,
  Divider,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const AboutPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Refs for scroll animations
  const historyRef = useRef(null);
  const valuesRef = useRef(null);
  const statsRef = useRef(null);

  // Scroll animation effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;

      // Animate sections when scrolled into view
      if (historyRef.current && scrollPosition > historyRef.current.offsetTop + 100) {
        historyRef.current.classList.add('fade-in');
      }

      if (valuesRef.current && scrollPosition > valuesRef.current.offsetTop + 100) {
        valuesRef.current.classList.add('fade-in');
      }

      if (statsRef.current && scrollPosition > statsRef.current.offsetTop + 100) {
        statsRef.current.classList.add('fade-in');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Core values data
  const coreValues = [
    { value: 'Vision', description: 'To prepare future leaders and professionals based on Christian ethics.' },
    { value: 'Mission', description: 'To prepare faithful leaders who will serve the Church and nation by promoting Christian morals and ethics among the youths.' },
    { value: 'Objective 1', description: 'To raise Christian moral and ethics among the youths.' },
    { value: 'Objective 2', description: 'To improve the quality of education in the country with emphasis on science subjects.' },
    { value: 'Objective 3', description: 'To prepare future leaders who will serve the Church and nation honestly and faithfully.' },
  ];

  // School stats
  const schoolStats = [
    { number: '40', label: 'Division One (A-Level 2022)', icon: <EmojiEventsIcon fontSize="large" /> },
    { number: '59', label: 'Division One (O-Level 2021)', icon: <EmojiEventsIcon fontSize="large" /> },
    { number: '180', label: 'Students Enrolled Yearly', icon: <GroupsIcon fontSize="large" /> },
    { number: '9', label: 'A-Level Combinations', icon: <MenuBookIcon fontSize="large" /> },
  ];

  return (
    <Box className="public-page">
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
                OUR STORY
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
                About Our School
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
                Agape Lutheran Junior Seminary - A Beacon of truth, preparing faithful leaders who will serve the Church and nation.
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

      {/* History Section */}
      <Container maxWidth="lg" sx={{ py: 4, mb: 8 }}>
        <Box ref={historyRef}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6} className="slide-in-left">
              <Box
                sx={{
                  position: 'relative',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-lg)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0) 70%, rgba(0,0,0,0.7) 100%)',
                    zIndex: 1,
                  }
                }}
              >
                <CardMedia
                  component="img"
                  height="450"
                  image="/images/web content1.jpg"
                  alt="School Building"
                  sx={{
                    transition: 'transform 0.5s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                    }
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    p: 3,
                    zIndex: 2,
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      color: 'white',
                      fontWeight: 700,
                      textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    }}
                  >
                    Our Campus Since 1998
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6} className="slide-in-right">
              <Box sx={{ pl: { md: 4 } }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    mb: 3,
                    fontSize: { xs: '1.8rem', md: '2.5rem' },
                    background: 'linear-gradient(45deg, var(--primary-color), var(--primary-dark))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Our History
                </Typography>

                <Divider
                  sx={{
                    width: '80px',
                    borderWidth: '4px',
                    borderColor: 'secondary.main',
                    borderRadius: 2,
                    mb: 4,
                  }}
                />

                <Typography variant="body1" paragraph sx={{ mb: 3, lineHeight: 1.8 }}>
                  Agape Lutheran Junior Seminary started in the year 1998. Decision for establishment of the Seminary was made by the diocesan council meeting as a land mark for 100 years of Christianity in the Diocese.
                </Typography>

                <Typography variant="body1" paragraph sx={{ mb: 3, lineHeight: 1.8 }}>
                  The seminary is owned by the ELCT Northern Diocese and it enrolls students with Christian background belonging to the Christian Council of Tanzania (CCT).
                  Having moved from three different places, it finally settled in its 'promised land' (the current site) in 1998.
                </Typography>

                <Typography variant="body1" paragraph sx={{ mb: 4, lineHeight: 1.8 }}>
                  The seminary is located at Mamba Mokeo/Lower in Moshi Rural District, about 40km from Moshi town & 3km from Marangu/Himo main road.
                  The Seminary recruits qualified, faithful, experienced and committed Christian teachers and supporting staff.
                </Typography>

                <Button
                  variant="contained"
                  color="primary"
                  endIcon={<ArrowForwardIcon />}
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
                  Learn More
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>

      {/* Core Values Section */}
      <Box
        ref={valuesRef}
        sx={{
          py: { xs: 6, md: 10 },
          background: 'linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="overline"
              sx={{
                color: 'secondary.main',
                fontWeight: 600,
                letterSpacing: 2,
                fontSize: '0.9rem',
                display: 'block',
                mb: 1,
              }}
            >
              WHAT WE STAND FOR
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 700,
                mb: 2,
                fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.8rem' },
                background: 'linear-gradient(45deg, var(--primary-color), var(--primary-dark))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Our Core Values
            </Typography>
            <Divider
              sx={{
                width: '120px',
                borderWidth: '4px',
                borderColor: 'secondary.main',
                borderRadius: 2,
                mx: 'auto',
                mb: 4,
              }}
            />
            <Typography
              variant="subtitle1"
              color="text.secondary"
              sx={{
                maxWidth: '700px',
                mx: 'auto',
                mb: 5,
                fontSize: { xs: '1rem', md: '1.1rem' },
                lineHeight: 1.8,
              }}
            >
              Our vision, mission, and objectives guide everything we do at Agape Lutheran Junior Seminary, from curriculum development to extracurricular activities and community engagement.
            </Typography>
          </Box>

          <Grid container spacing={4} className="responsive-grid">
            {coreValues.map((value, index) => (
              <Grid item xs={12} sm={6} md={4} key={value.value} className="staggered-item">
                <Paper
                  elevation={3}
                  sx={{
                    p: 4,
                    height: '100%',
                    borderRadius: 'var(--radius-lg)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      boxShadow: 'var(--shadow-lg)',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'primary.main',
                        mr: 2,
                        background: 'linear-gradient(45deg, var(--primary-color) 0%, var(--primary-light) 100%)',
                      }}
                    >
                      <CheckCircleOutlineIcon />
                    </Avatar>
                    <Typography variant="h5" fontWeight={700}>
                      {value.value}
                    </Typography>
                  </Box>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {value.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box
        ref={statsRef}
        sx={{
          background: 'linear-gradient(45deg, var(--primary-color) 0%, var(--primary-dark) 100%)',
          color: 'white',
          py: { xs: 6, md: 8 },
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
            opacity: 0.5,
          }
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {schoolStats.map((stat) => (
              <Grid
                item
                xs={6}
                md={3}
                key={stat.label}
                sx={{
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-10px)',
                  }
                }}
                className="staggered-item"
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 2,
                  }}
                >
                  <Box
                    sx={{
                      mb: 2,
                      color: 'secondary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 80,
                      height: 80,
                      borderRadius: 'var(--radius-circle)',
                      bgcolor: 'rgba(255,255,255,0.1)',
                      boxShadow: 'var(--shadow-md)',
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Typography
                    variant="h3"
                    className="stat-number"
                    sx={{
                      fontWeight: 800,
                      mb: 1,
                      fontSize: { xs: '2rem', md: '3rem' },
                      background: 'linear-gradient(45deg, #fff, rgba(255,255,255,0.8))',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {stat.number}
                  </Typography>
                  <Typography
                    variant="h6"
                    className="stat-label"
                    sx={{
                      fontWeight: 500,
                      opacity: 0.9,
                      fontSize: { xs: '0.9rem', md: '1.1rem' },
                    }}
                  >
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default AboutPage;


