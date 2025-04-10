import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ExamForm from './ExamForm';

const ExamList = () => {
  const [exams, setExams] = useState([]);

  const fetchExams = async () => {
    try {
      const response = await axios.get('/api/exams');
      setExams(response.data);
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  const handleCreateExam = () => {
    setIsFormOpen(true);
    setSelectedExam(null);
  };

  const handleEditExam = (exam) => {
    setIsFormOpen(true);
    setSelectedExam(exam);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedExam(null);
  };

  const handleExamSubmit = async () => {
    await fetchExams();
    handleCloseForm();
  };

  return (
    <div>
      <h2>Exams</h2>
<button onClick={handleCreateExam} type="button">Create New Exam</button>
      <ul>
        {exams.map(exam => (
          <li key={exam._id}>
            {exam.title} - {exam.subject} - {new Date(exam.date).toLocaleDateString()}
<button onClick={() => handleEditExam(exam)} type="button">Edit</button>
          </li>
        ))}
      </ul>
      {isFormOpen && (
        <ExamForm exam={selectedExam} onSubmit={handleExamSubmit} onCancel={handleCloseForm} />
      )}
    </div>
  );
};

export default ExamList;
