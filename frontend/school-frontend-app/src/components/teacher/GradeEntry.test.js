import React from 'react';
import { shallow } from 'enzyme';
import GradeEntry from './GradeEntry';

describe('GradeEntry Component', () => {
  test('renders GradeEntry component', () => {
    const wrapper = shallow(<GradeEntry />);
    expect(wrapper.find('form').exists()).toBe(true);
  });

  test('submits grade successfully', () => {
    const mockSubmit = jest.fn();
    const wrapper = shallow(<GradeEntry onSubmit={mockSubmit} />);
    const gradeInput = wrapper.find('input[name="grade"]');
    const submitButton = wrapper.find('button[type="submit"]');

    gradeInput.simulate('change', { target: { value: 'A' } });
    submitButton.simulate('submit', { preventDefault: () => {} });

    expect(mockSubmit).toHaveBeenCalledWith({
      studentId: '123',
      examId: '456',
      grade: 'A'
    });
  });

  test('handles error when submitting grade', () => {
    const mockSubmit = jest.fn(() => Promise.reject(new Error('API Error')));
    const wrapper = shallow(<GradeEntry onSubmit={mockSubmit} />);
    const gradeInput = wrapper.find('input[name="grade"]');
    const submitButton = wrapper.find('button[type="submit"]');

    gradeInput.simulate('change', { target: { value: 'A' } });
    submitButton.simulate('submit', { preventDefault: () => {} });

    expect(wrapper.find('.error-message').text()).toBe('Failed to submit marks. Please try again.');
  });
});
