```javascript
/**
 * Firebase Configuration
 * 
 * This file contains the Firebase project configuration for general-4686c
 * and system-wide constants for retry logic and rate limiting.
 * 
 * @module firebase-config
 */

/**
 * Firebase project configuration for general-4686c
 * @constant {Object} FIREBASE_CONFIG
 */
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDXQvxBZH9VqZ8K3j5YNqX2wL9mP4tR6sE",
  authDomain: "general-4686c.firebaseapp.com",
  projectId: "general-4686c",
  storageBucket: "general-4686c.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef",
  measurementId: "G-ABCDEFGHIJ"
};

/**
 * Maximum number of retry attempts for failed operations
 * @constant {number} MAX_RETRIES
 */
export const MAX_RETRIES = 3;

/**
 * Base delay in milliseconds between retry attempts
 * Actual delay uses exponential backoff: RETRY_DELAY_MS * (2 ^ attempt)
 * @constant {number} RETRY_DELAY_MS
 */
export const RETRY_DELAY_MS = 1000;

/**
 * Time window in milliseconds for rate limiting
 * Default: 60000ms (1 minute)
 * @constant {number} RATE_LIMIT_WINDOW_MS
 */
export const RATE_LIMIT_WINDOW_MS = 60000;

/**
 * Maximum number of requests allowed per rate limit window
 * @constant {number} RATE_LIMIT_MAX_REQUESTS
 */
export const RATE_LIMIT_MAX_REQUESTS = 100;

/**
 * Firestore operation timeout in milliseconds
 * @constant {number} FIRESTORE_TIMEOUT_MS
 */
export const FIRESTORE_TIMEOUT_MS = 10000;

/**
 * Storage upload chunk size in bytes
 * @constant {number} STORAGE_CHUNK_SIZE
 */
export const STORAGE_CHUNK_SIZE = 256 * 1024;

/**
 * Maximum file size for storage uploads in bytes (10MB)
 * @constant {number} MAX_FILE_SIZE
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
```