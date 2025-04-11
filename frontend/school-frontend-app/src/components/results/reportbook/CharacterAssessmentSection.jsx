import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Grid,
  Rating,
  Chip
} from '@mui/material';
import {
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';
import ReportPropTypes from './ReportPropTypes';

/**
 * CharacterAssessmentSection Component
 * Displays character assessment in the report book
 *
 * @param {Object} props
 * @param {Object} props.report - The report data
 */
const CharacterAssessmentSection = ({ report }) => {
  const { characterAssessment } = report;

  // Convert text rating to numeric value for Rating component
  const getRatingValue = (rating) => {
    switch (rating?.toLowerCase()) {
      case 'excellent': return 5;
      case 'very good': return 4;
      case 'good': return 3;
      case 'satisfactory': return 2;
      case 'needs improvement': return 1;
      default: return 3; // Default to 'Good'
    }
  };

  // Get color for rating chip
  const getRatingColor = (rating) => {
    switch (rating?.toLowerCase()) {
      case 'excellent': return 'success';
      case 'very good': return 'primary';
      case 'good': return 'info';
      case 'satisfactory': return 'warning';
      case 'needs improvement': return 'error';
      case 'regular': return 'info';
      case 'positive': return 'success';
      default: return 'default';
    }
  };

  // Character traits to display
  const characterTraits = [
    { label: 'Discipline', value: characterAssessment?.discipline || 'Good' },
    { label: 'Attendance', value: characterAssessment?.attendance || 'Regular' },
    { label: 'Attitude', value: characterAssessment?.attitude || 'Positive' },
    { label: 'Punctuality', value: characterAssessment?.punctuality || 'Good' },
    { label: 'Cleanliness', value: characterAssessment?.cleanliness || 'Good' },
    { label: 'Leadership', value: characterAssessment?.leadership || 'Satisfactory' },
    { label: 'Participation', value: characterAssessment?.participation || 'Good' }
  ];

  return (
    <Box>
      {/* Section Header */}
      <Box sx={{ mb: 3, textAlign: 'center', border: '2px solid #000', p: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
          CHARACTER ASSESSMENT
        </Typography>
        <Divider sx={{ mb: 2, borderColor: '#000' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
          {report.examName || 'Mid-Term Examination'} - {report.academicYear || 'Academic Year 2023-2024'}
        </Typography>
      </Box>

      {/* Character Traits Grid */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 0, border: '1px solid #000' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '2px solid #000', pb: 1 }}>
          CHARACTER TRAITS
        </Typography>

        <Grid container spacing={3}>
          {characterTraits.map((trait, index) => (
            <Grid item xs={12} sm={6} key={`trait-${trait.label}`}>
              <Box sx={{
                p: 2,
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {trait.label}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Rating
                    value={getRatingValue(trait.value)}
                    readOnly
                    precision={1}
                    icon={<StarIcon fontSize="inherit" />}
                    emptyIcon={<StarBorderIcon fontSize="inherit" />}
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label={trait.value}
                    size="small"
                    color={getRatingColor(trait.value)}
                  />
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Character Assessment Comments */}
      <Paper elevation={1} sx={{ p: 3, borderRadius: 0, border: '1px solid #000' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '2px solid #000', pb: 1 }}>
          TEACHER'S ASSESSMENT
        </Typography>

        <Box sx={{
          p: 3,
          backgroundColor: '#f5f5f5',
          borderRadius: 2,
          border: '1px solid #e0e0e0',
          minHeight: '150px'
        }}>
          <Typography variant="body1" sx={{ fontStyle: 'italic', whiteSpace: 'pre-line' }}>
            {characterAssessment?.comments || 'No assessment comments provided.'}
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

      {/* Guidance Note */}
      <Box sx={{ mt: 4, p: 2, backgroundColor: '#e8f4f8', borderRadius: 2 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
          Note to Parents/Guardians:
        </Typography>
        <Typography variant="body2">
          Character development is an essential part of education. Please discuss these assessments with your child
          and encourage growth in areas that need improvement. Your support in reinforcing positive character traits
          is invaluable to your child's overall development.
        </Typography>
      </Box>
    </Box>
  );
};

CharacterAssessmentSection.propTypes = ReportPropTypes;

export default CharacterAssessmentSection;
