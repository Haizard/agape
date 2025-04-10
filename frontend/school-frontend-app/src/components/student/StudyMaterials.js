import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, IconButton } from '@mui/material';
import { Download as DownloadIcon, Visibility as VisibilityIcon } from '@mui/icons-material';

const StudyMaterials = () => {
  const [materials, setMaterials] = useState([]);

  // Temporary mock data - replace with actual API call
  useEffect(() => {
    const mockMaterials = [
      {
        id: 1,
        title: 'Mathematics Chapter 1 Notes',
        subject: 'Mathematics',
        type: 'PDF',
        uploadDate: '2024-03-01'
      },
      {
        id: 2,
        title: 'Physics Lab Manual',
        subject: 'Physics',
        type: 'PDF',
        uploadDate: '2024-03-02'
      },
      {
        id: 3,
        title: 'English Literature Study Guide',
        subject: 'English',
        type: 'DOC',
        uploadDate: '2024-03-03'
      }
    ];
    setMaterials(mockMaterials);
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Study Materials</Typography>
      <Grid container spacing={3}>
        {materials.map((material) => (
          <Grid item xs={12} md={6} lg={4} key={material.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{material.title}</Typography>
                <Typography color="textSecondary">{material.subject}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Type: {material.type}
                </Typography>
                <Typography variant="body2">
                  Uploaded: {material.uploadDate}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <IconButton size="small" color="primary">
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton size="small" color="primary">
                    <DownloadIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default StudyMaterials;