/**
 * Circuit breaker to prevent infinite re-renders
 */
export class CircuitBreaker {
  constructor(options = {}) {
    this.maxRenders = options.maxRenders || 10;
    this.resetTimeout = options.resetTimeout || 5000; // 5 seconds
    this.renderCount = 0;
    this.lastRenderTime = Date.now();
    this.broken = false;
  }
  
  /**
   * Increment render count and check if circuit is broken
   * @returns {boolean} - Whether the circuit is broken
   */
  check() {
    // Reset count if it's been a while since the last render
    const now = Date.now();
    if (now - this.lastRenderTime > this.resetTimeout) {
      this.renderCount = 0;
      this.broken = false;
    }
    
    this.lastRenderTime = now;
    this.renderCount++;
    
    // Check if we've exceeded the max renders
    if (this.renderCount > this.maxRenders) {
      this.broken = true;
      console.error(`Circuit breaker activated: ${this.renderCount} renders in ${this.resetTimeout}ms`);
    }
    
    return this.broken;
  }
  
  /**
   * Reset the circuit breaker
   */
  reset() {
    this.renderCount = 0;
    this.lastRenderTime = Date.now();
    this.broken = false;
  }
}

// Create a singleton instance
const circuitBreaker = new CircuitBreaker();

export default circuitBreaker;
