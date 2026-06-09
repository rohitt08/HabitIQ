import cron from "node-cron";
import webpush from "web-push";
import User from "../models/user.js";
import habitRepository from "../repositories/habitRepository.js";
import habitLogRepository from "../repositories/habitLogRepository.js";
import { todayKey } from "../utils/dateHelpers.js";

const publicVapidKey = process.env.VAPID_PUBLIC_KEY || "BL7jXBI0e9GRORf3BgPd4fbwElOr1am9bsuQyKB3JUUX0BDfjTjQR-2c2iOzMWzXHky6IuzM16faktGQqcNMxWg";
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || "F2F_0_oKsURPBQ9LD9_IVg0qHqfjaT2o3XrrqS7Wo74";

webpush.setVapidDetails("mailto:test@example.com", publicVapidKey, privateVapidKey);

export const startCronJobs = () => {
  // Run every hour at minute 0
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();
      // Current hour in HH:00 format (simple matching)
      const currentHour = now.getHours().toString().padStart(2, '0') + ":00";

      const usersToRemind = await User.find({
        pushSubscription: { $ne: null },
        reminderTime: currentHour,
      });

      for (const user of usersToRemind) {
        // Check if user has pending habits today
        const habits = await habitRepository.findByUserId(user._id, false);
        if (habits.length === 0) continue;

        const logs = await habitLogRepository.findByUserIdAndDate(user._id, todayKey());
        const completedHabitIds = logs.map(l => l.habitId.toString());

        const pending = habits.filter(h => !completedHabitIds.includes(h._id.toString()));

        if (pending.length > 0) {
          const payload = JSON.stringify({
            title: "HabitIQ Reminder",
            body: `You have ${pending.length} habit(s) left to complete today! Let's get it done!`,
            url: "/",
          });

          try {
            await webpush.sendNotification(user.pushSubscription, payload);
          } catch (err) {
            console.error("Error sending push to user", user._id, err);
            // If subscription is invalid/expired (status 410 or 404), we could remove it
            if (err.statusCode === 410 || err.statusCode === 404) {
              user.pushSubscription = null;
              await user.save();
            }
          }
        }
      }
    } catch (error) {
      console.error("Cron job error:", error);
    }
  });
};
