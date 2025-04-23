import React, { useState } from 'react';
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
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Alert
} from '@mui/material';

/**
 * Component for displaying class results
 */
const ClassResultsView = ({ results, educationLevel }) => {
  const [activeTab, setActiveTab] = useState(0);
  const isOLevel = educationLevel === 'O_LEVEL';

  if (!results) return null;

  const { class: classData, exam, students, subjects, divisionStats, subjectStats } = results;

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Get division color
  const getDivisionColor = (division) => {
    if (!division || division === 'N/A') return 'default';
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
        Class Results
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Class Information
              </Typography>
              <Typography variant="body1">
                <strong>Class:</strong> {classData.name}
              </Typography>
              <Typography variant="body1">
                <strong>Education Level:</strong> {isOLevel ? 'O-Level' : 'A-Level'}
              </Typography>
              <Typography variant="body1">
                <strong>Academic Year:</strong> {results.academicYear?.name || 'N/A'}
              </Typography>
              <Typography variant="body1">
                <strong>Total Students:</strong> {students.length}
              </Typography>
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
                <strong>Date Generated:</strong> {new Date(results.timestamp).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {isOLevel && divisionStats && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Division Statistics
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={4} sm={2}>
              <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Division I
                </Typography>
                <Typography variant="h6">
                  <Chip
                    label={divisionStats.I}
                    color={getDivisionColor('I')}
                    size="small"
                  />
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={4} sm={2}>
              <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Division II
                </Typography>
                <Typography variant="h6">
                  <Chip
                    label={divisionStats.II}
                    color={getDivisionColor('II')}
                    size="small"
                  />
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={4} sm={2}>
              <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Division III
                </Typography>
                <Typography variant="h6">
                  <Chip
                    label={divisionStats.III}
                    color={getDivisionColor('III')}
                    size="small"
                  />
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={4} sm={2}>
              <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Division IV
                </Typography>
                <Typography variant="h6">
                  <Chip
                    label={divisionStats.IV}
                    color={getDivisionColor('IV')}
                    size="small"
                  />
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={4} sm={2}>
              <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Division 0
                </Typography>
                <Typography variant="h6">
                  <Chip
                    label={divisionStats['0']}
                    color={getDivisionColor('0')}
                    size="small"
                  />
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={4} sm={2}>
              <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  N/A
                </Typography>
                <Typography variant="h6">
                  <Chip
                    label={divisionStats['N/A']}
                    color="default"
                    size="small"
                  />
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      <Divider sx={{ mb: 2 }} />

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Student Rankings" />
        <Tab label="Subject Statistics" />
      </Tabs>

      {activeTab === 0 && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Student Rankings
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Position</TableCell>
                  <TableCell>Admission #</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell align="center">Subjects</TableCell>
                  <TableCell align="right">Average</TableCell>
                  {isOLevel ? (
                    <>
                      <TableCell align="center">Division</TableCell>
                      <TableCell align="right">Points</TableCell>
                      <TableCell align="center">Missing</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell align="center">Division</TableCell>
                      <TableCell align="right">Principal</TableCell>
                      <TableCell align="right">Subsidiary</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.student.id}>
                    <TableCell>{student.position}</TableCell>
                    <TableCell>{student.student.admissionNumber}</TableCell>
                    <TableCell>{student.student.firstName} {student.student.lastName}</TableCell>
                    <TableCell align="center">{student.totalSubjects}</TableCell>
                    <TableCell align="right">{student.averageMarks}</TableCell>
                    {isOLevel ? (
                      <>
                        <TableCell align="center">
                          {student.division ? (
                            <Chip
                              label={student.division}
                              color={getDivisionColor(student.division)}
                              size="small"
                            />
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell align="right">{student.totalPoints || 'N/A'}</TableCell>
                        <TableCell align="center">
                          {student.missingSubjects > 0 ? (
                            <Chip
                              label={student.missingSubjects}
                              color="error"
                              size="small"
                            />
                          ) : 0}
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell align="center">
                          {student.division ? (
                            <Chip
                              label={student.division}
                              color={getDivisionColor(student.division)}
                              size="small"
                            />
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell align="right">{student.principalPoints || 'N/A'}</TableCell>
                        <TableCell align="right">{student.subsidiaryPoints || 'N/A'}</TableCell>
                        <TableCell align="right">{student.totalPoints || 'N/A'}</TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {(students.some(s => s.validationWarning) || students.some(s => s.missingCoreSubjects)) && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                Warning: Some students have incomplete results
              </Typography>
              <Typography variant="body2">
                Division calculations may not be accurate for students with missing subjects or core subjects.
              </Typography>
              {students.some(s => s.missingCoreSubjects) && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Some students are missing required core subjects (English, Kiswahili, Mathematics, Biology, Civics, Geography, History).
                </Typography>
              )}
            </Alert>
          )}
        </Box>
      )}

      {activeTab === 1 && subjectStats && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Subject Statistics
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Subject</TableCell>
                  <TableCell>Code</TableCell>
                  {!isOLevel && <TableCell>Type</TableCell>}
                  <TableCell align="center">Students</TableCell>
                  <TableCell align="right">Average</TableCell>
                  <TableCell align="center">A</TableCell>
                  <TableCell align="center">B</TableCell>
                  <TableCell align="center">C</TableCell>
                  <TableCell align="center">D</TableCell>
                  {!isOLevel && (
                    <>
                      <TableCell align="center">E</TableCell>
                      <TableCell align="center">S</TableCell>
                    </>
                  )}
                  <TableCell align="center">F</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subjectStats.map((stat, index) => (
                  <TableRow key={index}>
                    <TableCell>{stat.name}</TableCell>
                    <TableCell>{stat.code}</TableCell>
                    {!isOLevel && (
                      <TableCell>{stat.isPrincipal ? 'Principal' : 'Subsidiary'}</TableCell>
                    )}
                    <TableCell align="center">{stat.totalStudents}</TableCell>
                    <TableCell align="right">{stat.averageMarks}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={stat.gradeDistribution.A}
                        color={stat.gradeDistribution.A > 0 ? getGradeColor('A') : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={stat.gradeDistribution.B}
                        color={stat.gradeDistribution.B > 0 ? getGradeColor('B') : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={stat.gradeDistribution.C}
                        color={stat.gradeDistribution.C > 0 ? getGradeColor('C') : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={stat.gradeDistribution.D}
                        color={stat.gradeDistribution.D > 0 ? getGradeColor('D') : 'default'}
                        size="small"
                      />
                    </TableCell>
                    {!isOLevel && (
                      <>
                        <TableCell align="center">
                          <Chip
                            label={stat.gradeDistribution.E}
                            color={stat.gradeDistribution.E > 0 ? getGradeColor('E') : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={stat.gradeDistribution.S}
                            color={stat.gradeDistribution.S > 0 ? getGradeColor('S') : 'default'}
                            size="small"
                          />
                        </TableCell>
                      </>
                    )}
                    <TableCell align="center">
                      <Chip
                        label={stat.gradeDistribution.F}
                        color={stat.gradeDistribution.F > 0 ? getGradeColor('F') : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
};

export default ClassResultsView;
