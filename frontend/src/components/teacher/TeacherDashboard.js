import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Tabs,
  Tab
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Book as BookIcon,
  Assignment as AssignmentIcon,
  Add as AddIcon,
  ViewList as ViewListIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ClassService from '../../services/classService';
import SubjectService from '../../services/subjectService';

const TeacherDashboard = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        setLoading(true);
        
        // Fetch teacher's classes and subjects
        const [classesResponse, subjectsResponse] = await Promise.all([
          ClassService.getTeacherClasses(currentUser.id),
          SubjectService.getTeacherSubjects(currentUser.id)
        ]);
        
        setClasses(classesResponse);
        setSubjects(subjectsResponse);
      } catch (error) {
        console.error('Error fetching teacher data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser && currentUser.id) {
      fetchTeacherData();
    }
  }, [currentUser]);
  
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Container maxWidth="xl">
        <Typography variant="h4" gutterBottom>
          Teacher Dashboard
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader title="Quick Actions" />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      component={Link}
                      to="/teacher/enter-marks"
                      startIcon={<AddIcon />}
                      sx={{ py: 2 }}
                    >
                      Enter Student Marks
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="contained"
                      color="secondary"
                      fullWidth
                      component={Link}
                      to="/teacher/batch-marks"
                      startIcon={<ViewListIcon />}
                      sx={{ py: 2 }}
                    >
                      Batch Marks Entry
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            <Card sx={{ mt: 3 }}>
              <CardHeader title="My Classes" />
              <Divider />
              <CardContent>
                {loading ? (
                  <Typography>Loading classes...</Typography>
                ) : classes.length > 0 ? (
                  <List>
                    {classes.map((classItem) => (
                      <ListItem key={classItem._id}>
                        <ListItemIcon>
                          <SchoolIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${classItem.name} ${classItem.section || ''} ${classItem.stream || ''}`}
                          secondary={`Academic Year: ${classItem.academicYear?.name || 'N/A'}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography>No classes assigned yet.</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="My Subjects" />
              <Divider />
              <CardContent>
                {loading ? (
                  <Typography>Loading subjects...</Typography>
                ) : subjects.length > 0 ? (
                  <List>
                    {subjects.map((subject) => (
                      <ListItem key={subject._id}>
                        <ListItemIcon>
                          <BookIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={subject.name}
                          secondary={`Code: ${subject.code}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography>No subjects assigned yet.</Typography>
                )}
              </CardContent>
            </Card>
            
            <Card sx={{ mt: 3 }}>
              <CardHeader title="Recent Activity" />
              <Divider />
              <CardContent>
                <Typography variant="body2" color="textSecondary">
                  Your recent activities will appear here.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default TeacherDashboard;
