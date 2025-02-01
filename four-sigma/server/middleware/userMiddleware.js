import express from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { User } from '../models/User.js';

const router = express.Router();
const db = getFirestore();
const usersRef = db.collection('users');

// Create user
router.post('/', async (req, res) => {
  try {
    const userData = new User(
      null, // Firestore will auto-generate ID
      req.body.email,
      req.body.username
    );

    const userRef = await usersRef.add({
      email: userData.email,
      username: userData.username,
      profile: userData.profile,
      stats: userData.stats
    });

    res.status(201).json({ 
      message: 'User created successfully',
      userId: userRef.id
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get('/:userId', async (req, res) => {
  try {
    const userDoc = await usersRef.doc(req.params.userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ id: userDoc.id, ...userDoc.data() });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/:userId', async (req, res) => {
  try {
    const userRef = usersRef.doc(req.params.userId);
    await userRef.update({
      ...req.body,
      'profile.lastActive': new Date()
    });

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router; 