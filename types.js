```javascript
/**
 * Firebase Integration Hub - Type Definitions
 * JSDoc type definitions for Firebase service wrappers
 * These types provide IDE autocomplete and documentation
 */

/**
 * Firebase User object returned by auth methods
 * @typedef {Object} FirebaseUser
 * @property {string} uid - Unique user identifier
 * @property {string|null} email - User's email address
 * @property {string|null} displayName - User's display name
 * @property {string|null} photoURL - User's photo URL
 * @property {boolean} emailVerified - Whether email is verified
 * @property {string|null} phoneNumber - User's phone number
 * @property {Object} metadata - User metadata
 * @property {string} metadata.creationTime - Account creation timestamp
 * @property {string} metadata.lastSignInTime - Last sign-in timestamp
 * @property {string[]} providerData - Array of provider-specific user info
 * @property {Function} getIdToken - Method to get ID token
 * @property {Function} reload - Method to reload user data
 * @property {Function} delete - Method to delete user account
 */

/**
 * Firestore document structure
 * @typedef {Object} FirestoreDoc
 * @property {string} id - Document ID
 * @property {Object} data - Document data fields
 * @property {Date} createdAt - Document creation timestamp
 * @property {Date} updatedAt - Document last update timestamp
 * @property {Object} metadata - Document metadata
 * @property {boolean} metadata.hasPendingWrites - Whether doc has pending writes
 * @property {boolean} metadata.fromCache - Whether doc is from cache
 */

/**
 * Firestore query constraint for filtering and ordering
 * @typedef {Object} QueryConstraint
 * @property {string} type - Constraint type: 'where', 'orderBy', 'limit', 'startAt', 'endAt', 'startAfter', 'endBefore'
 * @property {string} [field] - Field name for where/orderBy constraints
 * @property {string} [operator] - Comparison operator: '==', '!=', '<', '<=', '>', '>=', 'array-contains', 'in', 'not-in', 'array-contains-any'
 * @property {*} [value] - Value to compare against for where constraints
 * @property {string} [direction] - Sort direction: 'asc' or 'desc' for orderBy
 * @property {number} [count] - Number of documents for limit constraint
 * @property {*[]} [values] - Values for startAt/endAt/startAfter/endBefore constraints
 * 
 * @example
 * // Where constraint
 * { type: 'where', field: 'status', operator: '==', value: 'active' }
 * 
 * @example
 * // OrderBy constraint
 * { type: 'orderBy', field: 'createdAt', direction: 'desc' }
 * 
 * @example
 * // Limit constraint
 * { type: 'limit', count: 10 }
 */

/**
 * Analytics event data structure
 * @typedef {Object} AnalyticsEvent
 * @property {string} name - Event name (max 40 characters, alphanumeric and underscores only)
 * @property {Object} [params] - Event parameters (max 25 params per event)
 * @property {string} [params.category] - Event category
 * @property {string} [params.label] - Event label
 * @property {number} [params.value] - Event value (numeric)
 * @property {string} [params.user_id] - User identifier
 * @property {string} [params.session_id] - Session identifier
 * @property {number} [params.timestamp] - Event timestamp in milliseconds
 * 
 * @example
 * {
 *   name: 'button_click',
 *   params: {
 *     category: 'engagement',
 *     label: 'signup_button',
 *     value: 1
 *   }
 * }
 */

/**
 * Storage file metadata
 * @typedef {Object} StorageMetadata
 * @property {string} name - File name
 * @property {string} bucket - Storage bucket name
 * @property {string} fullPath - Full path in storage
 * @property {number} size - File size in bytes
 * @property {string} contentType - MIME type
 * @property {string} md5Hash - MD5 hash of file
 * @property {string} updated - Last update timestamp
 * @property {string} timeCreated - Creation timestamp
 * @property {Object} [customMetadata] - Custom metadata key-value pairs
 */

/**
 * Storage upload result
 * @typedef {Object} UploadResult
 * @property {string} path - File path in storage
 * @property {string} downloadURL - Public download URL
 * @property {StorageMetadata} metadata - File metadata
 * @property {number} bytesTransferred - Total bytes uploaded
 * @property {number} totalBytes - Total file size
 */

/**
 * Firebase error object
 * @typedef {Object} FirebaseError
 * @property {string} code - Error code (e.g., 'auth/user-not-found')
 * @property {string} message - Human-readable error message
 * @property {string} name - Error name (usually 'FirebaseError')
 * @property {Object} [customData] - Additional error data
 * @property {Error} [serverResponse] - Server response if available
 */

/**
 * Auth state change callback
 * @callback AuthStateCallback
 * @param {FirebaseUser|null} user - Current user or null if signed out
 * @returns {void}
 */

/**
 * Firestore snapshot callback
 * @callback SnapshotCallback
 * @param {FirestoreDoc} doc - Document snapshot
 * @returns {void}
 */

/**
 * Rate limiter result
 * @typedef {Object} RateLimitResult
 * @property {boolean} allowed - Whether request is allowed
 * @property {number} remaining - Remaining requests in window
 * @property {number} resetTime - Timestamp when limit resets
 * @property {number} retryAfter - Seconds to wait before retry (if not allowed)
 */

/**
 * Service configuration options
 * @typedef {Object} ServiceConfig
 * @property {boolean} [enableAnalytics=true] - Enable Firebase Analytics
 * @property {boolean} [enableOfflineSupport=true] - Enable Firestore offline persistence
 * @property {number} [maxRetries=3] - Maximum retry attempts for failed operations
 * @property {number} [retryDelayMs=1000] - Initial retry delay in milliseconds
 * @property {number} [rateLimitWindow=60000] - Rate limit window in milliseconds
 * @property {number} [rateLimitMax=100] - Maximum requests per window
 */

/**
 * Batch write operation
 * @typedef {Object} BatchOperation
 * @property {string} type - Operation type: 'set', 'update', 'delete'
 * @property {string} collection - Collection name
 * @property {string} docId - Document ID
 * @property {Object} [data] - Data to write (for set/update)
 * @property {boolean} [merge] - Whether to merge with existing data (for set)
 */

/**
 * Query result page
 * @typedef {Object} QueryPage
 * @property {FirestoreDoc[]} docs - Documents in current page
 * @property {boolean} hasMore - Whether more pages exist
 * @property {*} lastDoc - Last document reference for pagination
 * @property {number} total - Total matching documents (if available)
 */

/**
 * Firebase initialization status
 * @typedef {Object} InitStatus
 * @property {boolean} initialized - Whether Firebase is initialized
 * @property {boolean} authReady - Whether Auth is ready
 * @property {boolean} firestoreReady - Whether Firestore is ready
 * @property {boolean} storageReady - Whether Storage is ready
 * @property {boolean} analyticsReady - Whether Analytics is ready
 * @property {Date} timestamp - Initialization timestamp
 */

export {
  FirebaseUser,
  FirestoreDoc,
  QueryConstraint,
  AnalyticsEvent,
  StorageMetadata,
  UploadResult,
  FirebaseError,
  AuthStateCallback,
  SnapshotCallback,
  RateLimitResult,
  ServiceConfig,
  BatchOperation,
  QueryPage,
  InitStatus
};
```