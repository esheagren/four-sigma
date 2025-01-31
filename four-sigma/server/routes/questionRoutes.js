import express from 'express';
import * as questionService from '../services/questionService.js';
import { validateQuestion } from '../middleware/validationMiddleware.js';
import questions from '../mockdb.js';

const router = express.Router();

router.get('/:id', async (req, res) => {

});

router.get('/random', async (req, res) => {
    try {
        const randomIndex = Math.floor(Math.random() * questions.length);
        const randomQuestion = questions[randomIndex];
        console.log(randomQuestion);
        res.json(randomQuestion);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch random question' });
    }
});

export default router; 