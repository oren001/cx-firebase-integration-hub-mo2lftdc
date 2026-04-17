```javascript
import { FirebaseService } from './firebase-service.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/' && request.method === 'GET') {
        return new Response(getDocumentationHTML(), {
          headers: { 'Content-Type': 'text/html' }
        });
      }

      if (path === '/health' && request.method === 'GET') {
        return new Response(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          service: 'firebase-integration-hub'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (path === '/api/docs' && request.method === 'GET') {
        return new Response(JSON.stringify({
          endpoints: {
            'GET /': 'Documentation page',
            'GET /health': 'Health check',
            'POST /api/test-auth': 'Test authentication (body: { email, password })',
            'POST /api/test-firestore': 'Test Firestore operations (body: { collection, data })',
            'GET /api/docs': 'This API documentation'
          },
          methods: {
            auth: [
              'signUp(email, password)',
              'signIn(email, password)',
              'signOut()',
              'getCurrentUser()',
              'onAuthChange(callback)'
            ],
            firestore: [
              'create(collection, data)',
              'read(collection, docId)',
              'update(collection, docId, data)',
              'delete(collection, docId)',
              'query(collection, constraints)',
              'onSnapshot(collection, docId, callback)'
            ],
            storage: [
              'uploadFile(path, file)',
              'downloadFile(path)',
              'deleteFile(path)',
              'getFileURL(path)'
            ],
            analytics: [
              'logEvent(eventName, params)',
              'setUserProperties(properties)'
            ]
          }
        }, null, 2), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (path === '/api/test-auth' && request.method === 'POST') {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
          return new Response(JSON.stringify({
            error: 'Missing email or password'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const firebase = FirebaseService.getInstance();

        try {
          const user = await firebase.auth.signUp(email, password);
          
          return new Response(JSON.stringify({
            success: true,
            message: 'User created successfully',
            userId: user.uid,
            email: user.email
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          if (error.code === 'auth/email-already-in-use') {
            try {
              const user = await firebase.auth.signIn(email, password);
              return new Response(JSON.stringify({
                success: true,
                message: 'User signed in successfully',
                userId: user.uid,
                email: user.email
              }), {
                headers: { 'Content-Type': 'application/json' }
              });
            } catch (signInError) {
              return new Response(JSON.stringify({
                error: signInError.message,
                code: signInError.code
              }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
              });
            }
          }

          return new Response(JSON.stringify({
            error: error.message,
            code: error.code
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      if (path === '/api/test-firestore' && request.method === 'POST') {
        const body = await request.json();
        const { collection, data } = body;

        if (!collection || !data) {
          return new Response(JSON.stringify({
            error: 'Missing collection or data'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const firebase = FirebaseService.getInstance();

        try {
          const docRef = await firebase.firestore.create(collection, data);
          
          const doc = await firebase.firestore.read(collection, docRef.id);
          
          return new Response(JSON.stringify({
            success: true,
            message: 'Document created and retrieved successfully',
            docId: docRef.id,
            data: doc
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({
            error: error.message,
            code: error.code
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      return new Response(JSON.stringify({
        error: 'Not Found',
        message: `Route ${path} not found`
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

function getDocumentationHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Firebase Integration Hub</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 2rem;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    
    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 3rem 2rem;
      text-align: center;
    }
    
    header h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }
    
    header p {
      font-size: 1.2rem;
      opacity: 0.9;
    }
    
    .content {
      padding: 3rem 2rem;
    }
    
    section {
      margin-bottom: 3rem;
    }
    
    h2 {
      color: #667eea;
      margin-bottom: 1rem;
      font-size: 1.8rem;
      border-bottom: 2px solid #667eea;
      padding-bottom: 0.5rem;
    }
    
    h3 {
      color: #764ba2;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
      font-size: 1.3rem;
    }
    
    code {
      background: #f5f5f5;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      color: #e83e8c;
    }
    
    pre {
      background: #2d2d2d;
      color: #f8f8f2;
      padding: 1.5rem;
      border-radius: 8px;
      overflow-x: auto;
      margin: 1rem 0;
    }
    
    pre code {
      background: none;
      color: inherit;
      padding: 0;
    }
    
    .method-card {
      background: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 1rem;
      margin: 1rem 0;
      border-radius: 4px;
    }
    
    .method-card h4 {
      color: #333;
      margin-bottom: 0.5rem;
    }
    
    .endpoint {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 0.3rem 0.8rem;
      border-radius: 4px;
      font-weight: bold;
      margin: 0.25rem 0;
    }
    
    .endpoint.get { background: #28a745; }
    .endpoint.post { background: #007bff; }
    
    ul {
      margin-left: 2rem;
      margin-top: 0.5rem;
    }
    
    li {
      margin-bottom: 0.5rem;
    }
    
    .example {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 1rem;
      margin: 1rem 0;
      border-radius: 4px;
    }
    
    footer {
      background: #f8f9fa;
      padding: 2rem;
      text-align: center;
      color: #666;
      border-top: 1px solid #dee2e6;
    }
    
    .badge {
      display: inline-block;
      padding: 0.25rem 0.6rem;
      background: #28a745;
      color: white;
      border-radius: 12px;
      font-size: 0.85rem;
      margin-left: 0.5rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🔥 Firebase Integration Hub</h1>
      <p>Centralized Firebase service layer for all your projects</p>
      <span class="badge">v1.0.0</span>
    </header>
    
    <div class="content">
      <section>
        <h2>Overview</h2>
        <p>
          Firebase Integration Hub is a production-ready service layer that provides a clean, 
          reusable interface for Firebase Auth, Firestore, Storage, and Analytics. Import this 
          module into any project and start using Firebase immediately with built-in error handling, 
          retry logic, and rate limiting.
        </p>
      </section>
      
      <section>
        <h2>Quick Start</h2>
        <h3>Installation</h3>
        <pre><code>import { FirebaseService } from './firebase-service.js';

const firebase = FirebaseService.getInstance();</code></pre>
        
        <h3>Basic Usage</h3>
        <pre><code>// Authentication
const user = await firebase.auth.signUp('user@example.com', 'password123');
await firebase.auth.signIn('user@example.com', 'password123');
const currentUser = firebase.auth.getCurrentUser();

// Firestore
const docRef = await firebase.firestore.create('users', {
  name: 'John Doe',
  email: 'john@example.com'
});

const doc = await firebase.firestore.read('users', docRef.id);

// Storage
await firebase.storage.uploadFile('images/avatar.jpg', fileBlob);
const url = await firebase.storage.getFileURL('images/avatar.jpg');

// Analytics
firebase.analytics.logEvent('user_signup', { method: 'email' });</code></pre>
      </section>
      
      <section>
        <h2>API Endpoints</h2>
        
        <div class="method-card">
          <span class="endpoint get">GET</span> <code>/</code>
          <p>This documentation page</p>
        </div>
        
        <div class="method-card">
          <span class="endpoint get">GET</span> <code>/health</code>
          <p>Health check endpoint. Returns service status and timestamp.</p>
        </div>
        
        <div class="method-card">
          <span class="endpoint post">POST</span> <code>/api/test-auth</code>
          <p>Test authentication functionality</p>
          <pre><code>{
  "email": "test@example.com",
  "password": "testPassword123"
}</code></pre>
        </div>
        
        <div class="method-card">
          <span class="endpoint post">POST</span> <code>/api/test-firestore</code>
          <p>Test Firestore CRUD operations</p>
          <pre><code>{
  "collection": "test",
  "data": {
    "name": "Test Document",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}</code></pre>
        </div>
        
        <div class="method-card">
          <span class="endpoint get">GET</span> <code>/api/docs</code>
          <p>JSON API documentation with all available methods</p>
        </div>
      </section>
      
      <section>
        <h2>Available Methods</h2>
        
        <h3>Authentication (auth)</h3>
        <ul>
          <li><code>signUp(email, password)</code> - Create new user account</li>
          <li><code>signIn(email, password)</code> - Sign in existing user</li>
          <li><code>signOut()</code> - Sign out current user</li>
          <li><code>getCurrentUser()</code> - Get currently authenticated user</li>
          <li><code>onAuthChange(callback)</code> - Listen to auth state changes</li>
        </ul>
        
        <h3>Firestore (firestore)</h3>
        <ul>
          <li><code>create(collection, data)</code> - Create new document</li>
          <li><code>read(collection, docId)</code> - Read single document</li>
          <li><code>update(collection, docId, data)</code> - Update document</li>
          <li><code>delete(collection, docId)</code> - Delete document</li>
          <li><code>query(collection, constraints)</code> - Query documents with filters</li>
          <li><code>onSnapshot(collection, docId, callback)</code> - Realtime listener</li>
        </ul>
        
        <h3>Storage (storage)</h3>
        <ul>
          <li><code>uploadFile(path, file)</code> - Upload file to storage</li>
          <li><code>downloadFile(path)</code> - Download file from storage</li>
          <li><code>deleteFile(path)</code> - Delete file from storage</li>
          <li><code>getFileURL(path)</code> - Get public download URL</li>
        </ul>
        
        <h3>Analytics (analytics)</h3>
        <ul>
          <li><code>logEvent(eventName, params)</code> - Log custom analytics event</li>
          <li><code>setUserProperties(properties)</code> - Set user properties for analytics</li>
        </ul>
      </section>
      
      <section>
        <h2>Features</h2>
        <ul>
          <li>✅ Automatic retry logic with exponential backoff</li>
          <li>✅ Rate limiting protection (60 requests per minute)</li>
          <li>✅ Comprehensive error handling</li>
          <li>✅ TypeScript-ready with JSDoc annotations</li>
          <li>✅ Singleton pattern for efficient resource usage</li>
          <li>✅ Works in Cloudflare Workers environment</li>
          <li>✅ Real-time listeners for Firestore</li>
          <li>✅ Full Firebase v10 modular SDK support</li>
        </ul>
      </section>
      
      <section>
        <h2>Error Handling</h2>
        <div class="example">
          <p><strong>All methods throw descriptive errors:</strong></p>
          <pre><code>try {
  await firebase.auth.signIn('user@example.com', 'wrongpassword');
} catch (error) {
  console.error('Auth failed:', error.message);
  // Handle specific error codes
  if (error.code === 'auth/wrong-password') {
    // Show user-friendly message
  }
}</code></pre>
        </div>
      </section>
      
      <section>
        <h2>Import in Your Projects</h2>
        <pre><code>// In your wrangler.toml, add as a service binding
// or simply copy firebase-service.js and related files

import { FirebaseService } from './firebase-service.js';

const firebase = FirebaseService.getInstance();

// Use anywhere in your application
export default {
  async fetch(request) {
    const user = await firebase.auth.getCurrentUser();
    // ... your logic
  }
}</code></pre>
      </section>
    </div>
    
    <footer>
      <p><strong>Firebase Integration Hub</strong> - Built for Cloudflare Workers</p>
      <p>Project: general-4686c | Firebase SDK v10 | ESM Module</p>
    </footer>
  </div>
</body>
</html>`;
}
```