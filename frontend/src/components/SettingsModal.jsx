import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import Modal from "./Modal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";
import TimePicker from "./TimePicker.jsx";

export default function SettingsModal({ open, onClose }) {
  const { user, updateSettings } = useAuth();
  const [loading, setLoading] = useState(false);
  const [localReminderTime, setLocalReminderTime] = useState(null);
  
  const reminderTime = localReminderTime !== null ? localReminderTime : (user?.reminderTime || "08:00");
  
  // We read Notification.permission during render initialization
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => !!(user?.pushSubscription && typeof Notification !== "undefined" && Notification.permission === "granted")
  );

  useEffect(() => {
    if (user?.pushSubscription && typeof Notification !== "undefined" && Notification.permission === "granted") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotificationsEnabled(true);
    }
  }, [user?.pushSubscription]);

  const urlBase64ToUint8Array = (base64String) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPush = async () => {
    try {
      setLoading(true);
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        alert("Push notifications are not supported by your browser.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("Permission denied for push notifications");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        const res = await api.get("/auth/vapid-public-key");
        const publicKey = res.data.publicKey;
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        });
      }

      await api.post("/auth/push-subscription", subscription);
      setNotificationsEnabled(true);
      updateSettings({ pushSubscription: subscription });
    } catch (err) {
      console.error("Failed to subscribe to push notifications", err);
      alert("Error enabling notifications");
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      setLoading(true);
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
      await api.delete("/auth/push-subscription");
      setNotificationsEnabled(false);
      updateSettings({ pushSubscription: null });
    } catch (err) {
      console.error("Failed to unsubscribe", err);
      alert("Error disabling notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateSettings({ reminderTime });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Settings" maxWidth="max-w-md">
      <div className="space-y-6 animate-fade-in">
        
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-2">
            <Bell size={14} />
            Notifications
          </h3>
          
          <div className="p-5 rounded-2xl glass border border-[var(--surface-border)] shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-base">Web Push Reminders</div>
                <div className="text-sm text-soft mt-0.5 leading-relaxed">
                  Get a gentle nudge if you have pending habits.
                </div>
              </div>
              
              <button
                type="button"
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                  notificationsEnabled ? "bg-brand-500 shadow-md shadow-brand-500/30" : "bg-gray-300 dark:bg-gray-700"
                }`}
                onClick={notificationsEnabled ? unsubscribeFromPush : subscribeToPush}
                disabled={loading}
              >
                <span className="sr-only">Toggle notifications</span>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    notificationsEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            
            <div className="mt-5 pt-5 border-t divider">
              <label className="block text-sm font-semibold mb-2 text-brand-900 dark:text-brand-100">
                Daily Reminder Time
              </label>
              <div className="relative overflow-hidden rounded-xl glass border border-[var(--surface-border)] shadow-inner group focus-within:ring-2 focus-within:ring-brand-500 transition-all mt-1">
                <div className="absolute inset-0 bg-brand-500/5 pointer-events-none group-hover:bg-brand-500/10 transition-colors" />
                <TimePicker
                  value={reminderTime}
                  onChange={setLocalReminderTime}
                />
              </div>
              <p className="text-xs text-muted mt-2.5 leading-relaxed">
                We'll only notify you if you haven't checked off your habits by this time. No spam, just a gentle reminder.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button className="btn-secondary px-5" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn-primary px-6" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save settings"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
