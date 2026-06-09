import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import Modal from "./Modal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";

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
    } catch (err) {
      console.error("Failed to subscribe to push notifications", err);
      alert("Error enabling notifications");
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
      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Reminders</h3>
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-indigo-500" />
                <span className="font-medium">Web Push Notifications</span>
              </div>
              <button
                type="button"
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notificationsEnabled ? "bg-indigo-500" : "bg-gray-300 dark:bg-gray-700"
                }`}
                onClick={notificationsEnabled ? () => {} : subscribeToPush}
                disabled={loading || notificationsEnabled}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationsEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                Reminder Time
              </label>
              <input
                type="time"
                className="input"
                value={reminderTime}
                onChange={(e) => setLocalReminderTime(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-2">
                We'll send you a reminder at this time if you have uncompleted habits.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
