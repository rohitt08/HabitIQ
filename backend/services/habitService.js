import habitRepository from "../repositories/habitRepository.js";
import habitLogRepository from "../repositories/habitLogRepository.js";
import { todayKey } from "../utils/dateHelpers.js";

class HabitService {
  async getHabits(userId, includeArchived) {
    return await habitRepository.findByUserId(userId, includeArchived === "true");
  }

  async createHabit(userId, habitData) {
    if (!habitData.name) {
      throw new Error("Habit name is required");
    }

    const activeCount = await habitRepository.countActiveByUserId(userId);
    if (activeCount >= 7) {
      throw new Error("Maximum 7 active habits allowed");
    }

    const count = await habitRepository.countByUserId(userId);
    
    // Extract only allowed fields to prevent mass assignment of sensitive fields like userId
    const { name, description, category, frequency, targetDays, color, icon } = habitData;

    const habit = await habitRepository.create({
      userId,
      name,
      description,
      category,
      frequency,
      targetDays,
      color,
      icon,
      order: count,
    });

    return habit;
  }

  async updateHabit(id, userId, updateData) {
    const habit = await habitRepository.findByIdAndUserId(id, userId);
    if (!habit) throw new Error("Habit not found");

    const fields = [
      "name",
      "description",
      "category",
      "frequency",
      "targetDays",
      "color",
      "icon",
      "order",
    ];

    for (const f of fields) {
      if (updateData[f] !== undefined) {
        habit[f] = updateData[f];
      }
    }

    return await habitRepository.save(habit);
  }

  async deleteHabit(id, userId) {
    const habit = await habitRepository.findByIdAndUserId(id, userId);
    if (!habit) throw new Error("Habit not found");

    const todayLog = await habitLogRepository.findByUserIdHabitIdAndDate(userId, id, todayKey());
    if (todayLog) {
      throw new Error("Cannot delete a habit after completing it today. Please wait until tomorrow.");
    }

    await habitRepository.deleteByIdAndUserId(id, userId);
    await habitLogRepository.deleteByHabitIdAndUserId(id, userId);
    return true;
  }

  async archiveHabit(id, userId) {
    const habit = await habitRepository.findByIdAndUserId(id, userId);
    if (!habit) throw new Error("Habit not found");

    if (!habit.isArchived) {
      const todayLog = await habitLogRepository.findByUserIdHabitIdAndDate(userId, id, todayKey());
      if (todayLog) {
        throw new Error("Cannot archive a habit after completing it today. Please wait until tomorrow.");
      }
    }

    habit.isArchived = !habit.isArchived;
    return await habitRepository.save(habit);
  }

  async reorderHabits(userId, order) {
    if (!Array.isArray(order)) {
      throw new Error("Order must be an array");
    }

    const bulkOps = order.map((id, idx) => ({
      updateOne: {
        filter: { _id: id, userId },
        update: { $set: { order: idx } },
      },
    }));

    if (bulkOps.length > 0) {
      await habitRepository.bulkWrite(bulkOps);
    }
  }
}

export default new HabitService();
