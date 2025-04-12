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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ScienceIcon from '@mui/icons-material/Science';
import ComputerIcon from '@mui/icons-material/Computer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const AcademicsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Refs for scroll animations
  const curriculumRef = useRef(null);
  const achievementsRef = useRef(null);

  // Scroll animation effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;

      // Animate sections when scrolled into view
      if (curriculumRef.current && scrollPosition > curriculumRef.current.offsetTop + 100) {
        curriculumRef.current.classList.add('fade-in');
      }

      if (achievementsRef.current && scrollPosition > achievementsRef.current.offsetTop + 100) {
        achievementsRef.current.classList.add('fade-in');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // A-Level subject combinations
  const subjectCombinations = [
    { code: 'PCM', subjects: 'Physics, Chemistry, Mathematics' },
    { code: 'PCB', subjects: 'Physics, Chemistry, Biology' },
    { code: 'PGM', subjects: 'Physics, Geography, Mathematics' },
    { code: 'EGM', subjects: 'Economics, Geography, Mathematics' },
    { code: 'HGL', subjects: 'History, Geography, Literature' },
    { code: 'HGK', subjects: 'History, Geography, Kiswahili' },
    { code: 'HKL', subjects: 'History, Kiswahili, Literature' },
    { code: 'HGE', subjects: 'History, Geography, Economics' },
  ];

  // Exam achievements
  const examAchievements = [
    {
      level: 'A-Level',
      year: '2022',
      results: [
        { division: 'Division One', count: 40 },
        { division: 'Division Two', count: 8 },
      ],
      positions: [
        { type: 'National Position', rank: '27/644' },
        { type: 'Regional Position', rank: '3/51' },
        { type: 'District Position', rank: '1/18' },
      ]
    },
    {
      level: 'O-Level',
      year: '2021',
      results: [
        { division: 'Division One', count: 59 },
        { division: 'Division Two', count: 35 },
      ],
      positions: [
        { type: 'Regional Position', rank: '11/271' },
      ]
    },
    {
      level: 'O-Level',
      year: '2020',
      results: [
        { division: 'Division One', count: 49 },
        { division: 'Division Two', count: 23 },
      ],
      positions: []
    },
  ];

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
                EDUCATION
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
                Academic Programs
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
                Excellence in education with a focus on science subjects and Christian values.
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

      {/* Curriculum Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }} ref={curriculumRef}>
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
            CURRICULUM
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
            Our Academic Curriculum
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
                  <MenuBookIcon />
                </Avatar>
                <Typography variant="h5" fontWeight={700}>
                  Curriculum Overview
                </Typography>
              </Box>
              <Typography variant="body1" paragraph sx={{ mb: 3, lineHeight: 1.8 }}>
                The seminary follows the State curriculum as well as religious instructions based on the theology of the Lutheran Church.
              </Typography>
              <Typography variant="body1" paragraph sx={{ mb: 3, lineHeight: 1.8 }}>
                It offers secular subjects and Bible knowledge in Ordinary level. In Advanced level, the subject combinations are PCM, PCB, PGM, EGM, HGL, HGK, HKL, HGE.
              </Typography>
              <Typography variant="body1" paragraph sx={{ mb: 3, lineHeight: 1.8 }}>
                General studies is compulsory in all combinations. Computer subject is optional to all.
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
                  <ScienceIcon />
                </Avatar>
                <Typography variant="h5" fontWeight={700}>
                  A-Level Subject Combinations
                </Typography>
              </Box>
              <Grid container spacing={2}>
                {subjectCombinations.map((combo, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Card sx={{ height: '100%', bgcolor: 'grey.50' }}>
                      <CardContent>
                        <Typography variant="h6" color="primary" gutterBottom>
                          {combo.code}
                        </Typography>
                        <Typography variant="body2">
                          {combo.subjects}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Achievements Section */}
      <Box
        ref={achievementsRef}
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
              EXCELLENCE
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
              Achievements in National Exams
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

          <Grid container spacing={4} className="responsive-grid">
            {examAchievements.map((achievement, index) => (
              <Grid item xs={12} md={4} key={index} className="staggered-item">
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
                      <EmojiEventsIcon />
                    </Avatar>
                    <Typography variant="h5" fontWeight={700}>
                      {achievement.level} {achievement.year}
                    </Typography>
                  </Box>

                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    Results:
                  </Typography>
                  <List dense>
                    {achievement.results.map((result, idx) => (
                      <ListItem key={idx}>
                        <ListItemIcon>
                          <CheckCircleIcon color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${result.division}: ${result.count}`}
                        />
                      </ListItem>
                    ))}
                  </List>

                  {achievement.positions.length > 0 && (
                    <>
                      <Typography variant="subtitle1" color="primary" gutterBottom sx={{ mt: 2 }}>
                        Rankings:
                      </Typography>
                      <List dense>
                        {achievement.positions.map((position, idx) => (
                          <ListItem key={idx}>
                            <ListItemIcon>
                              <EmojiEventsIcon color="secondary" />
                            </ListItemIcon>
                            <ListItemText
                              primary={`${position.type}: ${position.rank}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default AcademicsPage;
