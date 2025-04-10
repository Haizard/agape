import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Paper,
  Divider,
  Chip,
  useTheme,
  useMediaQuery,
  IconButton,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SchoolIcon from '@mui/icons-material/School';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupIcon from '@mui/icons-material/Group';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import Carousel from 'react-material-ui-carousel';

const HomePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Refs for scroll animations
  const statsRef = useRef(null);
  const newsRef = useRef(null);
  const featuresRef = useRef(null);

  // Scroll animation effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;

      // Animate stats section
      if (statsRef.current && scrollPosition > statsRef.current.offsetTop + 100) {
        statsRef.current.classList.add('fade-in');
      }

      // Animate news section
      if (newsRef.current && scrollPosition > newsRef.current.offsetTop + 100) {
        newsRef.current.classList.add('fade-in');
      }

      // Animate features section
      if (featuresRef.current && scrollPosition > featuresRef.current.offsetTop + 100) {
        featuresRef.current.classList.add('fade-in');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const carouselItems = [
    {
      id: 'carousel-1',
      image: '/images/school-1.jpg',
      title: 'Welcome to AGAPE LUTHERAN JUNIOR SEMINARY',
      description: 'Where Excellence Meets Education',
      buttonText: 'Learn More',
      buttonLink: '/about',
    },
    {
      id: 'carousel-2',
      image: '/images/school-2.jpg',
      title: 'State-of-the-Art Facilities',
      description: 'Modern classrooms and laboratories for enhanced learning',
      buttonText: 'View Facilities',
      buttonLink: '/academics',
    },
    {
      id: 'carousel-3',
      image: '/images/school-3.jpg',
      title: 'Sports and Recreation',
      description: 'Comprehensive sports programs for all-round development',
      buttonText: 'Explore Programs',
      buttonLink: '/academics',
    },
  ];

  const newsItems = [
    {
      id: 'news-1',
      title: 'Annual Science Fair 2024',
      date: 'May 15, 2024',
      image: '/images/science-fair.jpg',
      excerpt: 'Students showcase innovative projects at our annual science exhibition.',
      tag: 'Event',
    },
    {
      id: 'news-2',
      title: 'Sports Day Champions',
      date: 'May 10, 2024',
      image: '/images/sports-day.jpg',
      excerpt: 'Our school team brings home the trophy from the inter-school competition.',
      tag: 'Sports',
    },
    {
      id: 'news-3',
      title: 'Academic Excellence Awards',
      date: 'May 5, 2024',
      image: '/images/awards.jpg',
      excerpt: 'Recognizing outstanding student achievements in academics and extracurriculars.',
      tag: 'Awards',
    },
  ];

  const stats = [
    { id: 'stat-1', number: '1000+', label: 'Students', icon: <GroupIcon fontSize="large" /> },
    { id: 'stat-2', number: '100+', label: 'Teachers', icon: <SchoolIcon fontSize="large" /> },
    { id: 'stat-3', number: '50+', label: 'Years of Excellence', icon: <HistoryEduIcon fontSize="large" /> },
    { id: 'stat-4', number: '95%', label: 'Success Rate', icon: <EmojiEventsIcon fontSize="large" /> },
  ];

  return (
    <Box sx={{ pt: { xs: 8, md: 9 } }}>
      {/* Hero Carousel */}
      <Carousel
        animation="slide"
        interval={6000}
        navButtonsAlwaysVisible={!isMobile}
        indicators={true}
        sx={{
          height: { xs: '60vh', sm: '70vh', md: '80vh' },
          '& .MuiButtonBase-root': {
            color: 'white',
            bgcolor: 'rgba(0,0,0,0.3)',
            '&:hover': {
              bgcolor: 'rgba(0,0,0,0.5)',
            }
          },
          '& .MuiPaginationItem-root': {
            color: 'white',
          }
        }}
      >
        {carouselItems.map((item) => (
          <Box
            key={item.id}
            sx={{
              height: '100%',
              backgroundImage: `url(${item.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)',
                zIndex: 1,
              }
            }}
          >
            <Container
              maxWidth="lg"
              sx={{
                position: 'relative',
                color: 'white',
                textAlign: 'left',
                zIndex: 2,
                py: { xs: 4, md: 6 },
              }}
            >
              <Box sx={{ maxWidth: { xs: '100%', md: '60%' } }}>
                <Typography
                  variant="h1"
                  className="slide-in-left"
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
                  {item.title}
                </Typography>
                <Typography
                  variant="h5"
                  className="slide-in-left"
                  sx={{
                    mb: 4,
                    fontWeight: 400,
                    fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
                    textShadow: '0 2px 5px rgba(0,0,0,0.3)',
                    opacity: 0.9,
                    maxWidth: '90%',
                    animationDelay: '0.2s',
                  }}
                >
                  {item.description}
                </Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  component={Link}
                  to={item.buttonLink}
                  endIcon={<ArrowForwardIcon />}
                  className="slide-in-left"
                  sx={{
                    mt: 2,
                    fontWeight: 600,
                    px: 4,
                    py: 1.5,
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(45deg, var(--secondary-color) 30%, var(--secondary-light) 90%)',
                    boxShadow: 'var(--shadow-md)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: 'var(--shadow-lg)',
                    },
                    animationDelay: '0.4s',
                  }}
                >
                  {item.buttonText}
                </Button>
              </Box>
            </Container>
          </Box>
        ))}
      </Carousel>

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
            {stats.map((stat) => (
              <Grid
                item
                xs={6}
                md={3}
                key={stat.id}
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

      {/* Latest News Section */}
      <Box
        ref={newsRef}
        sx={{
          py: { xs: 6, md: 10 },
          background: 'var(--background-light)',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ mb: 5, textAlign: { xs: 'center', md: 'left' } }}>
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
              STAY UPDATED
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
              Latest News & Events
            </Typography>
            <Divider
              sx={{
                width: { xs: '80px', md: '120px' },
                borderWidth: '4px',
                borderColor: 'secondary.main',
                borderRadius: 2,
                mx: { xs: 'auto', md: 0 },
                mb: 4,
              }}
            />
          </Box>

          <Grid container spacing={4} className="responsive-grid">
            {newsItems.map((news) => (
              <Grid item xs={12} sm={6} md={4} key={news.id} className="staggered-item">
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-md)',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                    '&:hover': {
                      transform: 'translateY(-12px)',
                      boxShadow: 'var(--shadow-lg)',
                      '& .MuiCardMedia-root': {
                        transform: 'scale(1.05)',
                      }
                    }
                  }}
                >
                  <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                    <CardMedia
                      component="img"
                      height="220"
                      image={news.image}
                      alt={news.title}
                      sx={{
                        transition: 'transform 0.5s ease',
                      }}
                    />
                    <Chip
                      label={news.tag}
                      color="secondary"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        fontWeight: 600,
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    />
                  </Box>
                  <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography
                      variant="subtitle2"
                      color="primary"
                      sx={{
                        mb: 1,
                        fontWeight: 600,
                        fontSize: '0.8rem',
                      }}
                    >
                      {news.date}
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        mb: 2,
                        fontSize: { xs: '1.2rem', md: '1.4rem' },
                        lineHeight: 1.3,
                      }}
                    >
                      {news.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        flexGrow: 1,
                      }}
                    >
                      {news.excerpt}
                    </Typography>
                    <Button
                      variant="text"
                      color="primary"
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        alignSelf: 'flex-start',
                        fontWeight: 600,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateX(5px)',
                        }
                      }}
                    >
                      Read More
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box
        ref={featuresRef}
        sx={{
          background: 'linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)',
          py: { xs: 6, md: 10 },
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '30%',
            background: 'linear-gradient(to top, rgba(255,255,255,0.8), rgba(255,255,255,0))',
            pointerEvents: 'none',
          }
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ mb: 5, textAlign: 'center' }}>
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
              OUR STRENGTHS
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
              Why Choose Us?
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
              }}
            >
              At AGAPE LUTHERAN JUNIOR SEMINARY, we provide a comprehensive educational experience that prepares students for success in all aspects of life.
            </Typography>
          </Box>

          <Grid container spacing={4} className="responsive-grid">
            {[
              {
                id: 'feature-1',
                title: 'Academic Excellence',
                description: 'Consistently high academic achievements and university placements with personalized learning approaches.',
                image: '/images/academic.jpg',
              },
              {
                id: 'feature-2',
                title: 'Holistic Development',
                description: 'Focus on sports, arts, and character development to nurture well-rounded individuals ready for the future.',
                image: '/images/holistic.jpg',
              },
              {
                id: 'feature-3',
                title: 'Modern Facilities',
                description: 'State-of-the-art labs, libraries, and sports facilities designed to enhance the learning experience.',
                image: '/images/facilities.jpg',
              },
            ].map((feature) => (
              <Grid item xs={12} sm={6} md={4} key={feature.id} className="staggered-item">
                <Paper
                  elevation={3}
                  sx={{
                    height: '100%',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      boxShadow: 'var(--shadow-lg)',
                    }
                  }}
                >
                  <Box sx={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
                    <CardMedia
                      component="img"
                      height="220"
                      image={feature.image}
                      alt={feature.title}
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
                        right: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0))',
                        p: 2,
                        pt: 4,
                      }}
                    >
                      <Typography
                        variant="h5"
                        sx={{
                          color: 'white',
                          fontWeight: 700,
                          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        }}
                      >
                        {feature.title}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ p: 3 }}>
                    <Typography
                      variant="body1"
                      sx={{
                        color: 'text.secondary',
                        mb: 2,
                        lineHeight: 1.6,
                      }}
                    >
                      {feature.description}
                    </Typography>
                    <Button
                      variant="outlined"
                      color="primary"
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        fontWeight: 600,
                        borderWidth: 2,
                        '&:hover': {
                          borderWidth: 2,
                          bgcolor: 'rgba(46, 49, 146, 0.05)',
                        }
                      }}
                    >
                      Learn More
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;


