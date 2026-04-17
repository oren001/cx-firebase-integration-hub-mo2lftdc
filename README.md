# Firebase Integration Hub

A production-ready, reusable Firebase service layer for Cloudflare Workers. This module provides a centralized, type-safe interface to Firebase Auth, Firestore, Storage, and Analytics that can be imported into any project.

## Features

- 🔥 **Firebase SDK v10** with modular imports
- 🔐 **Authentication** wrapper (sign up, sign in, sign out, auth state)
- 📦 **Firestore** CRUD operations with real-time listeners
- 📁 **Storage** file management (upload, download, delete)
- 📊 **Analytics** event logging and user properties
- 🔄 **Automatic retry logic** with exponential backoff
- 🛡️ **Rate limiting** protection
- 💪 **TypeScript-ready** with JSDoc type definitions
- ⚡ **Cloudflare Worker optimized**

## Installation

### As a Standalone Service

```bash
npm install
npm run dev
```

### Import into Your Project

1. Copy `firebase-service.js`, `firebase-config.js`, `utils.js`, and `types.js` to your project
2. Install Firebase SDK:

```bash
npm install firebase@^10.0.0
```

3. Import and use:

```javascript
import { FirebaseService } from './firebase-service.js';

const firebase = FirebaseService.getInstance();
```

## Configuration

The service is pre-configured for Firebase project `general-4686c`. Configuration is in `firebase-config.js`:

```javascript
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDqXPz4vK9m2LwN3rT6sU8jY1eR7fG9hWi",
  authDomain: "general-4686c.firebaseapp.com",
  projectId: "general-4686c",
  storageBucket: "general-4686c.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456ghi789jkl",
  measurementId: "G-ABCD123456"
};
```

To use with a different Firebase project, update `FIREBASE_CONFIG` in `firebase-config.js`.

## Usage Examples

### Authentication

#### Sign Up

```javascript
const firebase = FirebaseService.getInstance();

try {
  const user = await firebase.auth.signUp('user@example.com', 'SecurePassword123!');
  console.log('User created:', user.uid, user.email);
} catch (error) {
  console.error('Sign up failed:', error.message);
}
```

#### Sign In

```javascript
try {
  const user = await firebase.auth.signIn('user@example.com', 'SecurePassword123!');
  console.log('Signed in:', user.uid);
} catch (error) {
  console.error('Sign in failed:', error.message);
}
```

#### Sign Out

```javascript
try {
  await firebase.auth.signOut();
  console.log('Signed out successfully');
} catch (error) {
  console.error('Sign out failed:', error.message);
}
```

#### Get Current User

```javascript
const user = firebase.auth.getCurrentUser();
if (user) {
  console.log('Current user:', user.uid, user.email);
} else {
  console.log('No user signed in');
}
```

#### Listen to Auth State Changes

```javascript
const unsubscribe = firebase.auth.onAuthChange((user) => {
  if (user) {
    console.log('User signed in:', user.email);
  } else {
    console.log('User signed out');
  }
});

// Later, to stop listening:
unsubscribe();
```

### Firestore

#### Create Document

```javascript
try {
  const docId = await firebase.firestore.create('users', {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    createdAt: new Date().toISOString()
  });
  console.log('Document created with ID:', docId);
} catch (error) {
  console.error('Create failed:', error.message);
}
```

#### Read Document

```javascript
try {
  const doc = await firebase.firestore.read('users', 'user123');
  if (doc) {
    console.log('User data:', doc);
  } else {
    console.log('Document not found');
  }
} catch (error) {
  console.error('Read failed:', error.message);
}
```

#### Update Document

```javascript
try {
  await firebase.firestore.update('users', 'user123', {
    age: 31,
    updatedAt: new Date().toISOString()
  });
  console.log('Document updated');
} catch (error) {
  console.error('Update failed:', error.message);
}
```

#### Delete Document

```javascript
try {
  await firebase.firestore.delete('users', 'user123');
  console.log('Document deleted');
} catch (error) {
  console.error('Delete failed:', error.message);
}
```

#### Query Documents

```javascript
try {
  const users = await firebase.firestore.query('users', [
    { field: 'age', operator: '>', value: 25 },
    { field: 'email', operator: '!=', value: null }
  ]);
  console.log(`Found ${users.length} users:`, users);
} catch (error) {
  console.error('Query failed:', error.message);
}
```

**Supported operators:** `==`, `!=`, `<`, `<=`, `>`, `>=`, `array-contains`, `in`, `array-contains-any`, `not-in`

#### Real-time Listener

```javascript
const unsubscribe = firebase.firestore.onSnapshot('users', 'user123', (data) => {
  if (data) {
    console.log('Document updated:', data);
  } else {
    console.log('Document deleted or not found');
  }
});

// Later, to stop listening:
unsubscribe();
```

### Storage

#### Upload File

```javascript
try {
  const file = new File(['Hello, World!'], 'hello.txt', { type: 'text/plain' });
  const downloadURL = await firebase.storage.uploadFile('documents/hello.txt', file);
  console.log('File uploaded:', downloadURL);
} catch (error) {
  console.error('Upload failed:', error.message);
}
```

#### Download File

```javascript
try {
  const blob = await firebase.storage.downloadFile('documents/hello.txt');
  const text = await blob.text();
  console.log('File content:', text);
} catch (error) {
  console.error('Download failed:', error.message);
}
```

#### Get File URL

```javascript
try {
  const url = await firebase.storage.getFileURL('documents/hello.txt');
  console.log('File URL:', url);
} catch (error) {
  console.error('Get URL failed:', error.message);
}
```

#### Delete File

```javascript
try {
  await firebase.storage.deleteFile('documents/hello.txt');
  console.log('File deleted');
} catch (error) {
  console.error('Delete failed:', error.message);
}
```

### Analytics

#### Log Event

```javascript
firebase.analytics.logEvent('purchase', {
  transaction_id: 'T12345',
  value: 99.99,
  currency: 'USD',
  items: ['item1', 'item2']
});
```

#### Set User Properties

```javascript
firebase.analytics.setUserProperties({
  account_type: 'premium',
  preferred_language: 'en',
  timezone: 'America/New_York'
});
```

## Error Handling

All Firebase operations return promises and include comprehensive error handling:

```javascript
try {
  const user = await firebase.auth.signIn(email, password);
  // Success
} catch (error) {
  // Error object includes:
  // - error.code: Firebase error code (e.g., 'auth/user-not-found')
  // - error.message: Human-readable message
  // - error.details: Additional context
  
  if (error.code === 'auth/user-not-found') {
    console.error('User does not exist');
  } else if (error.code === 'auth/wrong-password') {
    console.error('Incorrect password');
  } else {
    console.error('Authentication failed:', error.message);
  }
}
```

### Common Error Codes

**Authentication:**
- `auth/email-already-in-use`: Email is already registered
- `auth/invalid-email`: Email format is invalid
- `auth/user-not-found`: No user with this email
- `auth/wrong-password`: Incorrect password
- `auth/weak-password`: Password too weak (< 6 characters)

**Firestore:**
- `permission-denied`: User lacks permission
- `not-found`: Document doesn't exist
- `already-exists`: Document already exists
- `failed-precondition`: Operation precondition failed

**Storage:**
- `storage/object-not-found`: File doesn't exist
- `storage/unauthorized`: Permission denied
- `storage/quota-exceeded`: Storage quota exceeded

## Retry Logic

All operations include automatic retry with exponential backoff:

- **Max retries:** 3 attempts
- **Initial delay:** 1000ms
- **Backoff multiplier:** 2x per retry
- **Total max time:** ~7 seconds

Configure in `firebase-config.js`:

```javascript
export const MAX_RETRIES = 3;
export const RETRY_DELAY_MS = 1000;
```

## Rate Limiting

Built-in rate limiting prevents quota exhaustion:

- **Window:** 60 seconds
- **Limit:** 100 requests per operation type per window
- **Storage:** In-memory (resets on Worker restart)

Configure in `firebase-config.js`:

```javascript
export const RATE_LIMIT_WINDOW_MS = 60000;
```

Rate limit structure:
- Key format: `{operationType}:{userId or 'anonymous'}`
- Each operation (auth, firestore, storage) tracked separately

## API Endpoints

When deployed as a Worker, the service exposes these endpoints:

### `GET /`
Documentation page with usage examples

### `GET /health`
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "firebase-integration-hub"
}
```

### `POST /api/test-auth`
Test authentication flow

**Request body:**
```json
{
  "email": "test@example.com",
  "password": "TestPassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "uid": "abc123...",
    "email": "test@example.com"
  }
}
```

### `POST /api/test-firestore`
Test Firestore operations

**Request body:**
```json
{
  "collection": "test",
  "data": {
    "name": "Test Document",
    "value": 42
  }
}
```

**Response:**
```json
{
  "success": true,
  "docId": "xyz789...",
  "data": {
    "name": "Test Document",
    "value": 42
  }
}
```

### `GET /api/docs`
JSON API documentation

## Deployment

### Deploy to Cloudflare Workers

```bash
npm run deploy
```

### Configure Secrets (if needed for future extensions)

```bash
wrangler secret put FIREBASE_API_KEY
```

### Custom Domain

Add to `wrangler.toml`:

```toml
routes = [
  { pattern = "firebase.yourdomain.com", zone_name = "yourdomain.com" }
]
```

## Import Patterns for Other Projects

### Pattern 1: Direct Import

Copy the service files into your project:

```
your-project/
├── lib/
│   ├── firebase-service.js
│   ├── firebase-config.js
│   ├── utils.js
│   └── types.js
└── src/
    └── index.js
```

```javascript
import { FirebaseService } from './lib/firebase-service.js';

const firebase = FirebaseService.getInstance();
```

### Pattern 2: Worker Subrequest

Deploy this hub and make subrequests from other Workers:

```javascript
// In another Worker
export default {
  async fetch(request) {
    const response = await fetch('https://firebase-hub.your-domain.com/api/test-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const result = await response.json();
    return new Response(JSON.stringify(result));
  }
};
```

### Pattern 3: Service Binding

In `wrangler.toml` of your project:

```toml
services = [
  { binding = "FIREBASE_HUB", service = "firebase-integration-hub" }
]
```

```javascript
export default {
  async fetch(request, env) {
    const response = await env.FIREBASE_HUB.fetch(new Request('http://internal/api/test-auth', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }));
    return response;
  }
};
```

## Type Safety

The service includes JSDoc type definitions for IDE autocomplete and type checking:

```javascript
/**
 * @typedef {Object} FirebaseUser
 * @property {string} uid - User ID
 * @property {string} email - User email
 * @property {boolean} emailVerified - Email verification status
 */

/**
 * @param {string} email
 * @param {string} password
 * @returns {Promise<FirebaseUser>}
 */
async signIn(email, password) { ... }
```

## Performance Considerations

### Cloudflare Worker Limits

- **CPU time:** 50ms (free tier), 50-500ms (paid)
- **Memory:** 128MB
- **Request size:** 100MB
- **Subrequests:** 50 per request

### Firebase Quotas

- **Firestore:** 10,000 reads/day (Spark), 50,000 reads/day (Blaze)
- **Storage:** 1GB (Spark), 50GB (Blaze)
- **Auth:** 10 SMS verifications/day (Spark)

### Optimization Tips

1. **Batch operations** when possible
2. **Cache frequently accessed data** in KV or Durable Objects
3. **Use Firestore queries** instead of reading all documents
4. **Implement pagination** for large result sets
5. **Monitor rate limits** and adjust as needed

## Security Best Practices

1. **Never expose API keys** in client-side code
2. **Use Firebase Security Rules** to protect Firestore and Storage
3. **Validate user input** before database operations
4. **Implement authentication** for sensitive operations
5. **Use HTTPS only** for all requests
6. **Rotate credentials** regularly
7. **Monitor Firebase Usage** in console

## Troubleshooting

### "Firebase app not initialized"

Ensure `FirebaseService.getInstance()` is called before any operations.

### "Permission denied"

Check Firebase Security Rules. Default rules require authentication:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Rate limit exceeded

Increase limits in `firebase-config.js` or implement request throttling.

### CORS errors

Add allowed origins in Firebase Console → Authentication → Settings → Authorized domains

## Contributing

This is a standalone service module. To extend:

1. Add new methods to `firebase-service.js`
2. Update `types.js` with new type definitions
3. Add tests in new endpoints in `index.js`
4. Update this README with usage examples

## License

MIT

## Support

For Firebase-specific issues, see [Firebase Documentation](https://firebase.google.com/docs)

For Cloudflare Workers issues, see [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)

---

**Version:** 1.0.0  
**Last Updated:** 2024-01-15  
**Firebase SDK:** v10.x  
**Cloudflare Workers:** Compatible with all plans