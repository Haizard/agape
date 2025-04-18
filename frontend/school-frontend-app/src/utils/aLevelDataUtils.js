/**
 * A-Level Data Utilities
 *
 * These utilities help normalize and process A-Level result data
 * without changing existing component structure or logic.
 */

import { formatGrade, formatDivision, formatMarks, formatPoints } from './aLevelFormatUtils';
import { calculateGradeAndPoints, calculateBestThreeAndDivision } from './aLevelGradeUtils';

/**
 * Normalize A-Level subject result
 * @param {Object} result - Subject result object
 * @returns {Object} - Normalized subject result
 */
export const normalizeSubjectResult = (result) => {
  if (!result) return null;

  // Extract values with fallbacks
  // Ensure we handle both marksObtained and marks properties consistently
  const marksObtained = result.marksObtained ?? result.marks ?? null;
  let grade = result.grade || '';
  let points = result.points;
  let isPrincipal = result.isPrincipal ?? false; // Ensure isPrincipal is always defined

  // Calculate grade and points if not provided
  if (marksObtained !== null && (!grade || points === undefined)) {
    const calculated = calculateGradeAndPoints(marksObtained);
    grade = grade || calculated.grade;
    points = points !== undefined ? points : calculated.points;
  }

  // Format values
  const formattedGrade = formatGrade(grade);
  const formattedMarks = formatMarks(marksObtained);
  const formattedPoints = formatPoints(points);

  return {
    ...result,
    marksObtained,
    marks: marksObtained, // For compatibility
    grade: formattedGrade,
    points: points !== undefined ? points : (formattedGrade !== '-' ? parseInt(formattedPoints) : 7),
    isPrincipal // Ensure isPrincipal is included
  };
};

/**
 * Normalize A-Level result summary
 * @param {Object} summary - Result summary object
 * @returns {Object} - Normalized result summary
 */
export const normalizeResultSummary = (summary) => {
  if (!summary) return {};

  // Extract values with fallbacks
  const totalMarks = summary.totalMarks || 0;
  const averageMarks = summary.averageMarks || 0;
  const totalPoints = summary.totalPoints || 0;
  const bestThreePoints = summary.bestThreePoints || 0;
  const division = summary.division || '0';
  const rank = summary.rank || '-';
  const totalStudents = summary.totalStudents || 0;

  // Format values
  const formattedDivision = formatDivision(division, false);

  return {
    ...summary,
    totalMarks,
    averageMarks: typeof averageMarks === 'number' ? averageMarks : parseFloat(averageMarks),
    totalPoints,
    bestThreePoints,
    division: formattedDivision,
    rank,
    totalStudents
  };
};

/**
 * Process A-Level subject results
 * @param {Array} results - Array of subject results
 * @returns {Object} - Processed results with calculated values
 */
export const processSubjectResults = (results) => {
  if (!Array.isArray(results) || results.length === 0) {
    return {
      normalizedResults: [],
      principalResults: [],
      subsidiaryResults: [],
      totalMarks: 0,
      averageMarks: 0,
      totalPoints: 0,
      bestThreePoints: 0,
      division: '0',
      gradeDistribution: {}
    };
  }

  // Normalize all results
  const normalizedResults = results.map(normalizeSubjectResult);

  // Split into principal and subsidiary
  const principalResults = normalizedResults.filter(r => r.isPrincipal);
  const subsidiaryResults = normalizedResults.filter(r => !r.isPrincipal);

  // Calculate totals
  const totalMarks = normalizedResults.reduce((sum, r) => sum + (r.marksObtained || 0), 0);
  const averageMarks = normalizedResults.length > 0 ? totalMarks / normalizedResults.length : 0;
  const totalPoints = normalizedResults.reduce((sum, r) => sum + (r.points || 7), 0);

  // Calculate best three and division
  const { bestThreePoints, division } = calculateBestThreeAndDivision(principalResults);

  // Calculate grade distribution
  const gradeDistribution = normalizedResults.reduce((dist, r) => {
    const grade = r.grade || '-';
    dist[grade] = (dist[grade] || 0) + 1;
    return dist;
  }, {});

  return {
    normalizedResults,
    principalResults,
    subsidiaryResults,
    totalMarks,
    averageMarks,
    totalPoints,
    bestThreePoints,
    division,
    gradeDistribution
  };
};

export default {
  normalizeSubjectResult,
  normalizeResultSummary,
  processSubjectResults
};
