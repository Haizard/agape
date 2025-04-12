import React, { useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Paper,
  Divider,
  Avatar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import HotelIcon from '@mui/icons-material/Hotel';
import DomainIcon from '@mui/icons-material/Domain';
import GroupIcon from '@mui/icons-material/Group';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import ComputerIcon from '@mui/icons-material/Computer';
import MenuBookIcon from '@mui/icons-material/MenuBook';

const CampusLifePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Refs for scroll animations
  const enrollmentRef = useRef(null);
  const accommodationRef = useRef(null);
  const infrastructureRef = useRef(null);

  // Scroll animation effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;

      // Animate sections when scrolled into view
      if (enrollmentRef.current && scrollPosition > enrollmentRef.current.offsetTop + 100) {
        enrollmentRef.current.classList.add('fade-in');
      }

      if (accommodationRef.current && scrollPosition > accommodationRef.current.offsetTop + 100) {
        accommodationRef.current.classList.add('fade-in');
      }

      if (infrastructureRef.current && scrollPosition > infrastructureRef.current.offsetTop + 100) {
        infrastructureRef.current.classList.add('fade-in');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
                STUDENT LIFE
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
                Campus Life
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
                Experience the vibrant and enriching environment at Agape Lutheran Junior Seminary, where students thrive academically, socially, and spiritually.
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

      {/* School Enrollment Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }} ref={enrollmentRef}>
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
            ENROLLMENT
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
            School Enrollment
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
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
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
                  <GroupIcon />
                </Avatar>
                <Typography variant="h5" fontWeight={700}>
                  Student Capacity
                </Typography>
              </Box>
              <Typography variant="body1" paragraph sx={{ mb: 3, lineHeight: 1.8 }}>
                The school enrolls 120 Ordinary Level students and 60 Advanced Level students per year. There are 3 streams in Ordinary Level and 9 combinations in Advanced Level.
              </Typography>
              <Typography variant="body1" paragraph sx={{ mb: 3, lineHeight: 1.8 }}>
                Class size: maximum 40 students in O-Level, maximum 30 in A-Level. Students come from Lutheran and other Protestant churches under CCT.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
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
                  <SchoolIcon />
                </Avatar>
                <Typography variant="h5" fontWeight={700}>
                  Admission Process
                </Typography>
              </Box>
              <Typography variant="body1" paragraph sx={{ mb: 3, lineHeight: 1.8 }}>
                The Seminary provides forms and entrance exams for prospective students. Qualified students sign a contract to adhere to Seminary Rules and Regulations.
              </Typography>
              <Typography variant="body1" paragraph sx={{ mb: 3, lineHeight: 1.8 }}>
                Our admission process ensures we select students who will thrive in our academic environment and contribute positively to our school community.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Accommodation Section */}
      <Box
        sx={{
          bgcolor: 'grey.50',
          py: 8,
          mb: 8,
        }}
        ref={accommodationRef}
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
              STUDENT LIFE
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
              Accommodation & Services
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
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card
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
                <CardMedia
                  component="img"
                  height="200"
                  image="/images/web content.jpg"
                  alt="Boarding Facilities"
                />
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'primary.main',
                        mr: 2,
                        background: 'linear-gradient(45deg, var(--primary-color) 0%, var(--primary-light) 100%)',
                      }}
                    >
                      <HotelIcon />
                    </Avatar>
                    <Typography variant="h5" fontWeight={700}>
                      Boarding Facilities
                    </Typography>
                  </Box>
                  <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
                    The Seminary offers quality boarding for boys and girls. Our dormitories provide a comfortable and safe living environment for all students.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card
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
                <CardMedia
                  component="img"
                  height="200"
                  image="/images/web content1.jpg"
                  alt="Dining Services"
                />
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'primary.main',
                        mr: 2,
                        background: 'linear-gradient(45deg, var(--primary-color) 0%, var(--primary-light) 100%)',
                      }}
                    >
                      <RestaurantIcon />
                    </Avatar>
                    <Typography variant="h5" fontWeight={700}>
                      Dining Services
                    </Typography>
                  </Box>
                  <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
                    Students receive enough and delicious food from the school dining hall. Our menu is designed to provide balanced nutrition to support students' growth and learning.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card
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
                <CardMedia
                  component="img"
                  height="200"
                  image="/images/web content.jpg"
                  alt="Health Services"
                />
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'primary.main',
                        mr: 2,
                        background: 'linear-gradient(45deg, var(--primary-color) 0%, var(--primary-light) 100%)',
                      }}
                    >
                      <LocalHospitalIcon />
                    </Avatar>
                    <Typography variant="h5" fontWeight={700}>
                      Health Services
                    </Typography>
                  </Box>
                  <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
                    Health services are available in school and nearby hospitals. We have a school nurse on duty and arrangements with local medical facilities for more serious health concerns.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Infrastructure Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }} ref={infrastructureRef}>
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
            FACILITIES
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
            Infrastructure
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
            Our modern infrastructure provides an ideal environment for learning and personal development.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6} lg={3}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                height: '100%',
                borderRadius: 'var(--radius-lg)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-10px)',
                  boxShadow: 'var(--shadow-lg)',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    mr: 2,
                    background: 'linear-gradient(45deg, var(--primary-color) 0%, var(--primary-light) 100%)',
                  }}
                >
                  <DomainIcon />
                </Avatar>
                <Typography variant="h6" fontWeight={700}>
                  Classrooms
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                Modern, well-ventilated classrooms equipped with the latest teaching aids to facilitate effective learning.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                height: '100%',
                borderRadius: 'var(--radius-lg)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-10px)',
                  boxShadow: 'var(--shadow-lg)',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    mr: 2,
                    background: 'linear-gradient(45deg, var(--primary-color) 0%, var(--primary-light) 100%)',
                  }}
                >
                  <MenuBookIcon />
                </Avatar>
                <Typography variant="h6" fontWeight={700}>
                  Science Labs
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                Fully equipped science laboratories for Physics, Chemistry, and Biology to provide hands-on learning experiences.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                height: '100%',
                borderRadius: 'var(--radius-lg)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-10px)',
                  boxShadow: 'var(--shadow-lg)',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    mr: 2,
                    background: 'linear-gradient(45deg, var(--primary-color) 0%, var(--primary-light) 100%)',
                  }}
                >
                  <ComputerIcon />
                </Avatar>
                <Typography variant="h6" fontWeight={700}>
                  Computer Lab
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                State-of-the-art computer laboratory with internet access to develop digital literacy and research skills.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                height: '100%',
                borderRadius: 'var(--radius-lg)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-10px)',
                  boxShadow: 'var(--shadow-lg)',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    mr: 2,
                    background: 'linear-gradient(45deg, var(--primary-color) 0%, var(--primary-light) 100%)',
                  }}
                >
                  <MenuBookIcon />
                </Avatar>
                <Typography variant="h6" fontWeight={700}>
                  Library
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                Comprehensive library with a wide collection of books, journals, and digital resources to support academic research and reading.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default CampusLifePage;
