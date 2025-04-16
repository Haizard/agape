import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import api, { constructApiUrl } from '../../utils/api';
import marksHistoryApi from '../../services/marksHistoryApi';
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
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Grid,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  History as HistoryIcon,
  Restore as RestoreIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Book as BookIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { API_URL } from '../../config/index';
import { useAuth } from '../../contexts/AuthContext';

const MarksHistoryViewer = () => {
  const { id, type } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const resultModel = queryParams.get('model') || 'OLevelResult';
  const { user } = useAuth();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [revertReason, setRevertReason] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        let response;

        switch (type) {
          case 'result':
            response = await marksHistoryApi.getResultHistory(id, resultModel);
            break;
          case 'student':
            response = await marksHistoryApi.getStudentHistory(id);
            break;
          case 'subject':
            response = await marksHistoryApi.getSubjectHistory(id);
            break;
          case 'exam':
            response = await marksHistoryApi.getExamHistory(id);
            break;
          default:
            throw new Error('Invalid history type');
        }

        setHistory(response.data || []);
      } catch (err) {
        console.error('Error fetching marks history:', err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch marks history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [id, type, resultModel]);

  const handleRevertClick = (entry) => {
    setSelectedEntry(entry);
    setConfirmDialogOpen(true);
  };

  const handleConfirmRevert = async () => {
    try {
      setLoading(true);
      console.log(`Reverting marks history entry: ${selectedEntry._id}`);

      // Revert to the selected version
      await marksHistoryApi.revertToVersion(selectedEntry._id, revertReason);

      // Refresh history after revert
      let response;
      switch (type) {
        case 'result':
          response = await marksHistoryApi.getResultHistory(id, resultModel);
          break;
        case 'student':
          response = await marksHistoryApi.getStudentHistory(id);
          break;
        case 'subject':
          response = await marksHistoryApi.getSubjectHistory(id);
          break;
        case 'exam':
          response = await marksHistoryApi.getExamHistory(id);
          break;
        default:
          throw new Error('Invalid history type');
      }

      setHistory(response.data || []);
      setConfirmDialogOpen(false);
      setRevertReason('');
      setSelectedEntry(null);
    } catch (err) {
      console.error('Error reverting marks:', err);
      setError(err.response?.data?.message || err.message || 'Failed to revert marks');
    } finally {
      setLoading(false);
    }
  };

  const getChangeTypeColor = (changeType) => {
    switch (changeType) {
      case 'CREATE':
        return 'success';
      case 'UPDATE':
        return 'primary';
      case 'DELETE':
        return 'error';
      default:
        return 'default';
    }
  };

  const getChangeTypeLabel = (changeType) => {
    switch (changeType) {
      case 'CREATE':
        return 'Created';
      case 'UPDATE':
        return 'Updated';
      case 'DELETE':
        return 'Deleted';
      default:
        return changeType;
    }
  };

  const formatTimestamp = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const filteredHistory = history.filter(entry => {
    if (filterType === 'all') return true;
    return entry.changeType === filterType;
  });

  if (loading && history.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (history.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
        No marks history found.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" component="h2">
          <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Marks History
        </Typography>

        <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="filter-type-label">Filter</InputLabel>
          <Select
            labelId="filter-type-label"
            id="filter-type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            label="Filter"
          >
            <MenuItem value="all">All Changes</MenuItem>
            <MenuItem value="CREATE">Created</MenuItem>
            <MenuItem value="UPDATE">Updated</MenuItem>
            <MenuItem value="DELETE">Deleted</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading && history.length > 0 && (
        <Box display="flex" justifyContent="center" my={2}>
          <CircularProgress size={24} />
        </Box>
      )}

      <Grid container spacing={2}>
        {filteredHistory.map((entry) => (
          <Grid item xs={12} key={entry._id}>
            <Card variant="outlined">
              <CardHeader
                title={
                  <Box display="flex" alignItems="center">
                    <Chip
                      label={getChangeTypeLabel(entry.changeType)}
                      color={getChangeTypeColor(entry.changeType)}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="subtitle1">
                      {entry.resultModel === 'OLevelResult' ? 'O-Level' : 'A-Level'} Result
                    </Typography>
                  </Box>
                }
                subheader={
                  <Box display="flex" alignItems="center" mt={0.5}>
                    <CalendarIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {formatTimestamp(entry.timestamp)}
                    </Typography>
                  </Box>
                }
                action={
                  user?.role === 'admin' && (
                    <Tooltip title="Revert to this version">
                      <IconButton
                        aria-label="revert"
                        onClick={() => handleRevertClick(entry)}
                        disabled={loading}
                      >
                        <RestoreIcon />
                      </IconButton>
                    </Tooltip>
                  )
                }
              />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <PersonIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="body2">
                        <strong>Changed by:</strong> {entry.userId?.name || 'Unknown user'}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" mb={1}>
                      <SchoolIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="body2">
                        <strong>Student:</strong> {entry.studentId?.firstName} {entry.studentId?.lastName || 'Unknown student'}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center">
                      <BookIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="body2">
                        <strong>Subject:</strong> {entry.subjectId?.name || 'Unknown subject'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <AssignmentIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="body2">
                        <strong>Exam:</strong> {entry.examId?.name || 'Unknown exam'}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" mb={1}>
                      <InfoIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="body2">
                        <strong>Education Level:</strong> {entry.educationLevel === 'O_LEVEL' ? 'O-Level' : 'A-Level'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>Changes:</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Field</TableCell>
                          <TableCell>Previous Value</TableCell>
                          <TableCell>New Value</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {entry.changeType === 'CREATE' && (
                          <>
                            <TableRow>
                              <TableCell>Marks</TableCell>
                              <TableCell>-</TableCell>
                              <TableCell>{entry.newValues.marksObtained}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Grade</TableCell>
                              <TableCell>-</TableCell>
                              <TableCell>{entry.newValues.grade}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Points</TableCell>
                              <TableCell>-</TableCell>
                              <TableCell>{entry.newValues.points}</TableCell>
                            </TableRow>
                            {entry.resultModel === 'ALevelResult' && (
                              <TableRow>
                                <TableCell>Principal Subject</TableCell>
                                <TableCell>-</TableCell>
                                <TableCell>{entry.newValues.isPrincipal ? 'Yes' : 'No'}</TableCell>
                              </TableRow>
                            )}
                          </>
                        )}
                        {entry.changeType === 'UPDATE' && (
                          <>
                            {entry.previousValues.marksObtained !== entry.newValues.marksObtained && (
                              <TableRow>
                                <TableCell>Marks</TableCell>
                                <TableCell>{entry.previousValues.marksObtained}</TableCell>
                                <TableCell>{entry.newValues.marksObtained}</TableCell>
                              </TableRow>
                            )}
                            {entry.previousValues.grade !== entry.newValues.grade && (
                              <TableRow>
                                <TableCell>Grade</TableCell>
                                <TableCell>{entry.previousValues.grade}</TableCell>
                                <TableCell>{entry.newValues.grade}</TableCell>
                              </TableRow>
                            )}
                            {entry.previousValues.points !== entry.newValues.points && (
                              <TableRow>
                                <TableCell>Points</TableCell>
                                <TableCell>{entry.previousValues.points}</TableCell>
                                <TableCell>{entry.newValues.points}</TableCell>
                              </TableRow>
                            )}
                            {entry.resultModel === 'ALevelResult' &&
                             entry.previousValues.isPrincipal !== entry.newValues.isPrincipal && (
                              <TableRow>
                                <TableCell>Principal Subject</TableCell>
                                <TableCell>{entry.previousValues.isPrincipal ? 'Yes' : 'No'}</TableCell>
                                <TableCell>{entry.newValues.isPrincipal ? 'Yes' : 'No'}</TableCell>
                              </TableRow>
                            )}
                          </>
                        )}
                        {entry.changeType === 'DELETE' && (
                          <>
                            <TableRow>
                              <TableCell>Marks</TableCell>
                              <TableCell>{entry.previousValues.marksObtained}</TableCell>
                              <TableCell>-</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Grade</TableCell>
                              <TableCell>{entry.previousValues.grade}</TableCell>
                              <TableCell>-</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Points</TableCell>
                              <TableCell>{entry.previousValues.points}</TableCell>
                              <TableCell>-</TableCell>
                            </TableRow>
                            {entry.resultModel === 'ALevelResult' && (
                              <TableRow>
                                <TableCell>Principal Subject</TableCell>
                                <TableCell>{entry.previousValues.isPrincipal ? 'Yes' : 'No'}</TableCell>
                                <TableCell>-</TableCell>
                              </TableRow>
                            )}
                          </>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Revert</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to revert to this version?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            This will change the marks back to the values from this history entry.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            id="reason"
            label="Reason for reverting (optional)"
            type="text"
            fullWidth
            variant="outlined"
            value={revertReason}
            onChange={(e) => setRevertReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmRevert}
            color="primary"
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Revert'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MarksHistoryViewer;
