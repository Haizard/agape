import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Avatar
} from '@mui/material';
import {
  Book as BookIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import SafeDisplay from '../common/SafeDisplay';

const StudentSubjects = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [studentClass, setStudentClass] = useState(null);
  const user = useSelector((state) => state.user?.user);

  const fetchStudentData = useCallback(async () => {
    if (!user || !user._id) {
      setError('User information not available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // First, get the student profile to find their class
      const studentResponse = await api.get(`/api/students/profile/${user._id}`);
      const student = studentResponse.data;

      if (!student || !student.class) {
        setError('Student class information not available');
        setLoading(false);
        return;
      }

      // Then, get the class details with subjects
      const classResponse = await api.get(`/api/classes/${student.class}`);
      const classData = classResponse.data;
      setStudentClass(classData);

      // Extract and format subjects
      const classSubjects = classData.subjects || [];

      // Get detailed information for each subject
      const subjectsWithDetails = classSubjects.map(subjectItem => ({
        id: subjectItem.subject._id,
        name: subjectItem.subject.name,
        code: subjectItem.subject.code,
        type: subjectItem.subject.type,
        description: subjectItem.subject.description,
        teacher: subjectItem.teacher ? {
          id: subjectItem.teacher._id,
          name: `${subjectItem.teacher.firstName} ${subjectItem.teacher.lastName}`,
          email: subjectItem.teacher.email
        } : null
      }));

      setSubjects(subjectsWithDetails);
      setError(null);
    } catch (err) {
      console.error('Error fetching student subjects:', err);
      setError(`Failed to load subjects: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!subjects.length) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No subjects are currently assigned to your class.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Subjects
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {studentClass ? (
            <>
              Class: <strong><SafeDisplay value={studentClass.name} /></strong>
              {studentClass.stream && ' - '}<SafeDisplay value={studentClass.stream} />
              {studentClass.section && ' ('}<SafeDisplay value={studentClass.section} />{studentClass.section && ')'}
            </>
          ) : 'Loading class information...'}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {subjects.map((subject) => (
          <Grid item xs={12} sm={6} md={4} key={subject.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <BookIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" component="div">
                      <SafeDisplay value={subject.name} />
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Code: <SafeDisplay value={subject.code} />
                    </Typography>
                  </Box>
                </Box>

                <Chip
                  label={<SafeDisplay value={subject.type} />}
                  size="small"
                  color={subject.type === 'Core' ? 'primary' : 'secondary'}
                  sx={{ mb: 2 }}
                />

                {subject.description && (
                  <Typography variant="body2" paragraph>
                    <SafeDisplay value={subject.description} />
                  </Typography>
                )}

                <Divider sx={{ my: 1 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    <strong>Teacher:</strong> {subject.teacher ? <SafeDisplay value={subject.teacher.name} /> : 'Not assigned'}
                  </Typography>
                </Box>
              </CardContent>

              <CardActions>
                <Button size="small" color="primary">
                  View Materials
                </Button>
                <Button size="small" color="primary">
                  Assignments
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default StudentSubjects;
