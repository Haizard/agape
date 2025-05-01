/**
 * Report Service
 *
 * Handles report generation with automatic selection based on education level.
 * This is a refactored version that uses standardized approaches and consistent error handling.
 */

const ResultService = require('./resultService');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const Subject = require('../models/Subject');
const AcademicYear = require('../models/AcademicYear');
const Assessment = require('../models/Assessment');
const Result = require('../models/Result');
const { generateOLevelStudentReportPDF, generateOLevelClassReportPDF } = require('../utils/oLevelReportGenerator');
const { generateALevelStudentReportPDF, generateALevelClassReportPDF } = require('../utils/aLevelReportGenerator');
const resultConsistencyChecker = require('../utils/resultConsistencyChecker');
const schoolConfig = require('../config/schoolConfig');
const { EDUCATION_LEVELS } = require('../constants/apiEndpoints');
const logger = require('../utils/logger');

/**
 * Service to handle report generation with automatic selection based on education level
 */
class ReportService {
  constructor() {
    // Cache configuration
    this.MAX_CACHE_SIZE = 1000; // Maximum entries per cache
    this.CACHE_CLEANUP_THRESHOLD = 0.9; // Cleanup when 90% full

    // Initialize cache for frequently accessed data
    this.cache = {
      grades: new Map(),
      points: new Map(),
      remarks: new Map(),
      divisions: new Map()
    };

    // Initialize cache timestamps for LRU cleanup
    this.cacheTimestamps = {
      grades: new Map(),
      points: new Map(),
      remarks: new Map(),
      divisions: new Map()
    };

    // Bind cleanup method
    this.cleanupCache = this.cleanupCache.bind(this);

    // Schedule periodic cache cleanup
    setInterval(this.cleanupCache, 3600000); // Cleanup every hour

    // Initialize performance metrics
    this.metrics = {
      reportGenerationTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalReportsGenerated: 0
    };

    // Track cache performance
    this.trackCacheHit = () => this.metrics.cacheHits++;
    this.trackCacheMiss = () => this.metrics.cacheMisses++;
    this.getCacheHitRate = () => {
      const total = this.metrics.cacheHits + this.metrics.cacheMisses;
      return total > 0 ? (this.metrics.cacheHits / total * 100).toFixed(2) : 0;
    };

    // Initialize grade remarks
    this.gradeRemarks = {
      [EDUCATION_LEVELS.O_LEVEL]: {
        'A': 'Excellent performance',
        'B': 'Very good achievement',
        'C': 'Good achievement',
        'D': 'Fair achievement',
        'E': 'Average performance',
        'S': 'Below average',
        'F': 'Needs improvement'
      },
      [EDUCATION_LEVELS.A_LEVEL]: {
        'A': 'Outstanding achievement',
        'B': 'High level competence',
        'C': 'Good understanding',
        'D': 'Satisfactory grasp',
        'E': 'Basic understanding',
        'S': 'Limited comprehension',
        'F': 'Requires significant improvement'
      }
    };
  }

  /**
   * Clean up cache when it exceeds the size limit
   * @private
   */
  cleanupCache() {
    for (const cacheType of Object.keys(this.cache)) {
      const cache = this.cache[cacheType];
      const timestamps = this.cacheTimestamps[cacheType];

      if (cache.size > this.MAX_CACHE_SIZE * this.CACHE_CLEANUP_THRESHOLD) {
        // Sort entries by timestamp (oldest first)
        const entries = Array.from(timestamps.entries())
          .sort(([, timeA], [, timeB]) => timeA - timeB);

        // Remove oldest entries until we're back to 70% capacity
        const targetSize = Math.floor(this.MAX_CACHE_SIZE * 0.7);
        const entriesToRemove = entries.slice(0, cache.size - targetSize);

        for (const [key] of entriesToRemove) {
          cache.delete(key);
          timestamps.delete(key);
        }

        logger.info(`Cleaned up ${cacheType} cache. Removed ${entriesToRemove.length} entries`);
      }
    }
  }

  /**
   * Update cache entry with timestamp
   * @private
   */
  _updateCacheEntry(cacheType, key, value) {
    this.cache[cacheType].set(key, value);
    this.cacheTimestamps[cacheType].set(key, Date.now());
  }

  /**
   * Track report generation time and update metrics
   * @private
   */
  _trackReportGeneration(startTime) {
    const endTime = process.hrtime.bigint();
    this.metrics.reportGenerationTime = Number(endTime - startTime) / 1e6; // Convert to milliseconds
    this.metrics.totalReportsGenerated++;
    
    // Log performance metrics
    logger.info(`Report generation completed in ${this.metrics.reportGenerationTime.toFixed(2)}ms`);
    logger.info(`Cache hit rate: ${this.getCacheHitRate()}%`);
  }

  /**
   * Get remarks based on grade and education level
   * @param {String} grade - The grade (A, B, C, D, E, S, F)
   * @param {String} educationLevel - The education level (O_LEVEL or A_LEVEL)
   * @returns {String} - The remarks for the grade
   */
  getRemarksByLevel(grade, educationLevel = EDUCATION_LEVELS.O_LEVEL) {
    // Check cache first
    const cacheKey = `${grade}-${educationLevel}`;
    if (this.cache.remarks.has(cacheKey)) {
      this.trackCacheHit();
      return this.cache.remarks.get(cacheKey);
    }
    this.trackCacheMiss();

    // Get remarks based on education level and grade
    const remarks = this.gradeRemarks[educationLevel]?.[grade] || 'No remarks available';

    // Cache the result
    this.cache.remarks.set(cacheKey, remarks);
    return remarks;
  }

  /**
   * Calculate grade based on percentage
   * @param {Number} percentage - The percentage marks
   * @returns {String} - The grade (A, B, C, D, E, S, F)
   */
  calculateGrade(percentage) {
    // Check cache first
    const cacheKey = Math.round(percentage);
    if (this.cache.grades.has(cacheKey)) {
      this.trackCacheHit();
      return this.cache.grades.get(cacheKey);
    }
    this.trackCacheMiss();

    // Calculate grade
    let grade;
    if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';
    else if (percentage >= 40) grade = 'E';
    else if (percentage >= 35) grade = 'S';
    else grade = 'F';

    // Cache the result
    this.cache.grades.set(cacheKey, grade);
    return grade;
  }

  /**
   * Calculate points based on grade
   * @param {String} grade - The grade (A, B, C, D, E, S, F)
   * @returns {Number} - The points
   */
  calculatePoints(grade) {
    // Check cache first
    if (this.cache.points.has(grade)) {
      this.trackCacheHit();
      return this.cache.points.get(grade);
    }
    this.trackCacheMiss();

    // Calculate points
    let points;
    switch (grade) {
      case 'A': points = 1; break;
      case 'B': points = 2; break;
      case 'C': points = 3; break;
      case 'D': points = 4; break;
      case 'E': points = 5; break;
      case 'S': points = 6; break;
      case 'F': points = 7; break;
      default: points = null;
    }

    // Cache the result
    this.cache.points.set(grade, points);
    return points;
  }

  /**
   * Calculate O-Level division based on best seven points
   * @param {Number} points - Total points from best seven subjects
   * @returns {String} - The division (I, II, III, IV, or F)
   */
  calculateOLevelDivision(points) {
    if (points === null || points === undefined) return 'N/A';
    
    // Check cache first
    const cacheKey = `O-${points}`;
    if (this.cache.divisions.has(cacheKey)) {
      this.trackCacheHit();
      return this.cache.divisions.get(cacheKey);
    }
    this.trackCacheMiss();

    let division;
    if (points <= 32) division = 'I';
    else if (points <= 45) division = 'II';
    else if (points <= 59) division = 'III';
    else if (points <= 72) division = 'IV';
    else division = 'F';

    // Cache the result
    this.cache.divisions?.set(`O-${points}`, division);
    return division;
  }

  /**
   * Calculate A-Level division based on best three principal subject points
   * @param {Number} points - Total points from best three principal subjects
   * @returns {String} - The division (I, II, III, IV, or F)
   */
  calculateALevelDivision(points) {
    if (points === null || points === undefined) return 'N/A';

    // Check cache first
    const cacheKey = `A-${points}`;
    if (this.cache.divisions.has(cacheKey)) {
      this.trackCacheHit();
      return this.cache.divisions.get(cacheKey);
    }
    this.trackCacheMiss();

    let division;
    if (points <= 12) division = 'I';
    else if (points <= 15) division = 'II';
    else if (points <= 18) division = 'III';
    else if (points <= 21) division = 'IV';
    else division = 'F';

    // Cache the result
    this.cache.divisions?.set(`A-${points}`, division);
    return division;
  }

  /**
   * Generate a student result report in JSON format
   * @param {String} studentId - The student ID
   * @param {String} examId - The exam ID
   * @param {String} [providedEducationLevel] - Optional education level override
   * @returns {Promise<Object>} - The report data
   */
  async generateStudentReportJson(studentId, term, providedEducationLevel) {
    // Validate input parameters
    if (!studentId || typeof studentId !== 'string') {
      throw new Error('Invalid studentId: must be a non-empty string');
    }
    if (!term || !['1', '2', '3'].includes(term.toString())) {
      throw new Error('Invalid term: must be 1, 2, or 3');
    }
    if (providedEducationLevel && ![EDUCATION_LEVELS.O_LEVEL, EDUCATION_LEVELS.A_LEVEL].includes(providedEducationLevel)) {
      throw new Error('Invalid education level: must be O_LEVEL or A_LEVEL');
    }
    const startTime = process.hrtime.bigint();
    try {
      // Get student details
      const student = await Student.findById(studentId);
      if (!student) {
        throw new Error(`Student not found with ID: ${studentId}`);
      }

      // Get class details
      const classObj = await Class.findById(student.class);
      if (!classObj) {
        throw new Error(`Class not found for student: ${studentId}`);
      }

      // Get all active assessments for the term, sorted by displayOrder
      const assessments = await Assessment.find({
        term,
        status: 'active',
        isVisible: true
      }).sort({ displayOrder: 1, examDate: 1 });

      if (!assessments || assessments.length === 0) {
        throw new Error(`No assessments found for term ${term}`);
      }

      // Get all students in the class for ranking
      const classStudents = await Student.find({ class: classObj._id });

      // Initialize report data
      const subjectResults = [];
      let totalMarks = 0;
      let totalPoints = 0;
      let resultsCount = 0;
      const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, E: 0, S: 0, F: 0 };

      // Get all subjects for this class
      const classSubjects = classObj.subjects.map(s => s.subject).filter(Boolean);

      // Process each subject
      for (const subject of classSubjects) {
        const subjectAssessments = [];
        let subjectTotalMarks = 0;
        let subjectWeightedMarks = 0;
        let subjectTotalWeightage = 0;

        // Get all results for this subject's assessments in one query
        const results = await Result.find({
          studentId: studentId,
          assessmentId: { $in: assessments.map(a => a._id) },
          subjectId: subject._id
        }).lean();

        // Process each assessment
        for (const assessment of assessments) {
          const result = results.find(r => r.assessmentId.toString() === assessment._id.toString());

          // Always include the assessment, even if no result exists
          const assessmentEntry = {
            assessmentName: assessment.name,
            marks: result ? result.marksObtained : null,
            maxMarks: assessment.maxMarks,
            weightage: assessment.weightage,
            weightedMarks: result ? (result.marksObtained / assessment.maxMarks) * assessment.weightage : 0
          };

          subjectAssessments.push(assessmentEntry);

          if (result) {
            subjectTotalMarks += result.marksObtained;
            subjectWeightedMarks += (result.marksObtained / assessment.maxMarks) * assessment.weightage;
            subjectTotalWeightage += assessment.weightage;
          }
        }

        // Calculate final grade based on weighted average
        const finalPercentage = subjectTotalWeightage > 0 ? (subjectWeightedMarks / subjectTotalWeightage) * 100 : 0;
        const grade = this.calculateGrade(finalPercentage);
        const points = this.calculatePoints(grade);

        // Update grade distribution
        if (gradeDistribution[grade] !== undefined) {
          gradeDistribution[grade]++;
        }

        // Update totals
        totalMarks += finalPercentage;
        totalPoints += points;
        resultsCount++;

        // Add to subject results
        subjectResults.push({
          subject: subject.name,
          assessments: subjectAssessments,
          totalMarks: subjectTotalMarks,
          weightedAverage: finalPercentage.toFixed(2),
          grade,
          points,
          remarks: this.getRemarksByLevel(grade, providedEducationLevel),
          isPrincipal: subject.isPrincipal || false
        });
      }

      // Return the processed subject results
      return {
        reportTitle: `Term ${term} Assessment Report`,
        schoolName: schoolConfig.name,
        studentDetails: {
          name: `${student.firstName} ${student.lastName}`,
          rollNumber: student.rollNumber,
          class: `${classObj.name} ${classObj.section || ''} ${classObj.stream || ''}`.trim(),
          gender: student.gender
        },
        subjectResults,
        summary: {
          totalMarks,
          averageMarks: resultsCount > 0 ? (totalMarks / resultsCount).toFixed(2) : '0.00',
          totalPoints,
          gradeDistribution
        },
        student: {
          fullName: `${student.firstName} ${student.lastName}`
        },
        class: {
          fullName: `${classObj.name} ${classObj.section || ''} ${classObj.stream || ''}`.trim()
        },
        term
      };
    } catch (error) {
      logger.error(`Error generating student report JSON: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate a student result report
   * @param {String} studentId - The student ID
   * @param {String} examId - The exam ID
   * @param {Object} res - Express response object for PDF streaming
   * @param {String} [providedEducationLevel] - Optional education level override
   * @returns {Promise<void>} - Streams PDF to response
   */
  async generateStudentReport(studentId, examId, res, providedEducationLevel) {
    const startTime = process.hrtime.bigint();
    try {
      // Get report data
      const report = await this.generateStudentReportJson(studentId, examId, providedEducationLevel);

      // Generate PDF based on education level
      if (report.educationLevel === EDUCATION_LEVELS.A_LEVEL) {
        generateALevelStudentReportPDF(report, res);
      } else {
        generateOLevelStudentReportPDF(report, res);
      }
    } catch (error) {
      logger.error(`Error generating student report PDF: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new ReportService();
