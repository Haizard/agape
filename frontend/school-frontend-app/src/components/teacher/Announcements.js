import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

const Announcements = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [priority, setPriority] = useState('normal');

  // Dummy data - replace with actual API calls
  const classes = ['All Classes', 'Class A', 'Class B', 'Class C'];
  const announcements = [
    {
      id: 1,
      title: 'Upcoming Parent-Teacher Meeting',
      content: 'Parent-teacher meeting scheduled for next Friday',
      date: '2024-03-10',
      class: 'All Classes',
      priority: 'high'
    },
    // Add more announcements
  ];

  const handleSubmit = () => {
    // Implement submit logic
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Announcements
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Create New Announcement
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Announcement Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Target Class</InputLabel>
              <Select
                value={selectedClass}
                label="Target Class"
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                {classes.map((cls) => (
                  <MenuItem key={cls} value={cls}>{cls}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Announcement Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={priority}
                label="Priority"
                onChange={(e) => setPriority(e.target.value)}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" color="primary" onClick={handleSubmit}>
              Post Announcement
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Typography variant="h6" gutterBottom>
        Recent Announcements
      </Typography>
      <Grid container spacing={2}>
        {announcements.map((announcement) => (
          <Grid item xs={12} key={announcement.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{announcement.title}</Typography>
                <Typography color="textSecondary">
                  Posted: {announcement.date} | Class: {announcement.class}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {announcement.content}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small">Edit</Button>
                <Button size="small" color="error">Delete</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Announcements;