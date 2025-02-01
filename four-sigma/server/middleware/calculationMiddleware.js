import Score from '../utils/Score.js';
import questions from '../mockdb.js';

export const calculateScore = (req, res, next) => {
  const { lowerBound, upperBound, questionId } = req.body;
  console.log("lowerBound, upperBound, questionId from req.body", lowerBound, upperBound, questionId);

  // Find the question using the correct property name from mockdb.js.
  const question = questions.find(q => q.questionId === Number(questionId));
  
  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }
  
  console.log("question from mockdb.js", question);

  // Calculate the score using the provided static method.
  const score = Score.calculateScore(
    Number(lowerBound),
    Number(upperBound),
    Number(question.answer)
  );
  
  console.log("score calculated in calculationMiddleware.js", score);
  res.locals.score = score;
  next();
};

export const calculateStats = (req, res, next) => {
  // Stats calculation logic if needed
  next();
}; 