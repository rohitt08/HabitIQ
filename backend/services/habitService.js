import habitRepository from "../repositories/habitRepository.js";
import habitLogRepository from "../repositories/habitLogRepository.js";

class HabitService {
  async getHabits(userId, includeArchived) {
    return await habitRepository.findByUserId(userId, includeArchived === "true");
  }

  async createHabit(userId, habitData) {
    if (!habitData.name) {
      throw new Error("Habit name is required");
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
    const habit = await habitRepository.deleteByIdAndUserId(id, userId);
    if (!habit) throw new Error("Habit not found");

    await habitLogRepository.deleteByHabitIdAndUserId(habit._id, userId);
    return true;
  }

  async archiveHabit(id, userId) {
    const habit = await habitRepository.findByIdAndUserId(id, userId);
    if (!habit) throw new Error("Habit not found");

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
