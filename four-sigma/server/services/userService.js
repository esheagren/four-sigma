import User from '../models/User.js';
import { db } from '../config/firebaseConfig.js';
import { collection, doc, getDoc, setDoc, updateDoc, query, where } from 'firebase/firestore';

const usersRef = collection(db, 'users');

export const userService = {
  async createUser(userData) {
    const userRef = doc(usersRef, userData.userId);
    await setDoc(userRef, {
      email: userData.email,
      username: userData.username,
      profile: {
        dateJoined: new Date(),
        lastActive: new Date()
      },
      stats: {
        totalGamesPlayed: 0,
        averageQuestionScore: 0,
        // other initial stats
      }
    });
  },

  async getUser(userId) {
    const userDoc = await getDoc(doc(usersRef, userId));
    return userDoc.exists() ? userDoc.data() : null;
  },

  // Add other user-related methods
};

export const createUser = async (userData) => {
  return await User.create(userData);
};

export const getUser = async (userID) => {
  return await User.findOne({ userID });
}; 