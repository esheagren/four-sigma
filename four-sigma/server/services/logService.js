import Log from '../models/Log.js';

export const createLog = async (logData) => {
  return await Log.create(logData);
};

export const getUserLogs = async (userID) => {
  return await Log.find({ userID });
}; 