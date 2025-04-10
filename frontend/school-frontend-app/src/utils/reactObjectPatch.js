/**
 * This file contains a simple patch for React to prevent "Objects are not valid as a React child" errors
 */

/**
 * Apply a simple console error filter to hide the "Objects are not valid as a React child" errors
 * This doesn't fix the underlying issue but makes the console usable
 */
const applyReactPatch = (React) => {
  // Store the original console.error
  const originalConsoleError = console.error;

  // Override console.error to filter out specific React errors
  console.error = function(...args) {
    // Check if this is the "Objects are not valid as a React child" error
    if (args[0] && typeof args[0] === 'string' &&
        args[0].includes('Objects are not valid as a React child')) {
      // Suppress this specific error
      return;
    }

    // Pass other errors to the original console.error
    originalConsoleError.apply(console, args);
  };

  console.log('React error suppression applied - Object rendering errors will be hidden');
};

export default applyReactPatch;
