// Import Firebase Admin first
import admin from 'firebase-admin';

// Import and initialize Firebase configuration before other imports
import { db, auth } from './config/firebaseConfig.js';

// Express and middleware imports
import express from 'express';
import cors from 'cors';

// Route imports
import userRoutes from './routes/userRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import logRoutes from './routes/logRoutes.js';
import gameSessionRoutes from './routes/gameSessionRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Add a test endpoint to verify Firebase connection
app.get('/test-firebase', async (req, res) => {
    try {
        const timestamp = admin.firestore.Timestamp.now();
        await db.collection('test').doc('connection-test').set({
            timestamp,
            message: 'Firebase connection test'
        });
        res.json({ success: true, timestamp });
    } catch (error) {
        console.error('Firebase test error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/sessions', gameSessionRoutes);

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