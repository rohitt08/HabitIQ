import aiService from "../services/aiService.js";

export const weeklyReport = async (req, res, next) => {
  try {
    const report = await aiService.generateWeeklyReport(req.user._id);
    res.json(report);
  } catch (err) {
    next(err);
  }
};

export const suggestHabits = async (req, res, next) => {
  try {
    const { goals, productiveTime, struggles } = req.body;
    const suggestions = await aiService.suggestHabits(
      req.user._id,
      goals,
      productiveTime,
      struggles
    );
    res.json(suggestions);
  } catch (err) {
    next(err);
  }
};

export const recoveryPlan = async (req, res, next) => {
  try {
    const { habitId } = req.body;
    const plan = await aiService.generateRecoveryPlan(req.user._id, habitId);
    res.json(plan);
  } catch (err) {
    if (err.message === "Habit not found") {
      return res.status(404).json({ message: err.message });
    }
    next(err);
  }
};

export const chatAnalysis = async (req, res, next) => {
  try {
    const { question } = req.body;
    const answer = await aiService.analyzeChat(req.user._id, question);
    res.json(answer);
  } catch (err) {
    if (err.message === "Question is required") {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

export const morningMotivation = async (req, res, next) => {
  try {
    const motivation = await aiService.generateMorningMotivation(req.user._id);
    res.json(motivation);
  } catch (err) {
    next(err);
  }
};