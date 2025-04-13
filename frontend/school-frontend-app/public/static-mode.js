// Static data for offline/static mode
window.STATIC_API_DATA = {
  // User data
  "currentUser": {
    "id": "123",
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "name": "Admin User"
  },
  
  // Authentication token
  "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjE2MTYyMjIwLCJleHAiOjE2MTYyNDg2MjB9.7M8V3XFjTRRrKDYLT5a9xIb0jLDTGMBIGGSLIL9pMTo",
  
  // Common API responses
  "apiResponses": {
    "/api/users/login": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjE2MTYyMjIwLCJleHAiOjE2MTYyNDg2MjB9.7M8V3XFjTRRrKDYLT5a9xIb0jLDTGMBIGGSLIL9pMTo",
      "user": {
        "id": "123",
        "username": "admin",
        "email": "admin@example.com",
        "role": "admin",
        "name": "Admin User"
      }
    },
    "/api/users/profile": {
      "id": "123",
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin",
      "name": "Admin User"
    },
    "/api/dashboard/stats": {
      "totalStudents": 250,
      "totalTeachers": 25,
      "totalClasses": 15,
      "recentActivity": [
        { "type": "login", "user": "admin", "timestamp": "2023-04-12T10:30:00Z" },
        { "type": "grade_entry", "user": "teacher1", "timestamp": "2023-04-12T09:15:00Z" },
        { "type": "attendance", "user": "teacher2", "timestamp": "2023-04-12T08:00:00Z" }
      ]
    }
  }
};

// Static API interceptor
(function() {
  // Store the original fetch function
  const originalFetch = window.fetch;
  
  // Override fetch to intercept API calls
  window.fetch = function(url, options) {
    // Check if this is an API call
    if (typeof url === 'string' && url.includes('/api/')) {
      console.log(`[Static Mode] Intercepted API call to: ${url}`);
      
      // Extract the API path
      const apiPath = url.split('?')[0]; // Remove query parameters
      
      // Check if we have a static response for this API path
      for (const mockPath in window.STATIC_API_DATA.apiResponses) {
        if (apiPath.includes(mockPath)) {
          console.log(`[Static Mode] Returning mock data for: ${apiPath}`);
          
          // Create a mock response
          const mockResponse = window.STATIC_API_DATA.apiResponses[mockPath];
          
          // Return a resolved promise with the mock response
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockResponse),
            text: () => Promise.resolve(JSON.stringify(mockResponse)),
            headers: new Headers({ 'Content-Type': 'application/json' })
          });
        }
      }
      
      // If no specific mock is found, return an empty successful response
      console.log(`[Static Mode] No specific mock found for: ${apiPath}, returning empty success response`);
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: [] }),
        text: () => Promise.resolve(JSON.stringify({ success: true, data: [] })),
        headers: new Headers({ 'Content-Type': 'application/json' })
      });
    }
    
    // For non-API calls, use the original fetch
    return originalFetch.apply(this, arguments);
  };
  
  // Also intercept axios if it's used
  if (window.axios) {
    const originalAxios = window.axios;
    const originalAxiosGet = window.axios.get;
    const originalAxiosPost = window.axios.post;
    const originalAxiosPut = window.axios.put;
    const originalAxiosDelete = window.axios.delete;
    
    // Helper function to handle axios requests
    function handleAxiosRequest(url, config) {
      if (typeof url === 'string' && url.includes('/api/')) {
        console.log(`[Static Mode] Intercepted axios call to: ${url}`);
        
        // Extract the API path
        const apiPath = url.split('?')[0]; // Remove query parameters
        
        // Check if we have a static response for this API path
        for (const mockPath in window.STATIC_API_DATA.apiResponses) {
          if (apiPath.includes(mockPath)) {
            console.log(`[Static Mode] Returning mock data for: ${apiPath}`);
            
            // Create a mock response
            const mockResponse = window.STATIC_API_DATA.apiResponses[mockPath];
            
            // Return a resolved promise with the mock response
            return Promise.resolve({
              data: mockResponse,
              status: 200,
              statusText: 'OK',
              headers: {},
              config: config || {}
            });
          }
        }
        
        // If no specific mock is found, return an empty successful response
        console.log(`[Static Mode] No specific mock found for: ${apiPath}, returning empty success response`);
        return Promise.resolve({
          data: { success: true, data: [] },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        });
      }
      
      // For non-API calls, use the original axios methods
      if (originalAxiosGet && url.startsWith('get:')) {
        return originalAxiosGet.call(this, url.substring(4), config);
      } else if (originalAxiosPost && url.startsWith('post:')) {
        return originalAxiosPost.call(this, url.substring(5), config);
      } else if (originalAxiosPut && url.startsWith('put:')) {
        return originalAxiosPut.call(this, url.substring(4), config);
      } else if (originalAxiosDelete && url.startsWith('delete:')) {
        return originalAxiosDelete.call(this, url.substring(7), config);
      }
      
      // Default case
      return originalAxios.apply(this, arguments);
    }
    
    // Override axios methods
    window.axios = function() {
      return handleAxiosRequest.apply(this, arguments);
    };
    
    window.axios.get = function(url, config) {
      return handleAxiosRequest('get:' + url, config);
    };
    
    window.axios.post = function(url, data, config) {
      config = config || {};
      config.data = data;
      return handleAxiosRequest('post:' + url, config);
    };
    
    window.axios.put = function(url, data, config) {
      config = config || {};
      config.data = data;
      return handleAxiosRequest('put:' + url, config);
    };
    
    window.axios.delete = function(url, config) {
      return handleAxiosRequest('delete:' + url, config);
    };
  }
  
  // Auto-login in static mode
  window.addEventListener('DOMContentLoaded', function() {
    console.log('[Static Mode] Auto-login initialized');
    
    // Store the token and user data in localStorage
    localStorage.setItem('token', window.STATIC_API_DATA.authToken);
    localStorage.setItem('user', JSON.stringify(window.STATIC_API_DATA.currentUser));
    
    console.log('[Static Mode] User automatically logged in');
  });
})();
