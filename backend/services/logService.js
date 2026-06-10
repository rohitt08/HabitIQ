import habitLogRepository from "../repositories/habitLogRepository.js";
import habitRepository from "../repositories/habitRepository.js";
import userRepository from "../repositories/userRepository.js";
import { todayKey, last90Days, lastNDays, calcStreak, isValidLogDate } from "../utils/dateHelpers.js";

const BADGES = [
  { id: "FIRST_STEP", xpRange: [0, 100], reqHabits: 10, reqStreak: 0, floor: 0 },
  { id: "EXPLORER", xpRange: [100, 200], reqHabits: 0, reqStreak: 7, floor: 100 },
  { id: "ACHIEVER", xpRange: [200, 400], reqHabits: 70, reqStreak: 14, floor: 200 },
  { id: "GUARDIAN", xpRange: [400, 700], reqHabits: 150, reqStreak: 30, floor: 400 },
  { id: "ELITE", xpRange: [700, 1000], reqHabits: 250, reqStreak: 60, floor: 700 },
  { id: "TITAN", xpRange: [1000, 1500], reqHabits: 500, reqStreak: 90, floor: 1000 },
  { id: "LEGEND", xpRange: [1500, Infinity], reqHabits: 1000, reqStreak: 180, floor: 1500 }
];

class LogService {
  async markComplete(userId, habitId, date) {
    const completedDate = date || todayKey();

    if (!isValidLogDate(completedDate)) {
      throw new Error("Invalid date for logging");
    }

    const habit = await habitRepository.findByIdAndUserId(habitId, userId);
    if (!habit) {
      throw new Error("Habit not found");
    }

    const existingLog = await habitLogRepository.findByUserIdHabitIdAndDate(userId, habitId, completedDate);

    const log = await habitLogRepository.upsertLog(userId, habitId, completedDate);
    
    if (!log.isRewarded) {
      const user = await userRepository.findById(userId);
      const today = todayKey();

      if (!user.badges) user.badges = [];
      if (!user.challengeFailures) user.challengeFailures = 0;
      if (!user.totalCompletedHabits) user.totalCompletedHabits = 0;

      log.isRewarded = true;
      await log.save();

      user.points += 5;
        user.totalCompletedHabits += 1;

        // Streak Check for this habit
        const logs = await habitLogRepository.findByUserIdAndHabitId(userId, habitId);
        const dateKeys = logs.map((l) => l.completedDate);
        const { current } = calcStreak(dateKeys);

        // Challenge Failure Penalty (If streak breaks)
        if (current === 1 && logs.length > 1) {
          let penaltyBadge = null;
          for (const b of BADGES) {
            if (user.points >= b.xpRange[0] && user.points < b.xpRange[1] && !user.badges.includes(b.id)) {
              penaltyBadge = b;
              break;
            }
          }
          if (penaltyBadge && !["FIRST_STEP", "EXPLORER"].includes(penaltyBadge.id)) {
            user.challengeFailures += 1;
            const penalty = user.challengeFailures === 1 ? 25 : user.challengeFailures === 2 ? 50 : 75;
            user.points -= penalty;
          }
        }

        // Streak Rewards
        if (current === 7) user.points += 25;
        if (current === 30) user.points += 100;
        if (current === 90) user.points += 200;
        if (current === 180) user.points += 500;

        // Max Global Streak for Badges
        const aggregated = await habitLogRepository.aggregateLogs([
          { $match: { userId } },
          { $group: { _id: "$habitId", dates: { $push: "$completedDate" } } },
        ]);
        let maxCurrentStreak = current;
        for (const agg of aggregated) {
          const st = calcStreak(agg.dates).current;
          if (st > maxCurrentStreak) maxCurrentStreak = st;
        }

        // Check Badges
        for (const b of BADGES) {
          if (!user.badges.includes(b.id)) {
            if (user.points >= b.xpRange[0] && user.totalCompletedHabits >= b.reqHabits && maxCurrentStreak >= b.reqStreak) {
              user.badges.push(b.id);
              user.challengeFailures = 0; // Reset failures on successful challenge
            }
          }
        }

        // Enforce XP Floor (Badge Protection System)
        let maxFloor = 0;
        for (const unlocked of user.badges) {
          const def = BADGES.find(x => x.id === unlocked);
          if (def && def.floor > maxFloor) maxFloor = def.floor;
        }
        user.points = Math.max(maxFloor, user.points);

        user.level = Math.floor(user.points / 100) + 1;
        await userRepository.save(user);

        try {
          const { getIo } = await import("../socket.js");
          getIo().emit("leaderboard_update");
        } catch (e) {
          console.error("Socket emit failed", e.message);
        }
    }
    
    return log;
  }

  async unmarkComplete(userId, habitId, date) {
    const completedDate = date || todayKey();

    if (!isValidLogDate(completedDate)) {
      throw new Error("Invalid date for logging");
    }

    const result = await habitLogRepository.deleteLog(userId, habitId, completedDate);
    
    // XP is NO LONGER deducted when uncompleting a habit.
    
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
    })).filter(d => d.count > 0);
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
