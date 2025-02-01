import Score from '../utils/Score.js';
import questions from '../mockdb.js';

export const calculateScore = (req, res, next) => {
  const { lowerBound, upperBound, questionId } = req.body;

  // Find the question using the id from the mockdb.js file.
  const question = questions.find(q => q.id === questionId);

  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }

  // Calculate the score using the provided static method.
  // Ensure all values are numbers.
  const score = Score.calculateScore(
    Number(lowerBound),
    Number(upperBound),
    Number(question.answer)
  );

  res.locals.score = score;
  next();
};

export const calculateStats = (req, res, next) => {
  // Stats calculation logic
  next();
}; 