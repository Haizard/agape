import React from 'react';
import PropTypes from 'prop-types';
import { Box, Chip, Typography, Divider, Paper } from '@mui/material';

/**
 * Component to display a subject combination with its compulsory subjects
 * 
 * @param {Object} props - Component props
 * @param {Object} props.combination - The subject combination object
 * @param {boolean} props.showCompulsory - Whether to show compulsory subjects
 * @param {string} props.variant - Display variant ('compact', 'full')
 * @returns {React.ReactElement} - The rendered component
 */
const SubjectCombinationDisplay = ({ 
  combination, 
  showCompulsory = true,
  variant = 'compact'
}) => {
  if (!combination) {
    return <Typography color="text.secondary">No combination selected</Typography>;
  }

  // Extract subjects and compulsory subjects
  const mainSubjects = combination.subjects || [];
  const compulsorySubjects = showCompulsory ? (combination.compulsorySubjects || []) : [];

  // Determine if we're using the compact or full display
  const isCompact = variant === 'compact';

  if (isCompact) {
    return (
      <Box>
        <Typography variant="subtitle1" fontWeight="medium">
          {combination.name} ({combination.code})
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
          {mainSubjects.map(subject => (
            <Chip
              key={subject._id || subject}
              label={typeof subject === 'object' ? subject.name : subject}
              color="primary"
              size="small"
            />
          ))}
          {showCompulsory && compulsorySubjects.map(subject => (
            <Chip
              key={subject._id || subject}
              label={typeof subject === 'object' ? subject.name : subject}
              color="secondary"
              size="small"
            />
          ))}
        </Box>
      </Box>
    );
  }

  // Full display
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {combination.name} ({combination.code})
      </Typography>
      {combination.description && (
        <Typography variant="body2" color="text.secondary" paragraph>
          {combination.description}
        </Typography>
      )}
      
      <Typography variant="subtitle2" gutterBottom>
        Main Subjects:
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
        {mainSubjects.length > 0 ? (
          mainSubjects.map(subject => (
            <Chip
              key={subject._id || subject}
              label={typeof subject === 'object' ? subject.name : subject}
              color="primary"
              size="small"
            />
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            No main subjects defined
          </Typography>
        )}
      </Box>
      
      {showCompulsory && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2" gutterBottom>
            Compulsory Subjects:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {compulsorySubjects.length > 0 ? (
              compulsorySubjects.map(subject => (
                <Chip
                  key={subject._id || subject}
                  label={typeof subject === 'object' ? subject.name : subject}
                  color="secondary"
                  size="small"
                />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No compulsory subjects defined
              </Typography>
            )}
          </Box>
        </>
      )}
    </Paper>
  );
};

SubjectCombinationDisplay.propTypes = {
  combination: PropTypes.object,
  showCompulsory: PropTypes.bool,
  variant: PropTypes.oneOf(['compact', 'full'])
};

export default SubjectCombinationDisplay;
