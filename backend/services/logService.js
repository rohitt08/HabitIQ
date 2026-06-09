import habitLogRepository from "../repositories/habitLogRepository.js";
import habitRepository from "../repositories/habitRepository.js";
import userRepository from "../repositories/userRepository.js";
import { todayKey, last90Days, lastNDays, calcStreak } from "../utils/dateHelpers.js";

class LogService {
  async markComplete(userId, habitId, date) {
    const completedDate = date || todayKey();

    const habit = await habitRepository.findByIdAndUserId(habitId, userId);
    if (!habit) {
      throw new Error("Habit not found");
    }

    const log = await habitLogRepository.upsertLog(userId, habitId, completedDate);
    
    // Add points for completing habit
    await userRepository.updatePointsAndLevel(userId, 10);
    
    return log;
  }

  async unmarkComplete(userId, habitId, date) {
    const completedDate = date || todayKey();
    const result = await habitLogRepository.deleteLog(userId, habitId, completedDate);
    
    // Deduct points for uncompleting
    await userRepository.updatePointsAndLevel(userId, -10);
    
    return result;
  }

  async getTodayLogs(userId, date) {
    return await habitLogRepository.findByUserIdAndDate(userId, date || todayKey());
  }

  async getRangeLogs(userId, start, end) {
    return await habitLogRepository.findByUserIdAndDateRange(userId, start, end);
  }

  async getHeatmap(userId, endDate) {
    const days = last90Days(endDate);

    const aggregatedLogs = await habitLogRepository.aggregateLogs([
      {
        $match: {
          userId,
          completedDate: {
            $gte: days[0],
            $lte: days[days.length - 1],
          },
        },
      },
      {
        $group: {
          _id: "$completedDate",
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = {};
    for (const agg of aggregatedLogs) {
      counts[agg._id] = agg.count;
    }

    return days.map((d) => ({
      date: d,
      count: counts[d] || 0,
    }));
  }

  async getHabitStats(userId, habitId) {
    const habit = await habitRepository.findByIdAndUserId(habitId, userId);
    if (!habit) {
      throw new Error("Habit not found");
    }

    const logs = await habitLogRepository.findByUserIdAndHabitId(userId, habit._id);
    const dateKeys = logs.map((l) => l.completedDate);
    const { current, longest } = calcStreak(dateKeys);

    const createdKey = habit.createdAt.toISOString().slice(0, 10);
    const start = new Date(createdKey);
    const end = new Date(todayKey());

    const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24))) + 1;
    const completionRate = Math.round((logs.length / totalDays) * 100);

    const monthly = {};
    for (const l of logs) {
      const m = l.completedDate.slice(0, 7);
      monthly[m] = (monthly[m] || 0) + 1;
    }

    return {
      habit,
      totalCompletions: logs.length,
      currentStreak: current,
      longestStreak: longest,
      completionRate,
      monthly,
    };
  }

  async getAllStats(userId) {
    const habits = await habitRepository.findByUserId(userId, false);
    const days = lastNDays(30);

    const aggregated = await habitLogRepository.aggregateLogs([
      {
        $match: {
          userId,
          completedDate: {
            $gte: days[0],
            $lte: days[days.length - 1],
          },
        },
      },
      {
        $group: {
          _id: "$habitId",
          dates: { $push: "$completedDate" },
          count: { $sum: 1 },
        },
      },
    ]);

    const statsMap = {};
    for (const agg of aggregated) {
      statsMap[agg._id.toString()] = agg;
    }

    const perHabit = habits.map((h) => {
      const agg = statsMap[h._id.toString()];
      const keys = agg ? agg.dates.sort().reverse() : [];
      const completions30d = agg ? agg.count : 0;

      const { current, longest } = calcStreak(keys);

      return {
        habitId: h._id,
        name: h.name,
        icon: h.icon,
        color: h.color,
        category: h.category,
        completions30d,
        currentStreak: current,
        longestStreak: longest,
      };
    });

    return { perHabit, days };
  }

  async getDashboardStreaks(userId) {
    const habits = await habitRepository.findByUserId(userId, false);
    const aggregated = await habitLogRepository.aggregateLogs([
      { $match: { userId } },
      { $group: { _id: "$habitId", dates: { $push: "$completedDate" } } },
    ]);

    const statsMap = {};
    for (const agg of aggregated) {
      statsMap[agg._id.toString()] = agg;
    }

    const streaksById = {};
    for (const h of habits) {
      const agg = statsMap[h._id.toString()];
      const keys = agg ? agg.dates.sort().reverse() : [];
      streaksById[h._id.toString()] = calcStreak(keys);
    }
    return streaksById;
  }
}

export default new LogService();
