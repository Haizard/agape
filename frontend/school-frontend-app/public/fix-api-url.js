/**
 * This script fixes the API URL issue by intercepting all fetch and XMLHttpRequest calls
 * and redirecting them to the correct backend URL while preserving authentication.
 */
(function() {
    console.log('API URL Fixer: Initializing...');

    // Check if the fixer should be disabled (for local development)
    if (window.REACT_APP_DISABLE_API_URL_FIXER === 'true') {
        console.log('API URL Fixer: Disabled by environment variable');
        return;
    }

    // Check if we're in local development mode
    const isLocalDevelopment = window.location.hostname === 'localhost' ||
                              window.location.hostname === '127.0.0.1';

    // The correct backend URL - use localhost:5000 for local development
    const BACKEND_URL = isLocalDevelopment ? 'http://localhost:5000' : 'https://agape-render.onrender.com';

    console.log(`API URL Fixer: Using backend URL: ${BACKEND_URL}`);
    console.log(`API URL Fixer: Local development mode: ${isLocalDevelopment ? 'Yes' : 'No'}`);

    // Function to get the authentication token
    const getAuthToken = () => {
        try {
            const token = localStorage.getItem('token');

            // Log token status for debugging (without exposing the full token)
            if (token) {
                const tokenPreview = token.length > 20
                    ? `${token.substring(0, 10)}...${token.substring(token.length - 5)}`
                    : '[INVALID TOKEN FORMAT]';
                console.log(`API URL Fixer: Token found: ${tokenPreview}`);
            } else {
                console.warn('API URL Fixer: No authentication token found in localStorage');
            }

            return token;
        } catch (error) {
            console.error('API URL Fixer: Error retrieving auth token:', error);
            return null;
        }
    };

    // Function to check if the token is valid
    const isTokenValid = () => {
        try {
            const token = getAuthToken();
            if (!token) return false;

            // JWT tokens are in the format: header.payload.signature
            const parts = token.split('.');
            if (parts.length !== 3) {
                console.warn('API URL Fixer: Token is not in valid JWT format');
                return false;
            }

            // Decode the payload (middle part)
            const payload = JSON.parse(atob(parts[1]));

            // Check if the token has an expiration time
            if (!payload.exp) {
                console.warn('API URL Fixer: Token does not have an expiration time');
                return true; // Assume valid if no expiration
            }

            // Check if the token is expired
            const now = Math.floor(Date.now() / 1000);
            const isExpired = payload.exp < now;

            if (isExpired) {
                console.warn(`API URL Fixer: Token expired at ${new Date(payload.exp * 1000).toLocaleString()}`);
            } else {
                const expiresIn = payload.exp - now;
                console.log(`API URL Fixer: Token valid for ${Math.floor(expiresIn / 60)} minutes and ${expiresIn % 60} seconds`);
            }

            return !isExpired;
        } catch (error) {
            console.error('API URL Fixer: Error checking token validity:', error);
            return false;
        }
    };

    // Store the original fetch function
    const originalFetch = window.fetch;

    // Override the fetch function
    window.fetch = function(url, options = {}) {
        // Initialize options if not provided
        options = options || {};

        // Initialize headers if not provided
        options.headers = options.headers || {};

        // Add authentication token if available and valid
        const token = getAuthToken();
        const tokenValid = isTokenValid();

        if (token && tokenValid && !options.headers.Authorization && !options.headers.authorization) {
            options.headers.Authorization = `Bearer ${token}`;
            console.log(`API URL Fixer: Added valid auth token to fetch request`);
        } else if (token && !tokenValid) {
            console.warn(`API URL Fixer: Token is invalid or expired, not adding to fetch request`);
        }

        // Check if this is an API request
        if (typeof url === 'string' && url.includes('/api/')) {
            // Convert relative URL to absolute URL with the correct backend
            if (url.startsWith('/api/') || url.startsWith('api/')) {
                // Fix duplicate /api/ in URL
                let fixedUrl = url;
                // Handle multiple patterns of duplicate API paths
                if (url.includes('/api/api/')) {
                    fixedUrl = url.replace(/\/api\/api\//g, '/api/');
                    console.log(`API URL Fixer: Fixed duplicate API path in URL: ${url} -> ${fixedUrl}`);
                }

                // Make sure URLs have /api/ prefix
                if (!url.includes('/api/') && !url.startsWith('/api')) {
                    // Add /api/ prefix if it's missing
                    fixedUrl = url.startsWith('/') ? `/api${url}` : `/api/${url}`;
                    console.log(`API URL Fixer: Added missing /api prefix: ${url} -> ${fixedUrl}`);
                }

                const newUrl = `${BACKEND_URL}${fixedUrl.startsWith('/') ? fixedUrl : `/${fixedUrl}`}`;
                console.log(`API URL Fixer: Redirecting fetch from ${url} to ${newUrl}`);
                url = newUrl;
            }
        }

        // Call the original fetch with the modified URL and options
        return originalFetch.apply(this, [url, options]);
    };

    // Store the original XMLHttpRequest open method
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

    // Override the XMLHttpRequest open method
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        // Store the original URL for later use
        this._originalUrl = url;

        // Check if this is an API request
        if (typeof url === 'string' && url.includes('/api/')) {
            // Convert relative URL to absolute URL with the correct backend
            if (url.startsWith('/api/') || url.startsWith('api/')) {
                // Fix duplicate /api/ in URL
                let fixedUrl = url;
                // Handle multiple patterns of duplicate API paths
                if (url.includes('/api/api/')) {
                    fixedUrl = url.replace(/\/api\/api\//g, '/api/');
                    console.log(`API URL Fixer: Fixed duplicate API path in URL: ${url} -> ${fixedUrl}`);
                }

                // Make sure URLs have /api/ prefix
                if (!url.includes('/api/') && !url.startsWith('/api')) {
                    // Add /api/ prefix if it's missing
                    fixedUrl = url.startsWith('/') ? `/api${url}` : `/api/${url}`;
                    console.log(`API URL Fixer: Added missing /api prefix: ${url} -> ${fixedUrl}`);
                }

                const newUrl = `${BACKEND_URL}${fixedUrl.startsWith('/') ? fixedUrl : `/${fixedUrl}`}`;
                console.log(`API URL Fixer: Redirecting XHR from ${url} to ${newUrl}`);
                url = newUrl;

                // Flag this request as an API request
                this._isApiRequest = true;
            }
        }

        // Call the original open method with the modified URL
        return originalOpen.apply(this, [method, url, async, user, password]);
    };

    // Override the XMLHttpRequest setRequestHeader method to add authentication
    XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
        // If this is an API request and no Authorization header has been set yet
        if (this._isApiRequest && header.toLowerCase() !== 'authorization') {
            // Track that we're setting headers
            this._hasSetHeaders = true;
        }

        // Call the original setRequestHeader method
        return originalSetRequestHeader.apply(this, [header, value]);
    };

    // Override the XMLHttpRequest send method to add authentication if needed
    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(body) {
        // If this is an API request and no Authorization header has been set
        if (this._isApiRequest) {
            const token = getAuthToken();
            const tokenValid = isTokenValid();

            if (token && tokenValid) {
                // Add the Authorization header if not already set
                try {
                    this.setRequestHeader('Authorization', `Bearer ${token}`);
                    console.log(`API URL Fixer: Added valid auth token to request for ${this._originalUrl}`);
                } catch (error) {
                    console.warn(`API URL Fixer: Could not add auth token to request: ${error.message}`);
                }
            } else if (token && !tokenValid) {
                console.warn('API URL Fixer: Token is invalid or expired, not adding to XHR request');
            }
        }

        // Call the original send method
        return originalSend.apply(this, [body]);
    };

    console.log('API URL Fixer: Initialized successfully');
})();
