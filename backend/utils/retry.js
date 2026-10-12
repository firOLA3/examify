const asyncRetry = async (fn, maxRetries = 10, delayMs = 25000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      // If it's the last retry, throw the error
      if (i === maxRetries - 1) throw err;
      
      // If the error is 503, 429, or 400 json_validate_failed (often caused by TPM truncation)
      const isRateLimitOrBusy = err.status === 503 || err.status === 429 || err.message?.includes('503') || err.message?.includes('429');
      const isJsonValidationFail = err.status === 400 && (err.message?.includes('json_validate_failed') || err.error?.error?.code === 'json_validate_failed');
      
      if (isRateLimitOrBusy || isJsonValidationFail) {
        console.warn(`[Retry] API busy or validation failed (${err.status}). Retrying in ${delayMs / 1000} seconds... (Attempt ${i + 1} of ${maxRetries})`);
        await new Promise(res => setTimeout(res, delayMs));
      } else {
        // If it's a different error (e.g., 400 Bad Request), don't retry, just throw
        throw err;
      }
    }
  }
};

module.exports = asyncRetry;
