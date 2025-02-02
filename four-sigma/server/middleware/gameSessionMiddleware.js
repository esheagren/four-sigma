import express from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { GameSession } from '../models/GameSession.js';

const router = express.Router();
const db = getFirestore();
const sessionsRef = db.collection('gameSessions');

// Create new game session
router.post('/', async (req, res) => {
  try {
    const sessionData = new GameSession(
      null, // Firestore will auto-generate ID
      req.body.userId,
      0, // initial score
      [], // initial questionsAnswered
      new Date(), // startedAt
      null // endedAt
    );

    const sessionRef = await sessionsRef.add({
      userId: sessionData.userId,
      score: sessionData.score,
      questionsAnswered: sessionData.questionsAnswered,
      startedAt: sessionData.startedAt,
      endedAt: sessionData.endedAt
    });

    res.status(201).json({ 
      message: 'Game session created successfully',
      sessionId: sessionRef.id
    });
  } catch (error) {
    console.error('Error creating game session:', error);
    res.status(500).json({ error: error.message });
  }
});

// End game session
router.put('/:sessionId/end', async (req, res) => {
  try {
    const sessionRef = sessionsRef.doc(req.params.sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Game session not found' });
    }

    await sessionRef.update({
      score: req.body.score,
      questionsAnswered: req.body.questionsAnswered,
      endedAt: new Date()
    });

    res.json({ 
      message: 'Game session ended successfully',
      sessionId: req.params.sessionId
    });
  } catch (error) {
    console.error('Error ending game session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's game sessions
router.get('/user/:userId', async (req, res) => {
  try {
    const userSessions = await sessionsRef
      .where('userId', '==', req.params.userId)
      .orderBy('startedAt', 'desc')
      .get();

    const sessions = [];
    userSessions.forEach(doc => {
      sessions.push({ id: doc.id, ...doc.data() });
    });

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching user game sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router; 