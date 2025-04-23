/**
 * Prisma Results Service Index
 * 
 * This file exports all results-related services.
 */

const baseResultsService = require('./baseResultsService');
const oLevelResultsService = require('./oLevelResultsService');
const aLevelResultsService = require('./aLevelResultsService');

module.exports = {
  // Base results service
  getStudentResults: baseResultsService.getStudentResults,
  getClassResults: baseResultsService.getClassResults,
  generateStudentReport: baseResultsService.generateStudentReport,
  generateClassReport: baseResultsService.generateClassReport,
  
  // O-Level results service
  getOLevelStudentResults: oLevelResultsService.getOLevelStudentResults,
  getOLevelClassResults: oLevelResultsService.getOLevelClassResults,
  generateOLevelStudentReport: oLevelResultsService.generateOLevelStudentReport,
  generateOLevelClassReport: oLevelResultsService.generateOLevelClassReport,
  
  // A-Level results service
  getALevelStudentResults: aLevelResultsService.getALevelStudentResults,
  getALevelClassResults: aLevelResultsService.getALevelClassResults,
  generateALevelStudentReport: aLevelResultsService.generateALevelStudentReport,
  generateALevelClassReport: aLevelResultsService.generateALevelClassReport
};
