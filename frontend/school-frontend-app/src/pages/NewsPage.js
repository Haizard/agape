import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Card, CardContent, CardMedia, Box, CircularProgress } from '@mui/material';
import axios from 'axios';

const NewsPage = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await axios.get('/api/news');
        setNews(response.data);
      } catch (error) {
        console.error('Error fetching news:', error);
        // Use fallback data if API fails
        setNews([
          {
            title: "Annual Science Fair 2024",
            date: "May 15, 2024",
            content: "Join us for an exciting showcase of student projects...",
            image: "/images/science-fair.jpg"
          },
          {
            title: "Sports Day Champions",
            date: "May 10, 2024",
            content: "Congratulations to all participants and winners...",
            image: "/images/sports-day.jpg"
          },
          {
            title: "Academic Excellence Awards",
            date: "May 5, 2024",
            content: "Celebrating our top performing students...",
            image: "/images/awards.jpg"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="fade-in">
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h2" gutterBottom>
          School News & Events
        </Typography>

        <Grid container spacing={4} className="responsive-grid">
          {news.map((item, index) => (
            <Grid item xs={12} sm={6} md={6} key={item.id || index} className="staggered-item">
              <Card sx={{
                height: '100%',
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
              }}>
                <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                  <CardMedia
                    component="img"
                    height="300"
                    image={item.image}
                    alt={item.title}
                    sx={{
                      transition: 'transform 0.5s ease',
                    }}
                  />
                </Box>
                <CardContent>
                  <Typography variant="subtitle1" color="primary">
                    {item.date}
                  </Typography>
                  <Typography variant="h5" gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body1">
                    {item.content}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default NewsPage;