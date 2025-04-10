import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import academicService from '../services/academicService';
import PropTypes from 'prop-types';

const AcademicContext = createContext();

export const AcademicProvider = ({ children }) => {
  const [academicYears, setAcademicYears] = useState([]);
  const [currentYear, setCurrentYear] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all academic years
  const fetchAcademicYears = useCallback(async () => {
    setLoading(true);
    try {
      const data = await academicService.getAcademicYears();
      setAcademicYears(data);

      // Find the active academic year
      const activeYear = data.find(year => year.isActive);
      if (activeYear) {
        setCurrentYear(activeYear);
      } else if (data.length > 0) {
        // If no active year, use the most recent one
        const sortedYears = [...data].sort((a, b) => b.year - a.year);
        setCurrentYear(sortedYears[0]);
      }

      setError(null);
    } catch (error) {
      console.error('Failed to fetch academic years:', error);
      setError('Failed to load academic years. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new academic year
  const createAcademicYear = useCallback(async (academicYearData) => {
    try {
      const data = await academicService.createAcademicYear(academicYearData);
      await fetchAcademicYears(); // Refresh the list
      return { success: true, data };
    } catch (error) {
      console.error('Failed to create academic year:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create academic year'
      };
    }
  }, [fetchAcademicYears]);

  // Update an existing academic year
  const updateAcademicYear = useCallback(async (id, academicYearData) => {
    try {
      const data = await academicService.updateAcademicYear(id, academicYearData);
      await fetchAcademicYears(); // Refresh the list
      return { success: true, data };
    } catch (error) {
      console.error('Failed to update academic year:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update academic year'
      };
    }
  }, [fetchAcademicYears]);

  // Delete an academic year
  const deleteAcademicYear = useCallback(async (id) => {
    try {
      await academicService.deleteAcademicYear(id);
      await fetchAcademicYears(); // Refresh the list
      return { success: true };
    } catch (error) {
      console.error('Failed to delete academic year:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete academic year'
      };
    }
  }, [fetchAcademicYears]);

  // Set an academic year as active
  const setActiveAcademicYear = useCallback(async (id) => {
    try {
      const data = await academicService.setActiveAcademicYear(id);
      await fetchAcademicYears(); // Refresh the list
      return { success: true, data };
    } catch (error) {
      console.error('Failed to set active academic year:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to set active academic year'
      };
    }
  }, [fetchAcademicYears]);

  // Get the current term based on the current date
  const getCurrentTerm = useCallback(() => {
    if (!currentYear || !currentYear.terms || currentYear.terms.length === 0) {
      return null;
    }

    const now = new Date();
    return currentYear.terms.find(term => {
      const startDate = new Date(term.startDate);
      const endDate = new Date(term.endDate);
      return now >= startDate && now <= endDate;
    }) || currentYear.terms[0]; // Default to first term if no current term
  }, [currentYear]);

  // Initial fetch
  useEffect(() => {
    fetchAcademicYears();
  }, [fetchAcademicYears]);

  return (
    <AcademicContext.Provider value={{
      academicYears,
      currentYear,
      loading,
      error,
      fetchAcademicYears,
      createAcademicYear,
      updateAcademicYear,
      deleteAcademicYear,
      setActiveAcademicYear,
      getCurrentTerm
    }}>
      {children}
    </AcademicContext.Provider>
  );
};

export const useAcademic = () => useContext(AcademicContext);

AcademicProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
