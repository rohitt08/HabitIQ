import logService from "../services/logService.js";

export const markComplete = async (req, res, next) => {
  try {
    const { habitId, date } = req.body;
    const log = await logService.markComplete(req.user._id, habitId, date);
    res.status(201).json(log);
  } catch (err) {
    if (err.message === "Habit not found") {
      return res.status(404).json({ message: err.message });
    }
    next(err);
  }
};

export const unmarkComplete = async (req, res, next) => {
  try {
    const { habitId, date } = req.body;
    await logService.unmarkComplete(req.user._id, habitId, date);
    res.json({ message: "Unmarked" });
  } catch (err) {
    next(err);
  }
};

export const getToday = async (req, res, next) => {
  try {
    const logs = await logService.getTodayLogs(req.user._id);
    res.json(logs);
  } catch (err) {
    next(err);
  }
};

export const getRange = async (req, res, next) => {
  try {
    const { start, end } = req.query;
    const logs = await logService.getRangeLogs(req.user._id, start, end);
    res.json(logs);
  } catch (err) {
    next(err);
  }
};

export const getHeatmap = async (req, res, next) => {
  try {
    const data = await logService.getHeatmap(req.user._id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getHabitStats = async (req, res, next) => {
  try {
    const stats = await logService.getHabitStats(req.user._id, req.params.habitId);
    res.json(stats);
  } catch (err) {
    if (err.message === "Habit not found") {
      return res.status(404).json({ message: err.message });
    }
    next(err);
  }
};

export const getAllStats = async (req, res, next) => {
  try {
    const stats = await logService.getAllStats(req.user._id);
    res.json(stats);
  } catch (err) {
    next(err);
  }
};
