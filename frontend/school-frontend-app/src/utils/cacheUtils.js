/**
 * @fileoverview Utilities for caching API responses and providing offline support
 * This file contains functions for caching data in localStorage and providing fallback data
 */

/**
 * Default cache expiration time (24 hours in milliseconds)
 * @type {number}
 */
const DEFAULT_CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

/**
 * Maximum cache size in bytes (5MB)
 * @type {number}
 */
const MAX_CACHE_SIZE = 5 * 1024 * 1024;

/**
 * Cache prefix for all cached items
 * @type {string}
 */
const CACHE_PREFIX = 'agape_cache_';

/**
 * Generates a cache key for a specific resource
 * @param {string} resourceType - Type of resource (e.g., 'student', 'class', 'exam')
 * @param {string} id - Resource ID
 * @param {Object} [params={}] - Additional parameters
 * @returns {string} Cache key
 */
export const generateCacheKey = (resourceType, id, params = {}) => {
  // Ensure params is an object
  if (!params || typeof params !== 'object') {
    return `${CACHE_PREFIX}${resourceType}_${id || 'unknown'}`;
  }

  const paramsString = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return `${CACHE_PREFIX}${resourceType}_${id || 'unknown'}${paramsString ? `_${paramsString}` : ''}`;
};

/**
 * Saves data to cache
 * @param {string} key - Cache key
 * @param {*} data - Data to cache
 * @param {number} [expiration=DEFAULT_CACHE_EXPIRATION] - Cache expiration time in milliseconds
 * @returns {boolean} Whether the data was successfully cached
 */
export const saveToCache = (key, data, expiration = DEFAULT_CACHE_EXPIRATION) => {
  try {
    // Check if localStorage is available
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage is not available for caching');
      return false;
    }

    // Check if we have enough space
    if (!hasEnoughCacheSpace(key, data)) {
      console.warn('Not enough cache space, clearing old cache items');
      clearOldCacheItems();

      // Check again after clearing
      if (!hasEnoughCacheSpace(key, data)) {
        console.error('Still not enough cache space after clearing old items');
        return false;
      }
    }

    // Prepare cache item
    const cacheItem = {
      data,
      timestamp: Date.now(),
      expiration: Date.now() + expiration
    };

    // Save to localStorage
    localStorage.setItem(key, JSON.stringify(cacheItem));

    return true;
  } catch (error) {
    console.error('Error saving to cache:', error);
    return false;
  }
};

/**
 * Gets data from cache
 * @param {string} key - Cache key
 * @param {boolean} [ignoreExpiration=false] - Whether to ignore expiration
 * @returns {*} Cached data or null if not found or expired
 */
export const getFromCache = (key, ignoreExpiration = false) => {
  try {
    // Check if localStorage is available
    if (!isLocalStorageAvailable()) {
      return null;
    }

    // Get from localStorage
    const cacheItemString = localStorage.getItem(key);
    if (!cacheItemString) {
      return null;
    }

    // Parse cache item
    const cacheItem = JSON.parse(cacheItemString);

    // Check expiration
    if (!ignoreExpiration && cacheItem.expiration < Date.now()) {
      console.log(`Cache item ${key} has expired`);
      localStorage.removeItem(key);
      return null;
    }

    return cacheItem.data;
  } catch (error) {
    console.error('Error getting from cache:', error);
    return null;
  }
};

/**
 * Removes data from cache
 * @param {string} key - Cache key
 * @returns {boolean} Whether the data was successfully removed
 */
export const removeFromCache = (key) => {
  try {
    // Check if localStorage is available
    if (!isLocalStorageAvailable()) {
      return false;
    }

    // Remove from localStorage
    localStorage.removeItem(key);

    return true;
  } catch (error) {
    console.error('Error removing from cache:', error);
    return false;
  }
};

/**
 * Clears all cached items
 * @returns {boolean} Whether the cache was successfully cleared
 */
export const clearCache = () => {
  try {
    // Check if localStorage is available
    if (!isLocalStorageAvailable()) {
      return false;
    }

    // Get all keys
    const keys = Object.keys(localStorage);

    // Remove all cache items
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });

    return true;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return false;
  }
};

/**
 * Clears old cache items
 * @param {number} [maxItems=100] - Maximum number of items to keep
 * @returns {boolean} Whether old items were successfully cleared
 */
export const clearOldCacheItems = (maxItems = 100) => {
  try {
    // Check if localStorage is available
    if (!isLocalStorageAvailable()) {
      return false;
    }

    // Get all cache keys
    const keys = Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_PREFIX));

    // If we have fewer items than the maximum, do nothing
    if (keys.length <= maxItems) {
      return true;
    }

    // Get all cache items with their timestamps
    const cacheItems = keys.map(key => {
      try {
        const item = JSON.parse(localStorage.getItem(key));
        return { key, timestamp: item.timestamp };
      } catch (e) {
        return { key, timestamp: 0 };
      }
    });

    // Sort by timestamp (oldest first)
    cacheItems.sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest items
    const itemsToRemove = cacheItems.slice(0, cacheItems.length - maxItems);
    itemsToRemove.forEach(item => {
      localStorage.removeItem(item.key);
    });

    return true;
  } catch (error) {
    console.error('Error clearing old cache items:', error);
    return false;
  }
};

/**
 * Checks if localStorage is available
 * @returns {boolean} Whether localStorage is available
 */
export const isLocalStorageAvailable = () => {
  try {
    const testKey = `${CACHE_PREFIX}test`;
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Checks if there's enough space in the cache
 * @param {string} key - Cache key
 * @param {*} data - Data to cache
 * @returns {boolean} Whether there's enough space
 */
export const hasEnoughCacheSpace = (key, data) => {
  try {
    // Check if localStorage is available
    if (!isLocalStorageAvailable()) {
      return false;
    }

    // Calculate size of data
    const dataString = JSON.stringify({ data, timestamp: Date.now(), expiration: Date.now() });
    const dataSize = new Blob([dataString]).size;

    // Calculate current cache size
    let currentSize = 0;
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        currentSize += new Blob([localStorage.getItem(key)]).size;
      }
    });

    // Check if we have enough space
    return currentSize + dataSize <= MAX_CACHE_SIZE;
  } catch (error) {
    console.error('Error checking cache space:', error);
    return false;
  }
};

/**
 * Gets the current cache size in bytes
 * @returns {number} Cache size in bytes
 */
export const getCacheSize = () => {
  try {
    // Check if localStorage is available
    if (!isLocalStorageAvailable()) {
      return 0;
    }

    // Calculate current cache size
    let currentSize = 0;
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        currentSize += new Blob([localStorage.getItem(key)]).size;
      }
    });

    return currentSize;
  } catch (error) {
    console.error('Error getting cache size:', error);
    return 0;
  }
};

/**
 * Fetches data with cache support
 * @param {Function} fetchFn - Function to fetch data
 * @param {string} cacheKey - Cache key
 * @param {Object} options - Options
 * @param {number} options.expiration - Cache expiration time in milliseconds
 * @param {boolean} options.forceRefresh - Whether to force a refresh
 * @param {Function} options.onSuccess - Function to call on success
 * @param {Function} options.onError - Function to call on error
 * @returns {Promise<*>} Fetched or cached data
 */
export const fetchWithCache = async (
  fetchFn,
  cacheKey,
  { expiration = DEFAULT_CACHE_EXPIRATION, forceRefresh = false, onSuccess, onError } = {}
) => {
  try {
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedData = getFromCache(cacheKey);
      if (cachedData) {
        console.log(`Using cached data for ${cacheKey}`);
        if (onSuccess) onSuccess(cachedData, true);
        return cachedData;
      }
    }

    // Fetch fresh data
    const data = await fetchFn();

    // Save to cache
    saveToCache(cacheKey, data, expiration);

    if (onSuccess) onSuccess(data, false);
    return data;
  } catch (error) {
    console.error(`Error fetching data for ${cacheKey}:`, error);

    // Try to get from cache even if expired
    const cachedData = getFromCache(cacheKey, true);
    if (cachedData) {
      console.log(`Using expired cached data for ${cacheKey} due to fetch error`);
      if (onSuccess) onSuccess(cachedData, true);
      return cachedData;
    }

    if (onError) onError(error);
    throw error;
  }
};

/**
 * Generates mock data for offline use
 * @param {string} resourceType - Type of resource
 * @param {Object} params - Parameters for mock data generation
 * @returns {*} Mock data
 */
export const generateMockData = (resourceType, params = {}) => {
  switch (resourceType) {
    case 'student':
      return generateMockStudentData(params);
    case 'class':
      return generateMockClassData(params);
    case 'exam':
      return generateMockExamData(params);
    case 'result':
      return generateMockResultData(params);
    default:
      return null;
  }
};

/**
 * Generates mock student data
 * @param {Object} params - Parameters for mock data generation
 * @returns {Object} Mock student data
 */
const generateMockStudentData = ({ educationLevel = 'O_LEVEL', form = 1 } = {}) => {
  return {
    _id: 'mock-student-id',
    firstName: 'Mock',
    lastName: 'Student',
    rollNumber: 'MOCK123',
    gender: 'male',
    dateOfBirth: '2005-01-01',
    educationLevel,
    form,
    class: {
      _id: 'mock-class-id',
      name: `Form ${form}`,
      stream: 'A',
      educationLevel
    }
  };
};

/**
 * Generates mock class data
 * @param {Object} params - Parameters for mock data generation
 * @returns {Object} Mock class data
 */
const generateMockClassData = ({ educationLevel = 'O_LEVEL', form = 1 } = {}) => {
  return {
    _id: 'mock-class-id',
    name: `Form ${form}`,
    stream: 'A',
    educationLevel,
    students: Array(20).fill().map((_, i) => ({
      _id: `mock-student-${i}`,
      firstName: `Student`,
      lastName: `${i + 1}`,
      rollNumber: `MOCK${i + 100}`,
      gender: i % 2 === 0 ? 'male' : 'female'
    }))
  };
};

/**
 * Generates mock exam data
 * @param {Object} params - Parameters for mock data generation
 * @returns {Object} Mock exam data
 */
const generateMockExamData = ({ educationLevel = 'O_LEVEL' } = {}) => {
  return {
    _id: 'mock-exam-id',
    name: 'Mock Exam',
    type: 'FINAL',
    term: 'Term 1',
    startDate: '2023-03-01',
    endDate: '2023-03-10',
    status: 'COMPLETED',
    academicYear: {
      _id: 'mock-academic-year-id',
      name: '2023',
      year: 2023
    }
  };
};

/**
 * Generates mock result data
 * @param {Object} params - Parameters for mock data generation
 * @returns {Object} Mock result data
 */
const generateMockResultData = ({ educationLevel = 'O_LEVEL', studentId = 'mock-student-id', examId = 'mock-exam-id' } = {}) => {
  // Generate different subjects based on education level
  const subjects = educationLevel === 'A_LEVEL'
    ? [
        { name: 'Mathematics', code: 'MATH', isPrincipal: true },
        { name: 'Physics', code: 'PHY', isPrincipal: true },
        { name: 'Chemistry', code: 'CHEM', isPrincipal: true },
        { name: 'General Studies', code: 'GS', isPrincipal: false }
      ]
    : [
        { name: 'Mathematics', code: 'MATH' },
        { name: 'English', code: 'ENG' },
        { name: 'Physics', code: 'PHY' },
        { name: 'Chemistry', code: 'CHEM' },
        { name: 'Biology', code: 'BIO' },
        { name: 'History', code: 'HIST' },
        { name: 'Geography', code: 'GEO' }
      ];

  // Generate results for each subject
  const subjectResults = subjects.map(subject => {
    const marks = Math.floor(Math.random() * 40) + 60; // Random marks between 60 and 99
    const grade = educationLevel === 'A_LEVEL'
      ? marks >= 80 ? 'A' : marks >= 70 ? 'B' : marks >= 60 ? 'C' : marks >= 50 ? 'D' : marks >= 40 ? 'E' : marks >= 35 ? 'S' : 'F'
      : marks >= 75 ? 'A' : marks >= 65 ? 'B' : marks >= 50 ? 'C' : marks >= 30 ? 'D' : 'F';
    const points = educationLevel === 'A_LEVEL'
      ? grade === 'A' ? 1 : grade === 'B' ? 2 : grade === 'C' ? 3 : grade === 'D' ? 4 : grade === 'E' ? 5 : grade === 'S' ? 6 : 7
      : grade === 'A' ? 1 : grade === 'B' ? 2 : grade === 'C' ? 3 : grade === 'D' ? 4 : 5;

    return {
      subject: subject.name,
      subjectCode: subject.code,
      marks,
      grade,
      points,
      isPrincipal: subject.isPrincipal || false
    };
  });

  // Calculate total and average marks
  const totalMarks = subjectResults.reduce((sum, result) => sum + result.marks, 0);
  const averageMarks = totalMarks / subjectResults.length;

  // Calculate total points
  const totalPoints = subjectResults.reduce((sum, result) => sum + result.points, 0);

  // Calculate best three principal subjects points (for A-Level)
  let bestThreePoints = 0;
  if (educationLevel === 'A_LEVEL') {
    const principalSubjects = subjectResults.filter(result => result.isPrincipal);
    const bestThree = principalSubjects
      .sort((a, b) => a.points - b.points)
      .slice(0, 3);
    bestThreePoints = bestThree.reduce((sum, result) => sum + result.points, 0);
  }

  // Calculate division
  const division = educationLevel === 'A_LEVEL'
    ? bestThreePoints <= 9 ? 'I' : bestThreePoints <= 12 ? 'II' : bestThreePoints <= 17 ? 'III' : bestThreePoints <= 19 ? 'IV' : '0'
    : totalPoints <= 16 ? 'I' : totalPoints <= 24 ? 'II' : totalPoints <= 32 ? 'III' : totalPoints <= 40 ? 'IV' : '0';

  return {
    studentId,
    examId,
    educationLevel,
    studentDetails: generateMockStudentData({ educationLevel }),
    examDetails: generateMockExamData({ educationLevel }),
    subjectResults,
    summary: {
      totalMarks,
      averageMarks,
      totalPoints,
      bestThreePoints: educationLevel === 'A_LEVEL' ? bestThreePoints : undefined,
      division,
      rank: 1,
      totalStudents: 20
    }
  };
};
