import habitService from "../services/habitService.js";

export const getHabits = async (req, res, next) => {
  try {
    const habits = await habitService.getHabits(req.user._id, req.query.includeArchived);
    res.json(habits);
  } catch (err) {
    next(err);
  }
};

export const createHabit = async (req, res, next) => {
  try {
    const habit = await habitService.createHabit(req.user._id, req.body);
    res.status(201).json(habit);
  } catch (err) {
    if (err.message === "Habit name is required" || err.message === "Maximum 7 active habits allowed") {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

export const updateHabit = async (req, res, next) => {
  try {
    const habit = await habitService.updateHabit(req.params.id, req.user._id, req.body);
    res.json(habit);
  } catch (err) {
    if (err.message === "Habit not found") {
      return res.status(404).json({ message: err.message });
    }
    next(err);
  }
};

export const deleteHabit = async (req, res, next) => {
  try {
    await habitService.deleteHabit(req.params.id, req.user._id);
    res.json({ message: "Habit Deleted" });
  } catch (err) {
    if (err.message === "Habit not found") {
      return res.status(404).json({ message: err.message });
    }
    next(err);
  }
};

export const archiveHabit = async (req, res, next) => {
  try {
    const habit = await habitService.archiveHabit(req.params.id, req.user._id);
    res.json(habit);
  } catch (err) {
    if (err.message === "Habit not found") {
      return res.status(404).json({ message: err.message });
    }
    next(err);
  }
};

export const reorderHabits = async (req, res, next) => {
  try {
    await habitService.reorderHabits(req.user._id, req.body.order);
    res.json({ message: "Reordered" });
  } catch (err) {
    if (err.message === "Order must be an array") {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};