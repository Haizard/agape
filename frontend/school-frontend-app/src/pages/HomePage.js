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
import { motion } from 'framer-motion';

// Import custom animation components
import { FadeIn, ScaleIn, StaggerContainer, StaggerItem, ParallaxScroll } from '../components/animations';
import {
  GlassmorphicCard,
  AnimatedButton,
  GradientText,
  AnimatedCounter,
  ArtisticCard,
  ArtisticButton,
  ArtisticText,
  ArtisticDivider,
  // Image components
  OptimizedImage,
  HeroBanner,
  FeatureCard,
  ImageCarousel,
  SectionBackground,
  ProfileCard,
  FormIllustration
} from '../components/ui';

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
      src: '/assets/images/carousel/slide1.jpg',
      alt: 'Welcome to Agape Lutheran Junior Seminary',
      caption: 'Welcome to AGAPE LUTHERAN JUNIOR SEMINARY',
      description: 'Agape, A Beacon of truth - "Surely I have a delightful inheritance" – Psalms 16:6b',
    },
    {
      id: 'carousel-2',
      src: '/assets/images/carousel/slide2.jpg',
      alt: 'State-of-the-Art Facilities',
      caption: 'State-of-the-Art Facilities',
      description: 'Modern classrooms and laboratories for enhanced learning',
    },
    {
      id: 'carousel-3',
      src: '/assets/images/carousel/slide3.jpg',
      alt: 'Sports and Recreation',
      caption: 'Sports and Recreation',
      description: 'Comprehensive sports programs for all-round development',
    },
  ];

  const newsItems = [
    {
      id: 'news-1',
      title: 'Annual Science Fair 2024',
      date: 'May 15, 2024',
      image: '/assets/images/features/feature1.jpg',
      excerpt: 'Students showcase innovative projects at our annual science exhibition.',
      tag: 'Event',
    },
    {
      id: 'news-2',
      title: 'Sports Day Champions',
      date: 'May 10, 2024',
      image: '/assets/images/features/feature2.jpg',
      excerpt: 'Our school team brings home the trophy from the inter-school competition.',
      tag: 'Sports',
    },
    {
      id: 'news-3',
      title: 'Academic Excellence Awards',
      date: 'May 5, 2024',
      image: '/assets/images/backgrounds/about-bg.jpg',
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
      <Box sx={{ pt: { xs: 0, md: 0 } }}>
        <ImageCarousel
          images={carouselItems}
          height={{ xs: '60vh', sm: '70vh', md: '80vh' }}
          autoPlay={true}
          interval={6000}
          showArrows={true}
          showDots={true}
          showCaptions={true}
          overlay={true}
          overlayGradient="linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)"
        />
      </Box>

      {/* Stats Section */}
      <SectionBackground
        ref={statsRef}
        backgroundImage="/assets/images/backgrounds/hero-bg.jpg"
        overlay={true}
        overlayGradient="linear-gradient(45deg, rgba(37, 99, 235, 0.9) 0%, rgba(59, 130, 246, 0.8) 100%)"
        py={{ xs: 6, md: 8 }}
        maxWidth="lg"
      >
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
                  <AnimatedCounter
                    end={Number.parseInt(stat.number.replace(/[^0-9]/g, ''), 10)}
                    duration={2.5}
                    prefix={stat.number.startsWith('+') ? '+' : ''}
                    suffix={stat.number.includes('%') ? '%' : ''}
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      mb: 1,
                      fontSize: { xs: '2rem', md: '3rem' },
                      background: 'linear-gradient(45deg, #fff, rgba(255,255,255,0.8))',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  />
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
      </SectionBackground>

      {/* Latest News Section */}
      <SectionBackground
        ref={newsRef}
        py={{ xs: 6, md: 10 }}
        maxWidth="lg"
      >
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
            <ArtisticText
              variant="h2"
              effect="gradient"
              gradient="linear-gradient(45deg, #2563EB, #60A5FA, #8B5CF6)"
              gradientAnimation
              fontWeight={700}
              letterSpacing="-0.02em"
              sx={{
                mb: 2,
                fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.8rem' },
              }}
            >
              Latest News & Events
            </ArtisticText>
            <ArtisticDivider
              variant="gradient"
              gradient="linear-gradient(90deg, #2563EB, #8B5CF6, #2563EB)"
              thickness={4}
              length={{ xs: '80px', md: '120px' }}
              spacing={4}
              sx={{
                borderRadius: 'var(--radius-md)',
                mx: { xs: 'auto', md: 0 },
              }}
            />
          </Box>

          <StaggerContainer>
            <Grid container spacing={4} className="responsive-grid">
              {newsItems.map((news) => (
                <Grid item xs={12} sm={6} md={4} key={news.id}>
                <StaggerItem direction="up">
                  <ArtisticCard
                    variant="glass"
                    hoverEffect="lift"
                    cornerRadius="large"
                    shadowDepth="medium"
                    hoverShadowDepth="large"
                    borderAccent
                    borderSide="top"
                    borderWidth={3}
                    borderColor={news.tag === 'Academic' ? 'primary.main' : news.tag === 'Sports' ? 'success.main' : 'secondary.main'}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      '&:hover .MuiCardMedia-root': {
                        transform: 'scale(1.05)',
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
                      color={news.tag === 'Academic' ? 'primary' : news.tag === 'Sports' ? 'success' : 'secondary'}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        fontWeight: 600,
                        boxShadow: 'var(--shadow-md)',
                        borderRadius: 'var(--radius-pill)',
                        px: 1.5,
                        backdropFilter: 'blur(8px)',
                        backgroundColor: news.tag === 'Academic'
                          ? 'rgba(59, 130, 246, 0.85)'
                          : news.tag === 'Sports'
                            ? 'rgba(16, 185, 129, 0.85)'
                            : 'rgba(139, 92, 246, 0.85)',
                      }}
                    />
                  </Box>
                  <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <ArtisticText
                      variant="subtitle2"
                      color={news.tag === 'Academic' ? 'primary' : news.tag === 'Sports' ? 'success' : 'secondary'}
                      fontWeight={600}
                      letterSpacing="0.5px"
                      sx={{
                        mb: 1,
                        fontSize: '0.8rem',
                      }}
                    >
                      {news.date}
                    </ArtisticText>
                    <ArtisticText
                      variant="h5"
                      effect="gradient"
                      gradient={news.tag === 'Academic'
                        ? 'linear-gradient(45deg, #2563EB, #60A5FA)'
                        : news.tag === 'Sports'
                          ? 'linear-gradient(45deg, #0D9488, #2DD4BF)'
                          : 'linear-gradient(45deg, #8B5CF6, #A78BFA)'}
                      fontWeight={700}
                      sx={{
                        mb: 2,
                        fontSize: { xs: '1.2rem', md: '1.4rem' },
                        lineHeight: 1.3,
                      }}
                    >
                      {news.title}
                    </ArtisticText>
                    <ArtisticText
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        flexGrow: 1,
                      }}
                    >
                      {news.excerpt}
                    </ArtisticText>
                    <ArtisticButton
                      variant="ghost"
                      color={news.tag === 'Academic' ? 'primary' : news.tag === 'Sports' ? 'success' : 'secondary'}
                      endIcon={<ArrowForwardIcon />}
                      hoverEffect="none"
                      sx={{
                        alignSelf: 'flex-start',
                        fontWeight: 600,
                        '&:hover': {
                          transform: 'translateX(5px)',
                        }
                      }}
                    >
                      Read More
                    </ArtisticButton>
                  </CardContent>
                  </ArtisticCard>
                </StaggerItem>
              </Grid>
              ))}
            </Grid>
          </StaggerContainer>
      </SectionBackground>

      {/* Features Section */}
      <SectionBackground
        ref={featuresRef}
        backgroundImage="/assets/images/backgrounds/hero-bg.jpg"
        overlay={true}
        overlayGradient="linear-gradient(to bottom, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.8))"
        py={{ xs: 6, md: 10 }}
        maxWidth="lg"
      >
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
                image: '/assets/images/features/feature1.jpg',
                actionText: 'Learn More',
                actionLink: '/academics',
              },
              {
                id: 'feature-2',
                title: 'Holistic Development',
                description: 'Focus on sports, arts, and character development to nurture well-rounded individuals ready for the future.',
                image: '/assets/images/features/feature2.jpg',
                actionText: 'Explore Programs',
                actionLink: '/campus-life',
              },
              {
                id: 'feature-3',
                title: 'Modern Facilities',
                description: 'State-of-the-art labs, libraries, and sports facilities designed to enhance the learning experience.',
                image: '/assets/images/backgrounds/about-bg.jpg',
                actionText: 'View Facilities',
                actionLink: '/about',
              },
            ].map((feature) => (
              <Grid item xs={12} sm={6} md={4} key={feature.id} className="staggered-item">
                <FeatureCard
                  image={feature.image}
                  title={feature.title}
                  description={feature.description}
                  actionText={feature.actionText}
                  actionLink={feature.actionLink}
                  variant="vertical"
                  hoverEffect={true}
                  elevation={3}
                />
              </Grid>
            ))}
          </Grid>
      </SectionBackground>
    </Box>
  );
};

export default HomePage;


