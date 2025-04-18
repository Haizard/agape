import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import ALevelClassReport from '../components/results/aLevel/ALevelClassReport';

// Mock axios
const mockAxios = new MockAdapter(axios);

// Mock data
const mockClassReport = {
  classId: 'class123',
  className: 'Form 5A',
  section: 'A',
  stream: 'Science',
  formLevel: 5,
  examId: 'exam123',
  examName: 'Mid Term Exam',
  academicYear: '2023',
  examDate: '2023-06-01 - 2023-06-10',
  students: [
    {
      id: 'student1',
      name: 'John Doe',
      rollNumber: 'S001',
      sex: 'M',
      results: [
        {
          subject: 'Physics',
          code: 'PHY',
          marks: 85,
          grade: 'A',
          points: 1,
          remarks: 'Excellent',
          isPrincipal: true
        },
        {
          subject: 'Chemistry',
          code: 'CHE',
          marks: 78,
          grade: 'B',
          points: 2,
          remarks: 'Good',
          isPrincipal: true
        }
      ],
      totalMarks: 163,
      averageMarks: '81.50',
      totalPoints: 3,
      bestThreePoints: 3,
      division: 'I',
      rank: 1
    }
  ],
  classAverage: 81.5,
  totalStudents: 1,
  divisionDistribution: {
    'I': 1,
    'II': 0,
    'III': 0,
    'IV': 0,
    '0': 0
  },
  educationLevel: 'A_LEVEL'
};

// Mock the PDF generation utility
jest.mock('../utils/pdfGenerationUtils', () => ({
  generateALevelClassReportPdf: jest.fn().mockResolvedValue(true)
}));

// Mock the hooks
jest.mock('../hooks/useALevelClassReport', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    report: mockClassReport,
    loading: false,
    error: null,
    isFromCache: false,
    fetchReport: jest.fn(),
    refreshReport: jest.fn()
  })
}));

describe('ALevelClassReport Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock API responses
    mockAxios.reset();
    mockAxios.onGet('/api/a-level-reports/class/class123/exam123').reply(200, {
      success: true,
      data: mockClassReport
    });
  });
  
  test('renders the class report with correct data', async () => {
    render(
      <MemoryRouter initialEntries={['/results/a-level/class/class123/exam123']}>
        <Routes>
          <Route path="/results/a-level/class/:classId/:examId" element={<ALevelClassReport />} />
        </Routes>
      </MemoryRouter>
    );
    
    // Wait for the report to load
    await waitFor(() => {
      expect(screen.getByText('A-LEVEL CLASS RESULT REPORT')).toBeInTheDocument();
    });
    
    // Check class information
    expect(screen.getByText('Form 5A')).toBeInTheDocument();
    expect(screen.getByText('Mid Term Exam')).toBeInTheDocument();
    
    // Check student data
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    
    // Check tabs
    expect(screen.getByText('Results')).toBeInTheDocument();
    expect(screen.getByText('Statistics')).toBeInTheDocument();
    
    // Click on Statistics tab
    fireEvent.click(screen.getByText('Statistics'));
    
    // Check statistics
    expect(screen.getByText('Division Distribution')).toBeInTheDocument();
  });
  
  test('handles form level filtering', async () => {
    // Mock the useALevelClassReport hook with form level
    require('../hooks/useALevelClassReport').default.mockReturnValue({
      report: {
        ...mockClassReport,
        formLevel: 5
      },
      loading: false,
      error: null,
      isFromCache: false,
      fetchReport: jest.fn(),
      refreshReport: jest.fn()
    });
    
    render(
      <MemoryRouter initialEntries={['/results/a-level/class/class123/exam123/form/5']}>
        <Routes>
          <Route path="/results/a-level/class/:classId/:examId/form/:formLevel" element={<ALevelClassReport />} />
        </Routes>
      </MemoryRouter>
    );
    
    // Wait for the report to load
    await waitFor(() => {
      expect(screen.getByText('A-LEVEL CLASS RESULT REPORT')).toBeInTheDocument();
    });
    
    // Check form level is displayed
    expect(screen.getByText('Form 5A (Form 5)')).toBeInTheDocument();
  });
  
  test('shows loading state', async () => {
    // Mock the useALevelClassReport hook with loading state
    require('../hooks/useALevelClassReport').default.mockReturnValue({
      report: null,
      loading: true,
      error: null,
      isFromCache: false,
      fetchReport: jest.fn(),
      refreshReport: jest.fn()
    });
    
    render(
      <MemoryRouter initialEntries={['/results/a-level/class/class123/exam123']}>
        <Routes>
          <Route path="/results/a-level/class/:classId/:examId" element={<ALevelClassReport />} />
        </Routes>
      </MemoryRouter>
    );
    
    // Check loading state
    expect(screen.getByText('Loading A-Level Class Result Report...')).toBeInTheDocument();
  });
  
  test('shows error state', async () => {
    // Mock the useALevelClassReport hook with error state
    require('../hooks/useALevelClassReport').default.mockReturnValue({
      report: null,
      loading: false,
      error: new Error('Failed to load report'),
      isFromCache: false,
      fetchReport: jest.fn(),
      refreshReport: jest.fn()
    });
    
    render(
      <MemoryRouter initialEntries={['/results/a-level/class/class123/exam123']}>
        <Routes>
          <Route path="/results/a-level/class/:classId/:examId" element={<ALevelClassReport />} />
        </Routes>
      </MemoryRouter>
    );
    
    // Check error state
    expect(screen.getByText('Failed to load report')).toBeInTheDocument();
  });
});
