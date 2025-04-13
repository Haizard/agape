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
            title: "School Farm Projects",
            date: "May 15, 2024",
            content: "The Seminary has a farm where we plant corn, vegetables, and bananas. We keep dairy cattle, goats, pigs, and poultry. All students are involved and encouraged to participate. The products subsidize food costs in the school.",
            image: "/images/web content.jpg"
          },
          {
            title: "Educational Study Tours",
            date: "May 10, 2024",
            content: "Students visit national, historical sites and geographical sites such as Hale Power Station, Amboni Caves, Mount Kilimanjaro, Serengeti, Ngorongoro and Manyara National Parks.",
            image: "/images/web content1.jpg"
          },
          {
            title: "Sports and Games",
            date: "May 5, 2024",
            content: "The Seminary values the physical health of students. There are several playgrounds for football, netball, basketball, and volleyball. Students participate in interschool competitions.",
            image: "/images/web content.jpg"
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