```javascript
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query as firestoreQuery,
  where,
  orderBy,
  limit as firestoreLimit,
  onSnapshot as firestoreOnSnapshot
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { 
  getAnalytics, 
  logEvent as firebaseLogEvent, 
  setUserProperties as firebaseSetUserProperties 
} from 'firebase/analytics';

import { FIREBASE_CONFIG, MAX_RETRIES, RETRY_DELAY_MS, RATE_LIMIT_WINDOW_MS } from './firebase-config.js';
import { retryWithBackoff, rateLimiter, errorHandler } from './utils.js';

/**
 * Singleton FirebaseService class providing centralized Firebase functionality.
 * 
 * @example
 * // Basic usage in any project:
 * import { FirebaseService } from './firebase-service.js';
 * const firebase = FirebaseService.getInstance();
 * 
 * // Auth example:
 * const user = await firebase.auth.signUp('user@example.com', 'password123');
 * 
 * // Firestore example:
 * await firebase.firestore.create('users', { name: 'John', age: 30 });
 * 
 * // Storage example:
 * const url = await firebase.storage.uploadFile('avatars/user1.jpg', fileBlob);
 * 
 * // Analytics example:
 * firebase.analytics.logEvent('page_view', { page: 'home' });
 */
class FirebaseService {
  static instance = null;
  
  constructor() {
    if (FirebaseService.instance) {
      return FirebaseService.instance;
    }
    
    this.app = initializeApp(FIREBASE_CONFIG);
    this.authInstance = getAuth(this.app);
    this.firestoreInstance = getFirestore(this.app);
    this.storageInstance = getStorage(this.app);
    
    try {
      this.analyticsInstance = getAnalytics(this.app);
    } catch (error) {
      console.warn('Analytics not available in this environment:', error.message);
      this.analyticsInstance = null;
    }
    
    this.rateLimitCache = new Map();
    
    FirebaseService.instance = this;
  }
  
  /**
   * Get singleton instance of FirebaseService.
   * @returns {FirebaseService} The Firebase service instance
   */
  static getInstance() {
    if (!FirebaseService.instance) {
      new FirebaseService();
    }
    return FirebaseService.instance;
  }
  
  /**
   * Authentication methods
   */
  auth = {
    /**
     * Sign up a new user with email and password.
     * @param {string} email - User email address
     * @param {string} password - User password (min 6 characters)
     * @returns {Promise<{uid: string, email: string, token: string}>} User data with auth token
     * @throws {Error} If signup fails or rate limit exceeded
     * 
     * @example
     * const user = await firebase.auth.signUp('user@example.com', 'securePass123');
     * console.log('New user:', user.uid);
     */
    signUp: async (email, password) => {
      const limitKey = `signup:${email}`;
      if (!rateLimiter(limitKey, 5, RATE_LIMIT_WINDOW_MS, this.rateLimitCache)) {
        throw new Error('Rate limit exceeded for signup. Please try again later.');
      }
      
      return retryWithBackoff(async () => {
        try {
          const userCredential = await createUserWithEmailAndPassword(
            this.authInstance, 
            email, 
            password
          );
          const token = await userCredential.user.getIdToken();
          
          return {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            token
          };
        } catch (error) {
          throw errorHandler(error);
        }
      }, MAX_RETRIES, RETRY_DELAY_MS);
    },
    
    /**
     * Sign in an existing user with email and password.
     * @param {string} email - User email address
     * @param {string} password - User password
     * @returns {Promise<{uid: string, email: string, token: string}>} User data with auth token
     * @throws {Error} If signin fails or rate limit exceeded
     * 
     * @example
     * const user = await firebase.auth.signIn('user@example.com', 'securePass123');
     * console.log('Logged in:', user.uid);
     */
    signIn: async (email, password) => {
      const limitKey = `signin:${email}`;
      if (!rateLimiter(limitKey, 10, RATE_LIMIT_WINDOW_MS, this.rateLimitCache)) {
        throw new Error('Rate limit exceeded for signin. Please try again later.');
      }
      
      return retryWithBackoff(async () => {
        try {
          const userCredential = await signInWithEmailAndPassword(
            this.authInstance, 
            email, 
            password
          );
          const token = await userCredential.user.getIdToken();
          
          return {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            token
          };
        } catch (error) {
          throw errorHandler(error);
        }
      }, MAX_RETRIES, RETRY_DELAY_MS);
    },
    
    /**
     * Sign out the current user.
     * @returns {Promise<void>}
     * @throws {Error} If signout fails
     * 
     * @example
     * await firebase.auth.signOut();
     * console.log('User signed out');
     */
    signOut: async () => {
      return retryWithBackoff(async () => {
        try {
          await firebaseSignOut(this.authInstance);
        } catch (error) {
          throw errorHandler(error);
        }
      }, MAX_RETRIES, RETRY_DELAY_MS);
    },
    
    /**
     * Get the currently authenticated user.
     * @returns {Promise<{uid: string, email: string, token: string} | null>} Current user or null
     * 
     * @example
     * const user = await firebase.auth.getCurrentUser();
     * if (user) console.log('Current user:', user.email);
     */
    getCurrentUser: async () => {
      const user = this.authInstance.currentUser;
      if (!user) return null;
      
      try {
        const token = await user.getIdToken();
        return {
          uid: user.uid,
          email: user.email,
          token
        };
      } catch (error) {
        throw errorHandler(error);
      }
    },
    
    /**
     * Listen for authentication state changes.
     * @param {Function} callback - Callback function receiving user object or null
     * @returns {Function} Unsubscribe function
     * 
     * @example
     * const unsubscribe = firebase.auth.onAuthChange((user) => {
     *   if (user) console.log('User logged in:', user.email);
     *   else console.log('User logged out');
     * });
     * // Later: unsubscribe();
     */
    onAuthChange: (callback) => {
      return onAuthStateChanged(this.authInstance, async (user) => {
        if (user) {
          try {
            const token = await user.getIdToken();
            callback({
              uid: user.uid,
              email: user.email,
              token
            });
          } catch (error) {
            callback(null);
          }
        } else {
          callback(null);
        }
      });
    }
  };
  
  /**
   * Firestore database methods
   */
  firestore = {
    /**
     * Create a new document in a collection.
     * @param {string} collectionName - Collection name
     * @param {Object} data - Document data
     * @param {string} [docId] - Optional document ID (auto-generated if not provided)
     * @returns {Promise<{id: string, data: Object}>} Created document
     * @throws {Error} If creation fails or rate limit exceeded
     * 
     * @example
     * const doc = await firebase.firestore.create('users', {
     *   name: 'John Doe',
     *   age: 30,
     *   email: 'john@example.com'
     * });
     * console.log('Created document:', doc.id);
     */
    create: async (collectionName, data, docId = null) => {
      const limitKey = `firestore:create:${collectionName}`;
      if (!rateLimiter(limitKey, 100, RATE_LIMIT_WINDOW_MS, this.rateLimitCache)) {
        throw new Error('Rate limit exceeded for Firestore create. Please try again later.');
      }
      
      return retryWithBackoff(async () => {
        try {
          const timestamp = new Date().toISOString();
          const docData = {
            ...data,
            createdAt: timestamp,
            updatedAt: timestamp
          };
          
          if (docId) {
            const docRef = doc(this.firestoreInstance, collectionName, docId);
            await setDoc(docRef, docData);
            return { id: docId, data: docData };
          } else {
            const colRef = collection(this.firestoreInstance, collectionName);
            const docRef = await addDoc(colRef, docData);
            return { id: docRef.id, data: docData };
          }
        } catch (error) {
          throw errorHandler(error);
        }
      }, MAX_RETRIES, RETRY_DELAY_MS);
    },
    
    /**
     * Read a document from a collection.
     * @param {string} collectionName - Collection name
     * @param {string} docId - Document ID
     * @returns {Promise<{id: string, data: Object} | null>} Document or null if not found
     * @throws {Error} If read fails
     * 
     * @example
     * const doc = await firebase.firestore.read('users', 'user123');
     * if (doc) console.log('User data:', doc.data);
     */
    read: async (collectionName, docId) => {
      return retryWithBackoff(async () => {
        try {
          const docRef = doc(this.firestoreInstance, collectionName, docId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            return {
              id: docSnap.id,
              data: docSnap.data()
            };
          }
          return null;
        } catch (error) {
          throw errorHandler(error);
        }
      }, MAX_RETRIES, RETRY_DELAY_MS);
    },
    
    /**
     * Update a document in a collection.
     * @param {string} collectionName - Collection name
     * @param {string} docId - Document ID
     * @param {Object} data - Fields to update
     * @returns {Promise<{id: string, data: Object}>} Updated document
     * @throws {Error} If update fails or rate limit exceeded
     * 
     * @example
     * const doc = await firebase.firestore.update('users', 'user123', {
     *   age: 31,
     *   lastLogin: new Date().toISOString()
     * });
     */
    update: async (collectionName, docId, data) => {
      const limitKey = `firestore:update:${collectionName}`;
      if (!rateLimiter(limitKey, 100, RATE_LIMIT_WINDOW_MS, this.rateLimitCache)) {
        throw new Error('Rate limit exceeded for Firestore update. Please try again later.');
      }
      
      return retryWithBackoff(async () => {
        try {
          const docRef = doc(this.firestoreInstance, collectionName, docId);
          const updateData = {
            ...data,
            updatedAt: new Date().toISOString()
          };
          
          await updateDoc(docRef, updateData);
          
          const updatedDoc = await getDoc(docRef);
          return {
            id: updatedDoc.id,
            data: updatedDoc.data()
          };
        } catch (error) {
          throw errorHandler(error);
        }
      }, MAX_RETRIES, RETRY_DELAY_MS);
    },
    
    /**
     * Delete a document from a collection.
     * @param {string} collectionName - Collection name
     * @param {string} docId - Document ID
     * @returns {Promise<void>}
     * @throws {Error} If deletion fails or rate limit exceeded
     * 
     * @example
     * await firebase.firestore.delete('users', 'user123');
     * console.log('User deleted');
     */
    delete: async (collectionName, docId) => {
      const limitKey = `firestore:delete:${collectionName}`;
      if (!rateLimiter(limitKey, 50, RATE_LIMIT_WINDOW_MS, this.rateLimitCache)) {
        throw new Error('Rate limit exceeded for Firestore delete. Please try again later.');
      }
      
      return retryWithBackoff(async () => {
        try {
          const docRef = doc(this.firestoreInstance, collectionName, docId);
          await deleteDoc(docRef);
        } catch (error) {
          throw errorHandler(error);
        }
      }, MAX_RETRIES, RETRY_DELAY_MS);
    },
    
    /**
     * Query documents in a collection with filters.
     * @param {string} collectionName - Collection name
     * @param {Array<{field: string, operator: string, value: any}>} constraints - Query constraints
     * @param {Object} [options] - Query options (orderBy, limit)
     * @returns {Promise<Array<{id: string, data: Object}>>} Array of documents
     * @throws {Error} If query fails
     * 
     * @example
     * const users = await firebase.firestore.query('users', 
     *   [{ field: 'age', operator: '>=', value: 18 }],
     *   { orderBy: 'name', limit: 10 }
     * );
     * console.log('Found users:', users.length);
     */
    query: async (collectionName, constraints = [], options = {}) => {
      return retryWithBackoff(async () => {
        try {
          const colRef = collection(this.firestoreInstance, collectionName);
          const queryConstraints = [];
          
          for (const constraint of constraints) {
            queryConstraints.push(where(constraint.field, constraint.operator, constraint.value));
          }
          
          if (options.orderBy) {
            queryConstraints.push(orderBy(options.orderBy, options.orderDirection || 'asc'));
          }
          
          if (options.limit) {
            queryConstraints.push(firestoreLimit(options.limit));
          }
          
          const q = firestoreQuery(colRef, ...queryConstraints);
          const querySnapshot = await getDocs(q);
          
          return querySnapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data()
          }));
        } catch (error) {
          throw errorHandler(error);
        }
      }, MAX_RETRIES, RETRY_DELAY_MS);
    },
    
    /**
     * Listen for real-time updates to a document.
     * @param {string} collectionName - Collection name
     * @param {string} docId - Document ID
     * @param {Function} callback - Callback receiving document updates
     * @returns {Function} Unsubscribe function
     * 
     * @example
     * const unsubscribe = firebase.firestore.onSnapshot('users', 'user123', (doc) => {
     *   console.log('User updated:', doc.data);
     * });
     * // Later: unsubscribe();
     */
    onSnapshot: (collectionName, docId, callback) => {
      const docRef = doc(this.firestoreInstance, collectionName, docId);
      
      return firestoreOnSnapshot(docRef, 
        (docSnap) => {
          if (docSnap.exists()) {
            callback({
              id: docSnap.id,
              data: docSnap.data()
            });
          } else {
            callback(null);
          }
        },
        (error) => {
          console.error('Snapshot error:', error);
          callback(null);
        }
      );
    }
  };
  
  /**
   * Cloud Storage methods
   */
  storage = {
    /**
     * Upload a file to Cloud Storage.
     * @param {string} path - Storage path (e.g., 'avatars/user123.jpg')
     * @param {Blob|ArrayBuffer|Uint8Array} file - File data
     * @param {Object} [metadata] - Optional file metadata
     * @returns {Promise<{path: string, url: string, size: number}>} Upload result with download URL
     * @throws {Error} If upload fails or rate limit exceeded
     * 
     * @example
     * const result = await firebase.storage.uploadFile(
     *   'avatars/user123.jpg',
     *   fileBlob,
     *   { contentType: 'image/jpeg' }
     * );
     * console.log('File URL:', result.url);
     */
    uploadFile: async (path, file, metadata = {}) => {
      const limitKey = `storage:upload:${path.split('/')[0]}`;
      if (!rateLimiter(limitKey, 50, RATE_LIMIT_WINDOW_MS, this.rateLimitCache)) {
        throw new Error('Rate limit exceeded for storage upload. Please try again later.');
      }
      
      return retryWithBackoff(async () => {
        try {
          const storageRef = ref(this.storageInstance, path);
          const snapshot = await uploadBytes(storageRef, file, metadata);
          const url = await getDownloadURL(snapshot.ref);
          
          return {
            path: snapshot.ref.fullPath,
            url,
            size: snapshot.metadata.size
          };
        } catch (error) {
          throw errorHandler(error);
        }
      }, MAX_RETRIES, RETRY_DELAY_MS);
    },
    
    /**
     * Get download URL for a file.
     * @param {string} path - Storage path
     * @returns {Promise<string>} Download URL
     * @throws {Error} If file not found or access denied
     * 
     * @example
     * const url = await firebase.storage.getFileURL('avatars/user123.jpg');
     * console.log('Download URL:', url);
     */
    getFileURL: async (path) => {
      return retryWithBackoff(async () => {
        try {
          const storageRef = ref(this.storageInstance, path);
          return await getDownloadURL(storageRef);
        } catch (error) {
          throw errorHandler(error);
        }
      }, MAX_RETRIES, RETRY_DELAY_MS);
    },
    
    /**
     * Delete a file from Cloud Storage.
     * @param {string} path - Storage path
     * @returns {Promise<void>}
     * @throws {Error} If deletion fails or rate limit exceeded
     * 
     * @example
     * await firebase.storage.deleteFile('avatars/user123.jpg');
     * console.log('File deleted');
     */
    deleteFile: async (path) => {
      const limitKey = `storage:delete:${path.split('/')[0]}`;
      if (!rateLimiter(limitKey, 50, RATE_LIMIT_WINDOW_MS, this.rateLimitCache)) {
        throw new Error('Rate limit exceeded for storage delete. Please try again later.');
      }
      
      return retryWithBackoff(async () => {
        try {
          const storageRef = ref(this.storageInstance, path);
          await deleteObject(storageRef);
        } catch (error) {
          throw errorHandler(error);
        }
      }, MAX_RETRIES, RETRY_DELAY_MS);
    },
    
    /**
     * Download file data (browser only - not for Workers).
     * @param {string} path - Storage path
     * @returns {Promise<string>} Download URL (use fetch to get file data)
     * @throws {Error} If download fails
     * 
     * @example
     * const url = await firebase.storage.downloadFile('avatars/user123.jpg');
     * const response = await fetch(url);
     * const blob = await response.blob();
     */
    downloadFile: async (path) => {
      return await this.storage.getFileURL(path);
    }
  };
  
  /**
   * Analytics methods
   */
  analytics = {
    /**
     * Log a custom analytics event.
     * @param {string} eventName - Event name
     * @param {Object} [params] - Event parameters
     * @returns {void}
     * 
     * @example
     * firebase.analytics.logEvent('purchase', {
     *   transaction_id: 'T12345',
     *   value: 29.99,
     *   currency: 'USD',
     *   items: ['product1', 'product2']
     * });
     */
    logEvent: (eventName, params = {}) => {
      if (!this.analyticsInstance) {
        console.warn('Analytics not available');
        return;
      }
      
      try {
        firebaseLogEvent(this.analyticsInstance, eventName, params);
      } catch (error) {
        console.error('Analytics error:', error);
      }
    },
    
    /**
     * Set user properties for analytics.
     * @param {Object} properties - User properties
     * @returns {void}
     * 
     * @example
     * firebase.analytics.setUserProperties({
     *   account_type: 'premium',
     *   preferred_language: 'en',
     *   age_group: '25-34'
     * });
     */
    setUserProperties: (properties) => {
      if (!this.analyticsInstance) {
        console.warn('Analytics not available');
        return;
      }
      
      try {
        firebaseSetUserProperties(this.analyticsInstance, properties);
      } catch (error) {
        console.error('Analytics error:', error);
      }
    }
  };
}

export { FirebaseService };
export default FirebaseService;
```