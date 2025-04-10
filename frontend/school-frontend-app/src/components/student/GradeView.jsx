import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import axios from 'axios';
import { useSelector } from 'react-redux';
import SafeDisplay from '../common/SafeDisplay';

const GradeCard = ({ subject, score }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        <SafeDisplay value={subject} />
      </Typography>
      <Typography variant="h4" color="primary">
        <SafeDisplay value={score} />%
      </Typography>
      <Typography variant="body2" color="textSecondary">
        {getGradeLabel(score)}
      </Typography>
    </CardContent>
  </Card>
);

GradeCard.propTypes = {
  subject: PropTypes.string.isRequired,
  score: PropTypes.number.isRequired
};

const getGradeLabel = (score) => {
  if (score >= 90) return 'A+ (Excellent)';
  if (score >= 80) return 'A (Very Good)';
  if (score >= 70) return 'B (Good)';
  if (score >= 60) return 'C (Satisfactory)';
  if (score >= 50) return 'D (Pass)';
  return 'F (Fail)';
};

const calculateDivision = (scores) => {
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  let division;

  if (average >= 75) division = 'I';
  else if (average >= 65) division = 'II';
  else if (average >= 50) division = 'III';
  else division = 'FAIL';

  return { division, averageScore: average.toFixed(1) };
};

const GradeView = () => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = useSelector((state) => state.user);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/students/${user.id}/grades`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });

        const scores = response.data.subjects.map(subject => subject.score);
        const divisionResult = calculateDivision(scores);

        setStudentData({
          ...response.data,
          division: divisionResult.division,
          averageScore: divisionResult.averageScore
        });
      } catch (err) {
        setError('Failed to fetch grades. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, [user.id, user.token]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!studentData) {
    return <Alert severity="info">No grade data available.</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Academic Report
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Overall Performance
          </Typography>
          <Typography variant="h6" color="primary">
            Division <SafeDisplay value={studentData.division} />
          </Typography>
          <Typography variant="subtitle1">
            Average Score: <SafeDisplay value={studentData.averageScore} />%
          </Typography>
          <Typography variant="subtitle2">
            Class: <SafeDisplay value={studentData.student.class} /> <SafeDisplay value={studentData.student.stream} />
          </Typography>
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h5" gutterBottom>
        Subject Grades
      </Typography>

      <Grid container spacing={2}>
        {studentData.subjects.map((subject) => (
          <Grid item xs={12} sm={6} md={4} key={subject.name}>
            <GradeCard
              subject={subject.name}
              score={subject.score}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default GradeView;
