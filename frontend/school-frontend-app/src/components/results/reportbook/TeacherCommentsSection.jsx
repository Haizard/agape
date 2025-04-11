import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Grid
} from '@mui/material';
import ReportPropTypes from './ReportPropTypes';

/**
 * TeacherCommentsSection Component
 * Displays teacher comments in the report book
 *
 * @param {Object} props
 * @param {Object} props.report - The report data
 */
const TeacherCommentsSection = ({ report }) => {
  const { teacherComments } = report;

  return (
    <Box>
      {/* Section Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          TEACHER COMMENTS
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="subtitle1">
          {report.examName || 'Examination'} - {report.academicYear || 'Academic Year'}
        </Typography>
      </Box>

      {/* Class Teacher Comments */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          CLASS TEACHER'S COMMENTS
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Box sx={{
          p: 3,
          backgroundColor: '#f5f5f5',
          borderRadius: 2,
          border: '1px solid #e0e0e0',
          minHeight: '150px'
        }}>
          <Typography variant="body1" sx={{ fontStyle: 'italic', whiteSpace: 'pre-line' }}>
            {teacherComments?.classTeacher || 'No comments provided by the class teacher.'}
          </Typography>
        </Box>

        {/* Signature */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ width: 200, borderBottom: '1px solid #000', mb: 1, height: 30 }} />
            <Typography variant="body2">Class Teacher's Signature</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Principal Comments */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          PRINCIPAL'S COMMENTS
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Box sx={{
          p: 3,
          backgroundColor: '#f5f5f5',
          borderRadius: 2,
          border: '1px solid #e0e0e0',
          minHeight: '150px'
        }}>
          <Typography variant="body1" sx={{ fontStyle: 'italic', whiteSpace: 'pre-line' }}>
            {teacherComments?.principalComments || 'No comments provided by the principal.'}
          </Typography>
        </Box>

        {/* Signature */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ width: 200, borderBottom: '1px solid #000', mb: 1, height: 30 }} />
            <Typography variant="body2">Principal's Signature</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Recommendations */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          RECOMMENDATIONS
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Box sx={{
              p: 2,
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              height: '100%'
            }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Academic Recommendations
              </Typography>
              <Typography variant="body2">
                {teacherComments?.academicRecommendations ||
                  report.summary?.averageMarks > 70 ?
                    'Continue with the excellent academic performance. Focus on maintaining consistency across all subjects.' :
                  report.summary?.averageMarks > 60 ?
                    'Good performance overall. Consider additional focus on weaker subjects to improve overall results.' :
                  report.summary?.averageMarks > 50 ?
                    'Satisfactory performance. Needs to improve study habits and seek help in challenging subjects.' :
                    'Needs significant improvement in academic performance. Recommend additional tutoring and supervised study sessions.'
                }
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{
              p: 2,
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              height: '100%'
            }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Character Development Recommendations
              </Typography>
              <Typography variant="body2">
                {teacherComments?.characterRecommendations ||
                  'Continue to develop positive character traits. Participate in extracurricular activities that promote leadership, teamwork, and community service.'
                }
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Next Term Goals */}
        <Box sx={{ mt: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Goals for Next Term
          </Typography>
          <Typography variant="body2">
            {teacherComments?.nextTermGoals ||
              '1. Improve overall academic performance by at least 5%.\n' +
              '2. Maintain excellent attendance record.\n' +
              '3. Participate more actively in class discussions.\n' +
              '4. Complete all assignments on time.\n' +
              '5. Take on leadership roles in school activities.'
            }
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

TeacherCommentsSection.propTypes = ReportPropTypes;

export default TeacherCommentsSection;
