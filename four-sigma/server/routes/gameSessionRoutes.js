import express from 'express';
import * as gameSessionService from '../services/gameSessionService.js';
import { validateGameSession } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.post('/', validateGameSession, async (req, res) => {
  // Create game session route
});

export default router; 