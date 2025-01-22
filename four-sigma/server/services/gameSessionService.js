import GameSession from '../models/GameSession.js';

export const createSession = async (sessionData) => {
  return await GameSession.create(sessionData);
};

export const endSession = async (gameID, endData) => {
  return await GameSession.findOneAndUpdate(
    { gameID },
    { ...endData, endedAt: new Date() },
    { new: true }
  );
}; 