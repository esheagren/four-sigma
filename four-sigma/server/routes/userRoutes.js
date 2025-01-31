import express from 'express';
import { getFirestore } from 'firebase-admin/firestore';

const router = express.Router();

const db = getFirestore();

router.post('/', async (req, res) => {
  try {
    // Use add() instead of doc().set() to auto-generate an ID
    const userRef = await db.collection('users').add({
      email: req.body.email,
      username: req.body.username,
      profile: {
        dateJoined: new Date(),
        lastActive: new Date()
      },
      stats: {
        averageQuestionScore: 0,
        calibration: 0,
        correctAnswers: 0,
        dailyStreak: 0,
        highestGameScore: 0,
        highestQuestionScore: 0,
        sdQuestionScore: 0,
        totalGamesPlayed: 0,
        totalQuestionsAnswered: 0
      }
    });

    res.status(201).json({ 
      message: 'User created successfully',
      // userId: userRef.id  // Return the auto-generated ID
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;