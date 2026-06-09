import habitRepository from "../repositories/habitRepository.js";
import habitLogRepository from "../repositories/habitLogRepository.js";
import aiInsightRepository from "../repositories/aiInsightRepository.js";
import { chatCompletion, SYSTEM_PROMPTS } from "../utils/aiService.js";
import { lastNDays, calcStreak, todayKey } from "../utils/dateHelpers.js";

class AIService {
  async buildWeeklyContext(userId) {
    const habits = await habitRepository.findByUserId(userId, false);
    const days = lastNDays(7);

    const logs = await habitLogRepository.findByUserIdAndDateRange(
      userId,
      days[0],
      days[days.length - 1]
    );

    const perHabit = habits.map((h) => {
      const completed = logs.filter((l) => String(l.habitId) === String(h._id)).length;
      return {
        name: h.name,
        category: h.category,
        frequency: h.frequency,
        completedDays: completed,
        targetDays: h.targetDays,
      };
    });

    return { days, perHabit };
  }

  async generateWeeklyReport(userId) {
    // Rate limit: 1 report per day
    const lastReport = await aiInsightRepository.findLatestByType(userId, "weekly");
    if (lastReport) {
      const hoursSince = (Date.now() - new Date(lastReport.createdAt)) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        return { content: lastReport.content };
      }
    }

    const ctx = await this.buildWeeklyContext(userId);

    if (!ctx.perHabit.length) {
      return {
        content: "You don't have any active habits yet. Create your first habit to start tracking — I'll generate a weekly report once you have some data.",
      };
    }

    const userMsg = `Here is the user's habit data for the past 7 days (${ctx.days[0]} to ${ctx.days[6]}):\n\n${ctx.perHabit
      .map(
        (h) =>
          `- ${h.name} (${h.category}, ${h.frequency}): completed ${h.completedDays} of the past 7 days, target ${h.targetDays}/week`
      )
      .join("\n")}"\n\nPlease write the personalised weekly report now.`;

    try {
      const { content, ok } = await chatCompletion({
        system: SYSTEM_PROMPTS.weekly,
        user: userMsg,
      });

      if (!ok) {
        return { content: "I'm currently taking a short break! Your weekly stats look great, keep up the good work. Please try generating your report again later." };
      }

      await aiInsightRepository.create({
        userId,
        type: "weekly",
        content,
      });

      return { content };
    } catch (err) {
      console.error("Weekly report error:", err);
      return { content: "I'm currently taking a short break! Your weekly stats look great, keep up the good work. Please try generating your report again later." };
    }
  }

  async suggestHabits(userId, goals, productiveTime, struggles) {
    const userMsg = `User goals: ${goals || "not provided"}\nMost productive time: ${productiveTime || "not provided"}\nPast Struggles: ${struggles || "not provided"}\n\nSuggest 3 personalised habits now. Return JSON only.`;

    const { content, ok } = await chatCompletion({
      system: SYSTEM_PROMPTS.suggestion,
      user: userMsg,
    });

    if (!ok) {
      throw new Error(content);
    }

    let suggestions = [];
    try {
      const match = content.match(/\{[\s\S]*\}/);
      const jsonStr = match ? match[0] : content;
      const parsed = JSON.parse(jsonStr);
      suggestions = parsed.suggestions || [];
    } catch {
      suggestions = [];
    }

    if (!suggestions.length) {
      suggestions = [
        {
          name: "10-minute morning walk",
          description: "Start the day with light movement and fresh air.",
          frequency: "daily",
          category: "Fitness",
          icon: "🚶",
          reason: "Low-friction way to build consistency early in the day.",
        },
        {
          name: "Read 5 pages",
          description: "Short daily reading to build a learning routine.",
          frequency: "daily",
          category: "Learning",
          icon: "📚",
          reason: "Compounds into significant knowledge over weeks.",
        },
        {
          name: "2 minutes of mindful breathing",
          description: "Pause and breathe to reset focus and reduce stress.",
          frequency: "daily",
          category: "Mindfulness",
          icon: "🧘",
          reason: "Tiny anchor habit that fits any schedule.",
        },
      ];
    }

    await aiInsightRepository.create({
      userId,
      type: "suggestion",
      content: JSON.stringify(suggestions),
      meta: { goals, productiveTime, struggles },
    });

    return { suggestions };
  }

  async generateRecoveryPlan(userId, habitId) {
    const habit = await habitRepository.findByIdAndUserId(habitId, userId);
    if (!habit) {
      throw new Error("Habit not found");
    }

    const logs = await habitLogRepository.findByUserIdAndHabitId(userId, habitId);
    const keys = logs.map((l) => l.completedDate);
    const { current, longest } = calcStreak(keys);

    const userMsg = `Habit: ${habit.name} (${habit.category}).\nDescription: ${habit.description || "none"}.\nCurrent streak: ${current} days.\nLongest streak: ${longest} days. The ser just broke a strek. Write a warm, actionable 3-day recovery plan.`;

    const { content, ok } = await chatCompletion({
      system: SYSTEM_PROMPTS.recovery,
      user: userMsg,
    });

    if (!ok) {
      throw new Error(content);
    }

    await aiInsightRepository.create({
      userId,
      type: "recovery",
      content,
      meta: { habitId },
    });

    return { content };
  }

  async analyzeChat(userId, question) {
    if (!question) {
      throw new Error("Question is required");
    }

    const habits = await habitRepository.findByUserId(userId, false);
    const days = lastNDays(30);
    const logs = await habitLogRepository.findByUserIdAndDateRange(
      userId,
      days[0],
      days[days.length - 1]
    );

    const context = habits
      .map((h) => {
        const hLogs = logs.filter((l) => String(l.habitId) === String(h._id));
        const byDow = [0, 0, 0, 0, 0, 0, 0];

        for (const l of hLogs) {
          const dow = new Date(l.completedDate).getDay();
          byDow[dow] += 1;
        }

        return `${h.name} (${h.category}): ${hLogs.length}/30 in last 30 days, by weekday [Sun,Mon,Tue,Wed,Thu,Fri,Sat] = ${JSON.stringify(byDow)}`;
      })
      .join("\n");

    const userMsg = `User question: "${question}"\n\nUser data (last 30 days):\n${context}\n\nAnswer now.`;

    const { content, ok } = await chatCompletion({
      system: SYSTEM_PROMPTS.chat,
      user: userMsg,
    });

    if (!ok) {
      throw new Error(content);
    }

    await aiInsightRepository.create({
      userId,
      type: "chat",
      content,
      meta: { question },
    });

    return { content };
  }

  async generateMorningMotivation(userId) {
    const habits = await habitRepository.findByUserId(userId, false);

    if (!habits.length) {
      return {
        content: "Good morning! Add your first habit today and let's get the momentum started.",
      };
    }

    const days = lastNDays(30);
    const logs = await habitLogRepository.findByUserIdAndDateRange(
      userId,
      days[0],
      days[days.length - 1]
    );

    const ctx = habits
      .map((h) => {
        const hLogs = logs
          .filter((l) => String(l.habitId) === String(h._id))
          .map((l) => l.completedDate)
          .sort()
          .reverse();
        const { current } = calcStreak(hLogs);
        return `${h.name}: current streak ${current}`;
      })
      .join("\n");

    const today = todayKey();
    const todayLogs = logs.filter((l) => l.completedDate === today);
    const done = todayLogs.length;
    const total = habits.length;

    const userMsg = `Today's habits and streaks:\n${ctx}\n\nDone today: ${done}/${total}. Write the morning message now.`;

    const { content, ok } = await chatCompletion({
      system: SYSTEM_PROMPTS.morning,
      user: userMsg,
      temperature: 0.8,
    });

    if (!ok) {
      throw new Error(content);
    }

    await aiInsightRepository.create({
      userId,
      type: "morning",
      content,
    });

    return { content };
  }

}

export default new AIService();
