import React from 'react';
import { Container, Typography, Grid, Card, CardContent, CardMedia, Box } from '@mui/material';

const AcademicsPage = () => {
  const programs = [
    {
      title: "Primary Education",
      grades: "Grades 1-5",
      description: "Foundation years focusing on core subjects and character development",
      image: "/images/primary-education.jpg"
    },
    {
      title: "Middle School",
      grades: "Grades 6-8",
      description: "Expanding knowledge with specialized subjects and activities",
      image: "/images/middle-school.jpg"
    },
    {
      title: "High School",
      grades: "Grades 9-12",
      description: "College preparation with advanced courses and career guidance",
      image: "/images/high-school.jpg"
    }
  ];

  return (
    <Box className="fade-in">
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h2" gutterBottom>
          Academic Programs
        </Typography>

        <Grid container spacing={4}>
          {programs.map((program, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={program.image}
                  alt={program.title}
                />
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    {program.title}
                  </Typography>
                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    {program.grades}
                  </Typography>
                  <Typography variant="body1">
                    {program.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 8 }}>
          <Typography variant="h4" gutterBottom>
            Special Programs
          </Typography>
          <Grid container spacing={4}>
            {[
              {
                title: "STEM Program",
                description: "Advanced courses in Science, Technology, Engineering, and Mathematics"
              },
              {
                title: "Arts & Music",
                description: "Comprehensive visual and performing arts education"
              },
              {
                title: "Sports Excellence",
                description: "Competitive sports programs and physical education"
              }
            ].map((program, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h5" gutterBottom>
                      {program.title}
                    </Typography>
                    <Typography variant="body1">
                      {program.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default AcademicsPage;