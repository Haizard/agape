import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Grid,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import ReportPropTypes from './ReportPropTypes';

/**
 * AttendanceSection Component
 * Displays attendance information in the report book
 *
 * @param {Object} props
 * @param {Object} props.report - The report data
 */
const AttendanceSection = ({ report }) => {
  const { attendance } = report;

  // Default attendance data if not provided
  const attendanceData = attendance || {
    totalDays: 120,
    present: 110,
    absent: 10,
    late: 5,
    excused: 3,
    attendancePercentage: 91.7
  };

  // Calculate attendance percentage if not provided
  const attendancePercentage = attendanceData.attendancePercentage ||
    (attendanceData.present / attendanceData.totalDays * 100).toFixed(1);

  // Get color based on attendance percentage
  const getAttendanceColor = (percentage) => {
    if (percentage >= 95) return 'success';
    if (percentage >= 85) return 'primary';
    if (percentage >= 75) return 'info';
    if (percentage >= 65) return 'warning';
    return 'error';
  };

  // Monthly attendance data (mock data for visualization)
  const monthlyAttendance = [
    { month: 'January', totalDays: 20, present: 19, absent: 1, late: 0 },
    { month: 'February', totalDays: 20, present: 18, absent: 2, late: 1 },
    { month: 'March', totalDays: 22, present: 20, absent: 2, late: 1 },
    { month: 'April', totalDays: 18, present: 16, absent: 2, late: 1 },
    { month: 'May', totalDays: 20, present: 19, absent: 1, late: 0 },
    { month: 'June', totalDays: 20, present: 18, absent: 2, late: 2 }
  ];

  return (
    <Box>
      {/* Section Header */}
      <Box sx={{ mb: 3, textAlign: 'center', border: '2px solid #000', p: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
          ATTENDANCE RECORD
        </Typography>
        <Divider sx={{ mb: 2, borderColor: '#000' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
          {report.academicYear || 'Academic Year 2023-2024'} - {report.term || 'Term II'}
        </Typography>
      </Box>

      {/* Attendance Summary */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 0, border: '1px solid #000' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '2px solid #000', pb: 1 }}>
          ATTENDANCE SUMMARY
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Overall Attendance: {attendancePercentage}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min(attendancePercentage, 100)}
                color={getAttendanceColor(attendancePercentage)}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Total School Days:</strong> {attendanceData.totalDays}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Days Present:</strong> {attendanceData.present}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Days Absent:</strong> {attendanceData.absent}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Days Late:</strong> {attendanceData.late}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Excused Absences:</strong> {attendanceData.excused}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Unexcused Absences:</strong> {attendanceData.absent - attendanceData.excused}
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{
              p: 2,
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              backgroundColor: `${getAttendanceColor(attendancePercentage)}.light`,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Typography variant="h3" sx={{ color: `${getAttendanceColor(attendancePercentage)}.dark`, fontWeight: 'bold' }}>
                {attendancePercentage}%
              </Typography>
              <Typography variant="h6" sx={{ mt: 2 }}>
                {
                  attendancePercentage >= 95 ? 'Excellent Attendance' :
                  attendancePercentage >= 85 ? 'Good Attendance' :
                  attendancePercentage >= 75 ? 'Satisfactory Attendance' :
                  attendancePercentage >= 65 ? 'Needs Improvement' :
                  'Poor Attendance'
                }
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                {
                  attendancePercentage >= 95 ? 'Consistently present and punctual. Keep up the excellent record!' :
                  attendancePercentage >= 85 ? 'Good attendance record with few absences. Continue to maintain regular attendance.' :
                  attendancePercentage >= 75 ? 'Satisfactory attendance but room for improvement. Try to minimize absences.' :
                  attendancePercentage >= 65 ? 'Attendance needs improvement. Too many absences may affect academic performance.' :
                  'Poor attendance is significantly affecting learning. Immediate improvement is necessary.'
                }
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Monthly Attendance */}
      <Paper elevation={1} sx={{ p: 3, borderRadius: 0, border: '1px solid #000' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '2px solid #000', pb: 1 }}>
          MONTHLY ATTENDANCE
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Month</TableCell>
                <TableCell align="center">Total Days</TableCell>
                <TableCell align="center">Present</TableCell>
                <TableCell align="center">Absent</TableCell>
                <TableCell align="center">Late</TableCell>
                <TableCell align="center">Percentage</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {monthlyAttendance.map((month) => {
                const percentage = (month.present / month.totalDays * 100).toFixed(1);
                return (
                  <TableRow key={month.month}>
                    <TableCell>{month.month}</TableCell>
                    <TableCell align="center">{month.totalDays}</TableCell>
                    <TableCell align="center">{month.present}</TableCell>
                    <TableCell align="center">{month.absent}</TableCell>
                    <TableCell align="center">{month.late}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(Number.parseFloat(percentage), 100)}
                          color={getAttendanceColor(percentage)}
                          sx={{ height: 8, borderRadius: 5, width: '70%', mr: 1 }}
                        />
                        <Typography variant="body2">{percentage}%</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Attendance Note */}
      <Box sx={{ mt: 4, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
          Note to Parents/Guardians:
        </Typography>
        <Typography variant="body2">
          Regular attendance is crucial for academic success. If your child's attendance is below 85%,
          please discuss with the class teacher about strategies to improve attendance. If there are
          specific reasons for absences, please provide documentation for excused absences.
        </Typography>
      </Box>
    </Box>
  );
};

AttendanceSection.propTypes = ReportPropTypes;

export default AttendanceSection;
