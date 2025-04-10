import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import axios from 'axios';
import ResultManagement from './ResultManagement';

// Mock axios
jest.mock('axios');

// Mock Redux store
const initialState = {
  user: {
    token: 'fake-token',
    isAdmin: true
  }
};

const mockStore = createStore((state = initialState) => state);

describe('ResultManagement Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    axios.get.mockImplementationOnce(() => new Promise(() => {}));
    
    render(
      <Provider store={mockStore}>
        <ResultManagement />
      </Provider>
    );
    
    expect(screen.getByText('Loading results...')).toBeInTheDocument();
  });

  test('renders results after loading', async () => {
    const mockResults = [
      { _id: '1', studentId: 'STU001', examId: 'EXAM001', score: 95 },
      { _id: '2', studentId: 'STU002', examId: 'EXAM001', score: 85 }
    ];

    axios.get.mockResolvedValueOnce({ data: mockResults });

    render(
      <Provider store={mockStore}>
        <ResultManagement />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('STU001')).toBeInTheDocument();
      expect(screen.getByText('STU002')).toBeInTheDocument();
    });
  });

  test('can add new result', async () => {
    const mockResults = [];
    const newResult = { _id: '1', studentId: 'STU001', examId: 'EXAM001', score: 95 };

    axios.get.mockResolvedValueOnce({ data: mockResults });
    axios.post.mockResolvedValueOnce({ data: newResult });

    render(
      <Provider store={mockStore}>
        <ResultManagement />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Student ID')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Student ID'), {
      target: { value: 'STU001' }
    });
    fireEvent.change(screen.getByPlaceholderText('Exam ID'), {
      target: { value: 'EXAM001' }
    });
    fireEvent.change(screen.getByPlaceholderText('Score'), {
      target: { value: '95' }
    });

    fireEvent.click(screen.getByText('Add Result'));

    await waitFor(() => {
      expect(screen.getByText('Result added successfully!')).toBeInTheDocument();
    });
  });

  test('shows error message on failed API call', async () => {
    axios.get.mockRejectedValueOnce({ 
      response: { data: { message: 'Failed to fetch results' } }
    });

    render(
      <Provider store={mockStore}>
        <ResultManagement />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Error fetching results: Failed to fetch results')).toBeInTheDocument();
    });
  });
});