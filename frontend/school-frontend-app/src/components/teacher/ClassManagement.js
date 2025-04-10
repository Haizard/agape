import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import axios from 'axios';

const ClassList = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await axios.get('/api/teacher/classes');
      setClasses(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch classes');
      setLoading(false);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Grid container spacing={3}>
      {classes.map((classItem) => (
        <Grid item xs={12} sm={6} md={4} key={classItem._id}>
          <Card>
            <CardContent>
              <Typography variant="h6">{classItem.name}</Typography>
              <Typography color="textSecondary">
                Students: {classItem.studentCount}
              </Typography>
              <Typography color="textSecondary">
                Subjects: {classItem.subjects.length}
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                onClick={() => navigate(`/teacher/classes/${classItem._id}`)}
              >
                View Details
              </Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

const ClassDetails = () => {
  const [classDetails, setClassDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchClassDetails();
  }, []);

  const fetchClassDetails = async () => {
    try {
      const classId = window.location.pathname.split('/').pop();
      const response = await axios.get(`/api/teacher/classes/${classId}`);
      setClassDetails(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch class details');
      setLoading(false);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!classDetails) return null;

  return (
    <Box>
      <Button onClick={() => navigate('/teacher/classes')}>Back to Classes</Button>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="h5" gutterBottom>
          {classDetails.name}
        </Typography>
        
        <Typography variant="h6" sx={{ mt: 3 }}>Students</Typography>
        <List>
          {classDetails.students.map((student) => (
            <ListItem key={student._id}>
              <ListItemText 
                primary={student.name}
                secondary={`Roll Number: ${student.rollNumber}`}
              />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6">Subjects</Typography>
        <List>
          {classDetails.subjects.map((subject) => (
            <ListItem key={subject._id}>
              <ListItemText 
                primary={subject.name}
                secondary={`Teacher: ${subject.teacher.name}`}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

const TeacherClassManagement = () => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Class Management</Typography>
      <Routes>
        <Route index element={<ClassList />} />
        <Route path=":classId" element={<ClassDetails />} />
      </Routes>
    </Box>
  );
};

export default TeacherClassManagement;
