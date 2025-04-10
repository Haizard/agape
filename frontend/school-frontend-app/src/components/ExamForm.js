import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import axios from 'axios';

const ExamForm = ({ exam, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: exam ? exam.title : '',
    subject: exam ? exam.subject : '',
    date: exam ? exam.date : '',
    duration: exam ? exam.duration : '',
    type: exam ? exam.type : 'Midterm',
    class: exam ? exam.class : '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (exam) {
        await axios.put(`/api/exams/${exam._id}`, formData);
      } else {
        await axios.post('/api/exams', formData);
      }
      onSubmit();
    } catch (error) {
      console.error('Error submitting exam:', error);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <Typography variant="h6" gutterBottom>
        {exam ? 'Edit Exam' : 'Create Exam'}
      </Typography>
      <TextField
        margin="normal"
        required
        fullWidth
        label="Title"
        name="title"
        value={formData.title}
        onChange={handleChange}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        label="Subject"
        name="subject"
        value={formData.subject}
        onChange={handleChange}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        type="date"
        label="Date"
        name="date"
        value={formData.date}
        onChange={handleChange}
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        type="number"
        label="Duration (minutes)"
        name="duration"
        value={formData.duration}
        onChange={handleChange}
      />
      <FormControl fullWidth margin="normal">
        <InputLabel id="exam-type-label">Type</InputLabel>
        <Select
          labelId="exam-type-label"
          name="type"
          value={formData.type}
          onChange={handleChange}
        >
          <MenuItem value="Midterm">Midterm</MenuItem>
          <MenuItem value="Final">Final</MenuItem>
          <MenuItem value="Quiz">Quiz</MenuItem>
        </Select>
      </FormControl>
      <TextField
        margin="normal"
        required
        fullWidth
        label="Class"
        name="class"
        value={formData.class}
        onChange={handleChange}
      />
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={onCancel} sx={{ mr: 1 }}>
          Cancel
        </Button>
        <Button type="submit" variant="contained">
          {exam ? 'Update' : 'Create'}
        </Button>
      </Box>
    </Box>
  );
};

ExamForm.propTypes = {
  exam: PropTypes.shape({
    _id: PropTypes.string,
    title: PropTypes.string,
    subject: PropTypes.string,
    date: PropTypes.string,
    duration: PropTypes.string,
    type: PropTypes.string,
    class: PropTypes.string,
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

ExamForm.defaultProps = {
  exam: null,
};

export default ExamForm;
