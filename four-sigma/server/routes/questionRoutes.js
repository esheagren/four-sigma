import express from 'express';
import * as questionService from '../services/questionService.js';
import { validateQuestion } from '../middleware/validationMiddleware.js';
import questions from '../mockdb.js';
console.log('Loaded questions:', questions);

const router = express.Router();

// Add a root route to get all questions or a random one
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

// Put the random route before the :id route
router.get('/random', async (req, res) => {
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

// Put the :id route last
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
    res.status(500).json({ error: error.message || 'Failed to fetch question' });
  }
});

export default router; 