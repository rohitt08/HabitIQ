import cron from "node-cron";
import webpush from "web-push";
import User from "../models/user.js";
import habitRepository from "../repositories/habitRepository.js";
import habitLogRepository from "../repositories/habitLogRepository.js";
import { todayKey, getISTDate } from "../utils/dateHelpers.js";

const publicVapidKey = process.env.VAPID_PUBLIC_KEY || "BL7jXBI0e9GRORf3BgPd4fbwElOr1am9bsuQyKB3JUUX0BDfjTjQR-2c2iOzMWzXHky6IuzM16faktGQqcNMxWg";
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || "F2F_0_oKsURPBQ9LD9_IVg0qHqfjaT2o3XrrqS7Wo74";

webpush.setVapidDetails("mailto:test@example.com", publicVapidKey, privateVapidKey);

const morningMessages = [
  "Wakey wakey! ☀️ Your habits are missing you. Let's crush today!",
  "Coffee? ☕ Checked. Habits? Let's get 'em done!",
  "A new day, a new streak! 🚀 Time to level up.",
  "Your future self is watching. Make them proud today! 👑",
  "Don't let your streaks ghost you! 👻 Jump in now."
];

const eveningMessages = [
  "Dinner is eaten, but your habits are starving! 🥺 You have {count} habits left today.",
  "The sun's going down, but your streaks don't have to! 🌅 {count} habits waiting.",
  "Knock knock! Who's there? It's {count} pending habits. Open the app! 🚪",
  "Your bed is calling, but {count} habits are calling louder! 🛏️",
  "Finish strong! 💪 Only {count} habits left before midnight strikes."
];

const getRandomMessage = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const startCronJobs = () => {
  // Run every minute, explicitly locked to Indian Standard Time
  cron.schedule("* * * * *", async () => {
    try {
      const now = getISTDate();
      // Current time in HH:mm format
      const currentHHMM = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
      const isMorningPushTime = currentHHMM === "09:00"; // 9 AM Morning Kickstart

      const usersToRemind = await User.find({
        pushSubscription: { $ne: null },
        $or: [
          { reminderTime: currentHHMM },
          ...(isMorningPushTime ? [{}] : []) // If it's 9 AM, fetch ALL users with pushSubscription
        ]
      });

      for (const user of usersToRemind) {
        // If it's 9 AM but the user's reminder time is also 9 AM, we don't want to send 2 pushes.
        // We will send the Evening (pending count) message if it's their specific reminder time.
        // Otherwise, send the morning kickstart.
        const isUsersReminderTime = user.reminderTime === currentHHMM;
        
        // At 9 AM, if it's NOT their chosen reminder time, it's the morning kickstart.
        const isMorningKickstart = isMorningPushTime && !isUsersReminderTime;

        // Fetch user's active habits
        const habits = await habitRepository.findByUserId(user._id, false);
        if (habits.length === 0) continue;

        const logs = await habitLogRepository.findByUserIdAndDate(user._id, todayKey());
        const completedHabitIds = logs.map(l => l.habitId.toString());

        const pending = habits.filter(h => !completedHabitIds.includes(h._id.toString()));

        // If they have no pending habits, don't bother them!
        if (pending.length === 0) continue;

        let title = "HabitIQ";
        let body = "";

        if (isMorningKickstart) {
          title = "Rise & Shine! 🌅";
          body = getRandomMessage(morningMessages);
        } else if (isUsersReminderTime) {
          title = "Habit Check! 👀";
          body = getRandomMessage(eveningMessages).replace("{count}", pending.length);
        } else {
          // Fallback just in case
          continue;
        }

        const payload = JSON.stringify({
          title,
          body,
          url: "/dashboard",
          actions: [
            { action: "open_app", title: "Let's do this! 💪" },
            { action: "snooze", title: "Remind me later 💤" }
          ]
        });

        try {
          await webpush.sendNotification(user.pushSubscription, payload);
        } catch (err) {
          console.error("Error sending push to user", user._id, err);
          // If subscription is invalid/expired, remove it
          if (err.statusCode === 410 || err.statusCode === 404) {
            user.pushSubscription = null;
            await user.save();
          }
        }
      }
    } catch (error) {
      console.error("Cron job error:", error);
    }
  }, {
    timezone: "Asia/Kolkata"
  });
};
