import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  Alert,
  Card,
  CardContent,
  Grid
} from '@mui/material';

/**
 * Component for displaying student results
 */
const StudentResultsView = ({ results, educationLevel }) => {
  const isOLevel = educationLevel === 'O_LEVEL';

  if (!results) return null;

  const { student, exam, results: subjectResults } = results;

  // Format student name
  const studentName = `${student.firstName} ${student.lastName}`;

  // Get division color
  const getDivisionColor = (division) => {
    if (!division) return 'default';
    switch (division) {
      case 'I': return 'success';
      case 'II': return 'primary';
      case 'III': return 'info';
      case 'IV': return 'warning';
      case '0': return 'error';
      default: return 'default';
    }
  };

  // Get grade color
  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return 'success';
      case 'B': return 'primary';
      case 'C': return 'info';
      case 'D': return 'warning';
      case 'E': case 'S': return 'secondary';
      case 'F': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Student Results
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Student Information
              </Typography>
              <Typography variant="body1">
                <strong>Name:</strong> {studentName}
              </Typography>
              <Typography variant="body1">
                <strong>Admission Number:</strong> {student.admissionNumber}
              </Typography>
              <Typography variant="body1">
                <strong>Class:</strong> {results.class?.name || 'N/A'}
              </Typography>
              <Typography variant="body1">
                <strong>Education Level:</strong> {isOLevel ? 'O-Level' : 'A-Level'}
              </Typography>
              {!isOLevel && results.combination && (
                <Typography variant="body1">
                  <strong>Combination:</strong> {results.combination.name} ({results.combination.code})
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Exam Information
              </Typography>
              <Typography variant="body1">
                <strong>Exam:</strong> {exam.name}
              </Typography>
              <Typography variant="body1">
                <strong>Term:</strong> {exam.term}
              </Typography>
              <Typography variant="body1">
                <strong>Type:</strong> {exam.type}
              </Typography>
              <Typography variant="body1">
                <strong>Academic Year:</strong> {results.academicYear?.name || 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Results Summary
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={6} sm={4} md={2}>
            <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Total Subjects
              </Typography>
              <Typography variant="h6">
                {results.totalSubjects || subjectResults.length}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={6} sm={4} md={2}>
            <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Average Marks
              </Typography>
              <Typography variant="h6">
                {results.averageMarks || 'N/A'}
              </Typography>
            </Card>
          </Grid>

          {isOLevel ? (
            <>
              <Grid item xs={6} sm={4} md={2}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Division
                  </Typography>
                  <Typography variant="h6">
                    {results.division ? (
                      <Chip
                        label={results.division}
                        color={getDivisionColor(results.division)}
                        size="small"
                      />
                    ) : 'N/A'}
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={6} sm={4} md={2}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Points
                  </Typography>
                  <Typography variant="h6">
                    {results.totalPoints || 'N/A'}
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={6} sm={4} md={2}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Position
                  </Typography>
                  <Typography variant="h6">
                    {results.position ? `${results.position}/${results.totalStudents}` : 'N/A'}
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={6} sm={4} md={2}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Missing Subjects
                  </Typography>
                  <Typography variant="h6" color={results.missingSubjects > 0 ? 'error' : 'inherit'}>
                    {results.missingSubjects || 0}
                  </Typography>
                </Card>
              </Grid>
            </>
          ) : (
            <>
              <Grid item xs={6} sm={4} md={2}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Division
                  </Typography>
                  <Typography variant="h6">
                    {results.division ? (
                      <Chip
                        label={results.division}
                        color={getDivisionColor(results.division)}
                        size="small"
                      />
                    ) : 'N/A'}
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={6} sm={4} md={2}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Principal Points
                  </Typography>
                  <Typography variant="h6">
                    {results.principalPoints || 'N/A'}
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={6} sm={4} md={2}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Subsidiary Points
                  </Typography>
                  <Typography variant="h6">
                    {results.subsidiaryPoints || 'N/A'}
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={6} sm={4} md={2}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Points
                  </Typography>
                  <Typography variant="h6">
                    {results.totalPoints || 'N/A'}
                  </Typography>
                </Card>
              </Grid>
            </>
          )}
        </Grid>
      </Box>

      {(results.validationWarning || results.missingCoreSubjects) && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {results.validationWarning}
          {!results.validationWarning && results.missingCoreSubjects && (
            <>
              <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 'bold' }}>
                Missing Core Subjects:
              </Typography>
              <Typography variant="body2">
                Student is missing the following core subjects: {Array.isArray(results.missingCoreSubjects) ? results.missingCoreSubjects.join(', ') : results.missingCoreSubjects}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Division calculation may not be accurate without all core subjects.
              </Typography>
            </>
          )}
        </Alert>
      )}

      <Divider sx={{ mb: 2 }} />

      <Typography variant="subtitle1" gutterBottom>
        Subject Results
      </Typography>

      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Subject</TableCell>
              <TableCell>Code</TableCell>
              {!isOLevel && <TableCell>Type</TableCell>}
              <TableCell align="right">Marks</TableCell>
              <TableCell align="center">Grade</TableCell>
              <TableCell align="center">Points</TableCell>
              <TableCell>Comments</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subjectResults.map((result, index) => (
              <TableRow key={index}>
                <TableCell>{result.subject.name}</TableCell>
                <TableCell>{result.subject.code}</TableCell>
                {!isOLevel && (
                  <TableCell>
                    {result.isPrincipal ? 'Principal' : result.isSubsidiary ? 'Subsidiary' : 'Other'}
                  </TableCell>
                )}
                <TableCell align="right">{result.marksObtained}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={result.grade}
                    color={getGradeColor(result.grade)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">{result.points}</TableCell>
                <TableCell>{result.comment || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {isOLevel && results.bestSubjects && results.bestSubjects.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Best 7 Subjects (Used for Division Calculation)
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Subject</TableCell>
                  <TableCell align="center">Grade</TableCell>
                  <TableCell align="center">Points</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.bestSubjects.map((subject, index) => (
                  <TableRow key={index}>
                    <TableCell>{subject.subject.name}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={subject.grade}
                        color={getGradeColor(subject.grade)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">{subject.points}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={2} align="right"><strong>Total Points:</strong></TableCell>
                  <TableCell align="center"><strong>{results.totalPoints}</strong></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {!isOLevel && results.bestPrincipalSubjects && results.bestPrincipalSubjects.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Best 3 Principal Subjects (Used for Division Calculation)
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Subject</TableCell>
                  <TableCell align="center">Grade</TableCell>
                  <TableCell align="center">Points</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.bestPrincipalSubjects.map((subject, index) => (
                  <TableRow key={index}>
                    <TableCell>{subject.subject.name}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={subject.grade}
                        color={getGradeColor(subject.grade)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">{subject.points}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={2} align="right"><strong>Total Principal Points:</strong></TableCell>
                  <TableCell align="center"><strong>{results.principalPoints}</strong></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
};

export default StudentResultsView;
