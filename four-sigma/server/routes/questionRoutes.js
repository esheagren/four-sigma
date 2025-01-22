import express from 'express';
import * as questionService from '../services/questionService.js';
import { validateQuestion } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.get('/:id', async (req, res) => {
  // Get question route
});

export default router; 