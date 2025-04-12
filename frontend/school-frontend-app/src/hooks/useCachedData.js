import { useState, useEffect, useCallback } from 'react';
import { 
  fetchWithCache, 
  generateCacheKey, 
  generateMockData 
} from '../utils/cacheUtils';
import { handleApiError } from '../utils/errorHandling';

/**
 * Custom hook for fetching data with caching support
 * @param {Object} options - Hook options
 * @param {Function} options.fetchFn - Function to fetch data
 * @param {string} options.resourceType - Type of resource (e.g., 'student', 'class', 'exam')
 * @param {string} options.resourceId - Resource ID
 * @param {Object} options.params - Additional parameters for the fetch function
 * @param {boolean} options.enabled - Whether the fetch should be enabled
 * @param {boolean} options.forceRefresh - Whether to force a refresh
 * @param {number} options.cacheExpiration - Cache expiration time in milliseconds
 * @param {boolean} options.useMockOnError - Whether to use mock data on error
 * @returns {Object} Hook result
 */
const useCachedData = ({
  fetchFn,
  resourceType,
  resourceId,
  params = {},
  enabled = true,
  forceRefresh = false,
  cacheExpiration = 24 * 60 * 60 * 1000, // 24 hours
  useMockOnError = true
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [isMockData, setIsMockData] = useState(false);

  // Generate cache key
  const cacheKey = generateCacheKey(resourceType, resourceId, params);

  // Fetch data function
  const fetchData = useCallback(async (refresh = false) => {
    if (!enabled || !fetchFn) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchWithCache(
        fetchFn,
        cacheKey,
        {
          expiration: cacheExpiration,
          forceRefresh: refresh || forceRefresh,
          onSuccess: (data, fromCache) => {
            setIsFromCache(fromCache);
            setIsMockData(false);
          },
          onError: (err) => {
            console.error(`Error fetching ${resourceType}:`, err);
            
            // Try to use mock data if enabled
            if (useMockOnError) {
              const mockData = generateMockData(resourceType, { ...params, resourceId });
              if (mockData) {
                setData(mockData);
                setIsFromCache(false);
                setIsMockData(true);
                return;
              }
            }
            
            setError(handleApiError(err, fetchFn.name || 'fetchData', params));
          }
        }
      );

      setData(result);
    } catch (err) {
      // This will only be reached if both the fetch and the mock data generation fail
      setError(handleApiError(err, fetchFn.name || 'fetchData', params));
    } finally {
      setLoading(false);
    }
  }, [enabled, fetchFn, cacheKey, cacheExpiration, forceRefresh, resourceType, resourceId, params, useMockOnError]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]);

  // Return hook result
  return {
    data,
    loading,
    error,
    isFromCache,
    isMockData,
    refetch: (refresh = true) => fetchData(refresh)
  };
};

export default useCachedData;
