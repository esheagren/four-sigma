import Question from '../models/Question.js';

export const getQuestion = async (questionID) => {
  return await Question.findOne({ questionID });
};

export const updateQuestionStats = async (questionID, stats) => {
  return await Question.findOneAndUpdate({ questionID }, stats, { new: true });
}; 