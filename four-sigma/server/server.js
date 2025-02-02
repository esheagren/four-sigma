// Import Firebase Admin first
import admin from 'firebase-admin';

// Import and initialize Firebase configuration before other imports
import { db, auth } from './config/firebaseConfig.js';

// Express and middleware imports
import express from 'express';
import cors from 'cors';

// Route imports
import logMiddleware from './middleware/logMiddleware.js';
import userMiddleware from './middleware/userMiddleware.js';
import questionMiddleware from './middleware/questionMiddleware.js';
import gameSessionMiddleware from './middleware/gameSessionMiddleware.js';
import { calculateScore, calculateStats } from './middleware/calculationMiddleware.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userMiddleware);
app.use('/api/questions', questionMiddleware);
app.use('/api/logs', logMiddleware);
app.use('/api/sessions', gameSessionMiddleware);

// New submit endpoint that processes the user's answer using calculateScore middleware.
app.post('/api/submit', calculateScore, (req, res) => {
  const score = res.locals.score;
  // In this example, a score greater than or equal to 0 is considered correct.
  // You could modify this logic as needed.
  const correct = score >= 0;
  
  // Optionally, you could call calculateStats here before sending the response.
  res.json({ correct, score });
});

// Server initialization
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // Verify Firebase initialization
    const firebaseApp = admin.apps[0];
    if (firebaseApp) {
        console.log('Firebase Admin SDK initialized successfully');
        console.log('Firebase Project ID:', firebaseApp.options.projectId);
        console.log('Credential type:', firebaseApp.options.credential.constructor.name);
    } else {
        console.error('Firebase Admin SDK not initialized');
    }
});

// Error handling for uncaught exceptions
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Give the server a chance to finish ongoing requests
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});