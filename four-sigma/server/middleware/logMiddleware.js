import express from 'express';
import { db } from '../config/firebaseConfig.js';
import { Log } from '../models/Log.js';

const router = express.Router();

// Combine the service functions with route handlers
router.post('/', async (req, res) => {
  try {
    const logData = new Log(
      null, // Firestore will auto-generate ID
      req.body.userId,
      req.body.questionId,
      req.body.attempts,
      req.body.successRate,
      req.body.timestamps,
      req.body.answers
    );

    const logRef = await db.collection('logs').add({
      ...logData,
      createdAt: new Date()
    });

    res.status(201).json({ 
      message: 'Log created successfully',
      logId: logRef.id
    });
  } catch (error) {
    console.error('Error creating log:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const userLogs = await db.collection('logs')
      .where('userId', '==', req.params.userId)
      .get();

    const logs = [];
    userLogs.forEach(doc => {
      logs.push({ id: doc.id, ...doc.data() });
    });

    res.json(logs);
  } catch (error) {
    console.error('Error fetching user logs:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;