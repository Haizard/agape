import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import api from '../../services/api';

/**
 * Character Assessment Comments Component
 * A component for viewing and editing character assessment comments
 */
const CharacterAssessmentComments = ({ assessmentId, initialComments = '' }) => {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [comments, setComments] = useState(initialComments);
  const [originalComments, setOriginalComments] = useState(initialComments);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Update comments when initialComments prop changes
  useEffect(() => {
    setComments(initialComments);
    setOriginalComments(initialComments);
  }, [initialComments]);

  // Handle comments change
  const handleCommentsChange = (e) => {
    setComments(e.target.value);
  };

  // Start editing
  const handleStartEditing = () => {
    setEditing(true);
  };

  // Cancel editing
  const handleCancelEditing = () => {
    setComments(originalComments);
    setEditing(false);
  };

  // Save comments
  const handleSaveComments = async () => {
    if (!assessmentId) {
      setSnackbar({
        open: true,
        message: 'No assessment ID provided. Cannot save comments.',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.patch(`/api/character-assessments/comments/${assessmentId}`, {
        comments
      });

      setOriginalComments(comments);
      setEditing(false);
      setSnackbar({
        open: true,
        message: 'Comments updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating comments:', error);
      setSnackbar({
        open: true,
        message: `Failed to update comments: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Teacher Comments</Typography>
          {!editing && (
            <Button
              startIcon={<EditIcon />}
              onClick={handleStartEditing}
              disabled={loading || !assessmentId}
              size="small"
            >
              Edit Comments
            </Button>
          )}
        </Box>
        <Divider sx={{ mb: 2 }} />

        {editing ? (
          <TextField
            fullWidth
            multiline
            rows={4}
            value={comments}
            onChange={handleCommentsChange}
            placeholder="Enter comments about the student's character and behavior..."
            disabled={loading}
          />
        ) : (
          <Typography variant="body1" sx={{ minHeight: '100px', whiteSpace: 'pre-wrap' }}>
            {comments || 'No comments available.'}
          </Typography>
        )}
      </CardContent>

      {editing && (
        <CardActions sx={{ justifyContent: 'flex-end' }}>
          <Button
            startIcon={<CancelIcon />}
            onClick={handleCancelEditing}
            disabled={loading}
            color="error"
            variant="outlined"
            size="small"
            sx={{ mr: 1 }}
          >
            Cancel
          </Button>
          <Button
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSaveComments}
            disabled={loading}
            color="primary"
            variant="contained"
            size="small"
          >
            Save Comments
          </Button>
        </CardActions>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};

CharacterAssessmentComments.propTypes = {
  assessmentId: PropTypes.string,
  initialComments: PropTypes.string
};

CharacterAssessmentComments.defaultProps = {
  assessmentId: '',
  initialComments: ''
};

export default CharacterAssessmentComments;
