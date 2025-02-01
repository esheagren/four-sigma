import express from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { Question } from '../models/Question.js';
import questions from '../mockdb.js';

const router = express.Router();
const db = getFirestore();
const questionsRef = db.collection('questions');

// Get random question (main route)
router.get('/', async (req, res) => {
  try {
    if (!Array.isArray(questions) || questions.length === 0) {
      console.error('Questions array is invalid:', questions);
      return res.status(500).json({ error: 'Questions database is not properly initialized' });
    }

    const randomIndex = Math.floor(Math.random() * questions.length);
    const randomQuestion = questions[randomIndex];
    
    if (!randomQuestion) {
      console.error('Failed to get random question. Index:', randomIndex, 'Questions length:', questions.length);
      return res.status(500).json({ error: 'Failed to get random question' });
    }

    console.log('Successfully fetched random question:', randomQuestion);
    res.json(randomQuestion);
  } catch (error) {
    console.error('Error fetching random question:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch random question' });
  }
});

// Get question by ID
router.get('/:id', async (req, res) => {
  try {
    const questionId = req.params.id;
    const question = questions.find(q => q.id === questionId);
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    res.json(question);
  } catch (error) {
    console.error('Error fetching question by ID:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update question stats
router.put('/:id/stats', async (req, res) => {
  try {
    const questionRef = questionsRef.doc(req.params.id);
    const questionDoc = await questionRef.get();

    if (!questionDoc.exists) {
      return res.status(404).json({ error: 'Question not found' });
    }

    await questionRef.update({
      timeAttempted: req.body.timeAttempted || 0,
      guesses: req.body.guesses || [],
      averageUpper: req.body.averageUpper || 0,
      averageLower: req.body.averageLower || 0,
      standardDevUpper: req.body.standardDevUpper || 0,
      standardDevLower: req.body.standardDevLower || 0,
      percentCorrect: req.body.percentCorrect || 0,
      inBounds: req.body.inBounds || 0
    });

    res.json({ message: 'Question stats updated successfully' });
  } catch (error) {
    console.error('Error updating question stats:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router; 