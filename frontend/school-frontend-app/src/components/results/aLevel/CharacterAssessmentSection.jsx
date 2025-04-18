import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Divider,
  TextField,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import axios from 'axios';

/**
 * CharacterAssessmentSection Component
 * 
 * Displays the character assessment section in the A-Level result report
 * with optional editing capability for authorized users.
 */
const CharacterAssessmentSection = ({ 
  characterAssessment, 
  canEdit = false,
  onUpdate = null
}) => {
  const [comments, setComments] = useState(characterAssessment?.comments || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Handle save comments
  const handleSaveComments = async () => {
    if (!characterAssessment?._id) return;
    
    setIsSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Create an AbortController for request cancellation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      // Make the API request
      const response = await axios.patch(
        `/api/character-assessments/${characterAssessment._id}`,
        { comments },
        { 
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      // Check if the response is successful
      if (response.status === 200) {
        setSuccess(true);
        setIsEditing(false);
        
        // Call the onUpdate callback if provided
        if (onUpdate) {
          onUpdate({
            ...characterAssessment,
            comments
          });
        }
      } else {
        setError('Failed to save comments. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to save comments. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel editing
  const handleCancelEdit = () => {
    setComments(characterAssessment?.comments || '');
    setIsEditing(false);
    setError(null);
    setSuccess(false);
  };

  return (
    <Paper sx={{ mb: 3 }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Character Assessment
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Box>
      <TableContainer>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell><strong>Punctuality:</strong></TableCell>
              <TableCell>{characterAssessment?.punctuality || 'Good'}</TableCell>
              <TableCell><strong>Discipline:</strong></TableCell>
              <TableCell>{characterAssessment?.discipline || 'Good'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><strong>Respect:</strong></TableCell>
              <TableCell>{characterAssessment?.respect || 'Good'}</TableCell>
              <TableCell><strong>Leadership:</strong></TableCell>
              <TableCell>{characterAssessment?.leadership || 'Good'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><strong>Participation:</strong></TableCell>
              <TableCell>{characterAssessment?.participation || 'Good'}</TableCell>
              <TableCell><strong>Overall:</strong></TableCell>
              <TableCell>{characterAssessment?.overallAssessment || 'Good'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><strong>Comments:</strong></TableCell>
              <TableCell colSpan={3}>
                {!isEditing ? (
                  characterAssessment?.comments || 'No comments available'
                ) : (
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    variant="outlined"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    disabled={isSaving}
                  />
                )}
              </TableCell>
            </TableRow>
            {canEdit && characterAssessment?._id && (
              <TableRow>
                <TableCell colSpan={4} align="right">
                  {!isEditing ? (
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Comments
                    </Button>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <Button 
                        variant="outlined" 
                        color="secondary" 
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleSaveComments}
                        disabled={isSaving}
                        startIcon={isSaving ? <CircularProgress size={20} /> : null}
                      >
                        {isSaving ? 'Saving...' : 'Save Comments'}
                      </Button>
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Error and success messages */}
      {error && (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}
      {success && (
        <Box sx={{ p: 2 }}>
          <Alert severity="success">Comments saved successfully!</Alert>
        </Box>
      )}
    </Paper>
  );
};

CharacterAssessmentSection.propTypes = {
  characterAssessment: PropTypes.shape({
    _id: PropTypes.string,
    punctuality: PropTypes.string,
    discipline: PropTypes.string,
    respect: PropTypes.string,
    leadership: PropTypes.string,
    participation: PropTypes.string,
    overallAssessment: PropTypes.string,
    comments: PropTypes.string,
    assessedBy: PropTypes.string
  }),
  canEdit: PropTypes.bool,
  onUpdate: PropTypes.func
};

export default CharacterAssessmentSection;
