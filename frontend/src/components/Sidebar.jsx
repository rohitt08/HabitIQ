import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ListChecks,
  CalendarDays,
  Brain,
  BarChart3,
  LogOut,
  Settings,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import Modal from "./Modal.jsx";
import api from "../api/axios.js";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/habits", label: "Habits", icon: ListChecks },
  { to: "/weekly", label: "Weekly", icon: CalendarDays },
  { to: "/insights", label: "Insights", icon: Brain },
  { to: "/stats", label: "Statistics", icon: BarChart3 },
];

export default function Sidebar() {
  const { user, logout, updateUser } = useAuth();
  const { theme, toggle } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [morning, setMorning] = useState(user?.morningMotivation || false);
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [reminderTime, setReminderTime] = useState(user?.reminderTime || "08:00");
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.pushSubscription && Notification.permission === "granted"
  );

  useEffect(() => {
    const handle = () => setSettingsOpen(true);
    window.addEventListener("open-settings", handle);
    return () => window.removeEventListener("open-settings", handle);
  }, []);

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
      setSaving(true);
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
      setSaving(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await api.put("/auth/profile", {
        name,
        morningMotivation: morning,
      });
      await api.put("/auth/settings", { reminderTime });
      
      const updatedUser = { ...res.data.user, reminderTime };
      updateUser(updatedUser);
      setSettingsOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <aside className="hidden md:flex md:flex-col w-64 fixed inset-y-0 left-0 z-30 glass border-r">
      <div className="px-6 py-5 border-b divider">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Sparkles size={18} />
          </div>
          <div className="font-semibold text-lg tracking-tight">HabitIQ</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive
                ? "bg-gradient-to-r from-brand-500/15 to-brand-500/5 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500/20"
                : "text-soft hover:bg-[var(--surface-hover)]"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t divider space-y-1">
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-soft hover:bg-[var(--surface-hover)] transition"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>

        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-soft hover:bg-[var(--surface-hover)] transition"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings size={18} />
          Settings
        </button>

        <div className="px-2 py-2 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white font-semibold flex items-center justify-center shadow-md shadow-brand-500/30">
            {user?.avatar || user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.name}</div>
            {user?.userTag && (
              <div className="text-[10px] text-brand-500 font-mono tracking-wider">
                {user.userTag}
              </div>
            )}
            <div className="text-xs text-faint truncate">{user?.email}</div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-2 rounded-lg text-soft hover:bg-[var(--surface-hover)]"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Settings"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Display name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="pt-2 border-t divider" />
          <label className="flex items-start gap-3 p-3 rounded-xl glass cursor-pointer hover:bg-[var(--surface-hover)]">
            <input
              type="checkbox"
              checked={morning}
              onChange={(e) => setMorning(e.target.checked)}
              className="mt-1 accent-brand-600"
            />
            <div>
              <div className="text-sm font-medium">Morning motivation</div>
              <div className="text-xs text-faint">
                Show a short personalised AI message every morning on the
                dashboard.
              </div>
            </div>
          </label>

          <div className="pt-2 border-t divider" />
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Web Push Notifications</div>
              <button
                type="button"
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  notificationsEnabled ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-700"
                }`}
                onClick={notificationsEnabled ? () => {} : subscribeToPush}
                disabled={saving || notificationsEnabled}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    notificationsEnabled ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <div className="text-xs text-faint mb-3">
              Enable notifications to get a reminder if you have pending habits.
            </div>
            
            <label className="label">Reminder Time</label>
            <input
              type="time"
              className="input"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
            />
          </div>

          <div className="sticky bottom-0 bg-[var(--bg-base)] dark:bg-[var(--surface)] -mx-6 px-6 py-4 border-t divider mt-6 z-10 flex justify-end gap-2">
            <button
              className="btn-secondary"
              onClick={() => setSettingsOpen(false)}
            >
              Cancel
            </button>
            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Modal>
    </aside>
  );
}
