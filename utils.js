```javascript
/**
 * utils.js
 * Helper utilities for Firebase service resilience and error handling
 */

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} baseDelay - Base delay in milliseconds (default 1000)
 * @returns {Promise<any>} Result of the function
 * @throws {Error} If all retries fail
 * 
 * @example
 * const result = await retryWithBackoff(
 *   async () => await firestore.getDoc(docRef),
 *   3,
 *   1000
 * );
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors
      if (
        error.code === 'permission-denied' ||
        error.code === 'unauthenticated' ||
        error.code === 'invalid-argument' ||
        error.code === 'not-found'
      ) {
        throw error;
      }
      
      // If this was the last attempt, throw
      if (attempt === maxRetries) {
        throw new Error(`Max retries (${maxRetries}) exceeded: ${error.message}`);
      }
      
      // Calculate exponential backoff delay with jitter
      const delay = baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 0.3 * delay;
      const totalDelay = delay + jitter;
      
      console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(totalDelay)}ms. Error: ${error.message}`);
      
      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }
  
  throw lastError;
}

/**
 * In-memory rate limiter using sliding window algorithm
 * Tracks request counts per key within a time window
 */
const rateLimitStore = new Map();

/**
 * Rate limiter to prevent excessive API calls
 * @param {string} key - Unique identifier for the rate limit (e.g., userId, IP, function name)
 * @param {number} limit - Maximum number of requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} True if request is allowed, false if rate limit exceeded
 * 
 * @example
 * if (!rateLimiter('user-123-firestore-write', 100, 60000)) {
 *   throw new Error('Rate limit exceeded. Please try again later.');
 * }
 */
export function rateLimiter(key, limit, windowMs) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Get or create entry for this key
  let entry = rateLimitStore.get(key);
  
  if (!entry) {
    entry = { timestamps: [] };
    rateLimitStore.set(key, entry);
  }
  
  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter(timestamp => timestamp > windowStart);
  
  // Check if limit exceeded
  if (entry.timestamps.length >= limit) {
    return false;
  }
  
  // Add current timestamp
  entry.timestamps.push(now);
  
  // Cleanup old entries periodically (every 1000 checks)
  if (Math.random() < 0.001) {
    cleanupRateLimitStore(windowMs);
  }
  
  return true;
}

/**
 * Cleanup old rate limit entries to prevent memory leaks
 * @param {number} windowMs - Time window in milliseconds
 */
function cleanupRateLimitStore(windowMs) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  for (const [key, entry] of rateLimitStore.entries()) {
    entry.timestamps = entry.timestamps.filter(timestamp => timestamp > windowStart);
    
    // Remove entry if no recent timestamps
    if (entry.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Centralized error handler for Firebase operations
 * Converts Firebase errors into standardized error objects with helpful messages
 * @param {Error} error - The error to handle
 * @returns {Error} Standardized error object
 * 
 * @example
 * try {
 *   await signInWithEmailAndPassword(auth, email, password);
 * } catch (error) {
 *   throw errorHandler(error);
 * }
 */
export function errorHandler(error) {
  // If already a standardized error, return as-is
  if (error.isHandled) {
    return error;
  }
  
  const errorCode = error.code || 'unknown';
  const errorMessage = error.message || 'An unknown error occurred';
  
  // Firebase Auth errors
  const authErrors = {
    'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
    'auth/invalid-email': 'Invalid email address format.',
    'auth/operation-not-allowed': 'This operation is not allowed. Please contact support.',
    'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Invalid credentials. Please check your email and password.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
  };
  
  // Firestore errors
  const firestoreErrors = {
    'permission-denied': 'You do not have permission to perform this operation.',
    'not-found': 'The requested document was not found.',
    'already-exists': 'A document with this ID already exists.',
    'resource-exhausted': 'Quota exceeded. Please try again later.',
    'failed-precondition': 'Operation failed due to precondition not met.',
    'aborted': 'Operation was aborted. Please retry.',
    'out-of-range': 'Operation out of valid range.',
    'unimplemented': 'This operation is not implemented.',
    'internal': 'Internal server error. Please try again.',
    'unavailable': 'Service temporarily unavailable. Please retry.',
    'data-loss': 'Unrecoverable data loss or corruption.',
    'unauthenticated': 'User is not authenticated. Please sign in.',
  };
  
  // Storage errors
  const storageErrors = {
    'storage/object-not-found': 'File not found.',
    'storage/bucket-not-found': 'Storage bucket not found.',
    'storage/project-not-found': 'Project not found.',
    'storage/quota-exceeded': 'Storage quota exceeded.',
    'storage/unauthenticated': 'User is not authenticated.',
    'storage/unauthorized': 'User does not have permission to access this file.',
    'storage/retry-limit-exceeded': 'Maximum retry time exceeded. Please try again.',
    'storage/invalid-checksum': 'File checksum does not match. Upload may be corrupted.',
    'storage/canceled': 'Upload was canceled.',
    'storage/invalid-event-name': 'Invalid event name provided.',
    'storage/invalid-url': 'Invalid URL format.',
    'storage/invalid-argument': 'Invalid argument provided.',
    'storage/no-default-bucket': 'No default storage bucket configured.',
    'storage/cannot-slice-blob': 'Cannot slice blob. File may be corrupted.',
    'storage/server-file-wrong-size': 'Server file size mismatch.',
  };
  
  // Look up friendly error message
  let friendlyMessage = 
    authErrors[errorCode] ||
    firestoreErrors[errorCode] ||
    storageErrors[errorCode] ||
    errorMessage;
  
  // Create standardized error
  const handledError = new Error(friendlyMessage);
  handledError.code = errorCode;
  handledError.originalError = error;
  handledError.isHandled = true;
  handledError.timestamp = new Date().toISOString();
  
  // Log error for debugging (in production, this would go to a logging service)
  console.error('[Firebase Error]', {
    code: errorCode,
    message: friendlyMessage,
    originalMessage: errorMessage,
    timestamp: handledError.timestamp,
    stack: error.stack,
  });
  
  return handledError;
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Firestore document ID
 * @param {string} docId - Document ID to validate
 * @returns {boolean} True if valid document ID
 */
export function isValidDocId(docId) {
  if (!docId || typeof docId !== 'string') {
    return false;
  }
  // Firestore doc IDs must be non-empty and not contain '/'
  return docId.length > 0 && docId.length <= 1500 && !docId.includes('/');
}

/**
 * Validate collection path
 * @param {string} collection - Collection path to validate
 * @returns {boolean} True if valid collection path
 */
export function isValidCollectionPath(collection) {
  if (!collection || typeof collection !== 'string') {
    return false;
  }
  // Collection paths must have odd number of segments
  const segments = collection.split('/').filter(s => s.length > 0);
  return segments.length > 0 && segments.length % 2 === 1;
}

/**
 * Sanitize user input to prevent injection attacks
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .slice(0, 10000); // Limit length
}

/**
 * Create a safe delay (works in both browser and worker environments)
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a unique request ID for tracing
 * @returns {string} Unique request ID
 */
export function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Check if running in Cloudflare Worker environment
 * @returns {boolean} True if in worker environment
 */
export function isWorkerEnvironment() {
  return typeof caches !== 'undefined' && typeof Request !== 'undefined';
}

/**
 * Safe JSON parse with error handling
 * @param {string} jsonString - JSON string to parse
 * @param {any} defaultValue - Default value if parse fails
 * @returns {any} Parsed object or default value
 */
export function safeJSONParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('JSON parse failed:', error.message);
    return defaultValue;
  }
}

/**
 * Safe JSON stringify with error handling
 * @param {any} obj - Object to stringify
 * @param {string} defaultValue - Default value if stringify fails
 * @returns {string} JSON string or default value
 */
export function safeJSONStringify(obj, defaultValue = '{}') {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.warn('JSON stringify failed:', error.message);
    return defaultValue;
  }
}
```