import HabitLog from "../models/habitlog.js";

class HabitLogRepository {
  async upsertLog(userId, habitId, completedDate) {
    return await HabitLog.findOneAndUpdate(
      { userId, habitId, completedDate },
      {
        $setOnInsert: { userId, habitId, completedDate },
      },
      { upsert: true, new: true }
    );
  }

  async deleteLog(userId, habitId, completedDate) {
    return await HabitLog.findOneAndDelete({ userId, habitId, completedDate });
  }

  async deleteByHabitIdAndUserId(habitId, userId) {
    return await HabitLog.deleteMany({ habitId, userId });
  }

  async findByUserIdAndDate(userId, completedDate) {
    return await HabitLog.find({ userId, completedDate });
  }

  async findByUserIdAndDateRange(userId, start, end) {
    return await HabitLog.find({
      userId,
      completedDate: { $gte: start, $lte: end },
    });
  }

  async findByUserIdAndHabitId(userId, habitId) {
    return await HabitLog.find({ userId, habitId }).sort({ completedDate: -1 });
  }

  async aggregateLogs(pipeline) {
    return await HabitLog.aggregate(pipeline);
  }
}

export default new HabitLogRepository();
