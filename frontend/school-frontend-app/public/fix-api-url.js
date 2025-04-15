/**
 * This script fixes the API URL issue by intercepting all fetch and XMLHttpRequest calls
 * and redirecting them to the correct backend URL.
 */
(function() {
    console.log('API URL Fixer: Initializing...');
    
    // The correct backend URL
    const BACKEND_URL = 'https://agape-render.onrender.com';
    
    // Store the original fetch function
    const originalFetch = window.fetch;
    
    // Override the fetch function
    window.fetch = function(url, options) {
        // Check if this is an API request
        if (typeof url === 'string' && url.includes('/api/')) {
            // Convert relative URL to absolute URL with the correct backend
            if (url.startsWith('/api/') || url.startsWith('api/')) {
                const newUrl = BACKEND_URL + (url.startsWith('/') ? url : '/' + url);
                console.log(`API URL Fixer: Redirecting fetch from ${url} to ${newUrl}`);
                url = newUrl;
            }
        }
        
        // Call the original fetch with the modified URL
        return originalFetch.apply(this, [url, options]);
    };
    
    // Store the original XMLHttpRequest open method
    const originalOpen = XMLHttpRequest.prototype.open;
    
    // Override the XMLHttpRequest open method
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        // Check if this is an API request
        if (typeof url === 'string' && url.includes('/api/')) {
            // Convert relative URL to absolute URL with the correct backend
            if (url.startsWith('/api/') || url.startsWith('api/')) {
                const newUrl = BACKEND_URL + (url.startsWith('/') ? url : '/' + url);
                console.log(`API URL Fixer: Redirecting XHR from ${url} to ${newUrl}`);
                url = newUrl;
            }
        }
        
        // Call the original open method with the modified URL
        return originalOpen.apply(this, [method, url, async, user, password]);
    };
    
    console.log('API URL Fixer: Initialized successfully');
})();
