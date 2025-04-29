import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import AssessmentManagement from './AssessmentManagement';
import { AssessmentProvider } from '../../contexts/AssessmentContext';

// Mock axios
jest.mock('axios');

// Mock data
const mockAssessments = [
  {
    _id: '1',
    name: 'Mid Term Test',
    weightage: 30,
    maxMarks: 100,
    term: '1',
    examDate: '2024-03-15',
    status: 'active'
  },
  {
    _id: '2',
    name: 'Final Exam',
    weightage: 70,
    maxMarks: 100,
    term: '1',
    examDate: '2024-04-30',
    status: 'active'
  }
];

describe('AssessmentManagement Component', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock successful API responses
    axios.get.mockResolvedValue({ data: mockAssessments });
    axios.post.mockResolvedValue({ data: mockAssessments[0] });
    axios.put.mockResolvedValue({ data: mockAssessments[0] });
    axios.delete.mockResolvedValue({ data: {} });
  });

  const renderComponent = () => {
    render(
      <AssessmentProvider>
        <AssessmentManagement />
      </AssessmentProvider>
    );
  };

  test('renders assessment management title', () => {
    renderComponent();
    expect(screen.getByText('Assessment Management')).toBeInTheDocument();
  });

  test('displays list of assessments', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Mid Term Test')).toBeInTheDocument();
      expect(screen.getByText('Final Exam')).toBeInTheDocument();
    });
  });

  test('opens create assessment dialog when add button is clicked', async () => {
    renderComponent();
    
    const addButton = screen.getByText('Add New Assessment');
    fireEvent.click(addButton);
    
    expect(screen.getByText('Add New Assessment')).toBeInTheDocument();
    expect(screen.getByLabelText('Assessment Name')).toBeInTheDocument();
  });

  test('validates weightage total when creating assessment', async () => {
    renderComponent();
    
    // Open create dialog
    fireEvent.click(screen.getByText('Add New Assessment'));
    
    // Fill form with invalid weightage
    await userEvent.type(screen.getByLabelText('Assessment Name'), 'New Test');
    await userEvent.type(screen.getByLabelText('Weightage (%)'), '80');
    await userEvent.type(screen.getByLabelText('Max Marks'), '100');
    
    // Try to save
    fireEvent.click(screen.getByText('Save'));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Total weightage cannot exceed 100%')).toBeInTheDocument();
    });
  });

  test('creates new assessment successfully', async () => {
    renderComponent();
    
    // Open create dialog
    fireEvent.click(screen.getByText('Add New Assessment'));
    
    // Fill form
    await userEvent.type(screen.getByLabelText('Assessment Name'), 'Quiz 1');
    await userEvent.type(screen.getByLabelText('Weightage (%)'), '20');
    await userEvent.type(screen.getByLabelText('Max Marks'), '50');
    await userEvent.type(screen.getByLabelText('Exam Date'), '2024-05-01');
    
    // Save
    fireEvent.click(screen.getByText('Save'));
    
    // Check for success message
    await waitFor(() => {
      expect(screen.getByText('Assessment created successfully')).toBeInTheDocument();
    });
  });

  test('edits existing assessment', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Mid Term Test')).toBeInTheDocument();
    });
    
    // Click edit button
    const editButtons = screen.getAllByTitle('Edit');
    fireEvent.click(editButtons[0]);
    
    // Modify name
    const nameInput = screen.getByLabelText('Assessment Name');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Updated Test');
    
    // Save
    fireEvent.click(screen.getByText('Save'));
    
    // Check for success message
    await waitFor(() => {
      expect(screen.getByText('Assessment updated successfully')).toBeInTheDocument();
    });
  });

  test('deletes assessment after confirmation', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Mid Term Test')).toBeInTheDocument();
    });
    
    // Mock window.confirm
    window.confirm = jest.fn(() => true);
    
    // Click delete button
    const deleteButtons = screen.getAllByTitle('Delete');
    fireEvent.click(deleteButtons[0]);
    
    // Check if confirmation was shown
    expect(window.confirm).toHaveBeenCalled();
    
    // Check for success message
    await waitFor(() => {
      expect(screen.getByText('Assessment deleted successfully')).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    // Mock API error
    axios.get.mockRejectedValueOnce(new Error('Failed to fetch'));
    
    renderComponent();
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch assessments')).toBeInTheDocument();
    });
  });

  test('validates required fields', async () => {
    renderComponent();
    
    // Open create dialog
    fireEvent.click(screen.getByText('Add New Assessment'));
    
    // Try to save without filling required fields
    fireEvent.click(screen.getByText('Save'));
    
    // Check for validation messages
    await waitFor(() => {
      expect(screen.getByText('Assessment name is required')).toBeInTheDocument();
    });
  });
});