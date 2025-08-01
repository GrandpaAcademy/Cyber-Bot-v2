const logger = require('../utils/log');

class NetworkRetry {
  constructor(maxRetries = 3, baseDelay = 1000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
  }

  async retry(operation, context = '') {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Check if error is retryable
        if (this.isRetryableError(error)) {
          const delay = this.calculateDelay(attempt);
          logger.warn(`Attempt ${attempt}/${this.maxRetries} failed for ${context}. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Non-retryable error, throw immediately
        throw error;
      }
    }
    
    // If we get here, all retries failed
    logger.error(`All retry attempts failed for ${context}`);
    throw lastError;
  }

  isRetryableError(error) {
    // Network timeout errors
    if (error.code === 'ETIMEDOUT' || error.code === 'ENETUNREACH') {
      return true;
    }
    
    // Facebook specific errors that might be retryable
    if (error.error) {
      const errorCode = error.error;
      // Add Facebook-specific error codes that should be retried
      const retryableCodes = [
        'TIMEOUT',
        'NETWORK_ERROR',
        'TEMPORARY_ERROR'
      ];
      return retryableCodes.includes(errorCode);
    }
    
    return false;
  }

  calculateDelay(attempt) {
    // Exponential backoff with jitter
    const jitter = Math.random() * 100;
    return Math.min(this.baseDelay * Math.pow(2, attempt - 1) + jitter, 10000);
  }
}

module.exports = new NetworkRetry();
