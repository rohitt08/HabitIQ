import Habit from "../models/habit.js";

class HabitRepository {
  async findByUserId(userId, includeArchived = true) {
    const filter = { userId };
    if (!includeArchived) {
      filter.isArchived = false;
    }
    return await Habit.find(filter).sort({ order: 1, createdAt: 1 });
  }

  async findByIdAndUserId(id, userId) {
    return await Habit.findOne({ _id: id, userId });
  }

  async countByUserId(userId) {
    return await Habit.countDocuments({ userId });
  }

  async create(data) {
    return await Habit.create(data);
  }

  async save(habit) {
    return await habit.save();
  }

  async deleteByIdAndUserId(id, userId) {
    return await Habit.findOneAndDelete({ _id: id, userId });
  }

  async bulkWrite(ops) {
    return await Habit.bulkWrite(ops);
  }
}

export default new HabitRepository();
