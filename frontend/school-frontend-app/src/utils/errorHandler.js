export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    switch (error.response.status) {
      case 401:
        // Handle unauthorized
        return 'Please login to continue';
      case 403:
        // Handle forbidden
        return 'You do not have permission to perform this action';
      case 404:
        // Handle not found
        return 'The requested resource was not found';
      default:
        return error.response.data.message || 'An error occurred';
    }
  } else if (error.request) {
    // Network error
    return 'Unable to connect to the server';
  }
  return 'An unexpected error occurred';
};