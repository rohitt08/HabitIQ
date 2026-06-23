import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ListChecks,
  CalendarDays,
  Brain,
  LogOut,
  Settings,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthStore as useAuth } from "../store/authStore.js";
import { useTheme } from "../context/ThemeContext.jsx";
import Modal from "./Modal.jsx";
import api from "../api/axios.js";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/habits", label: "Habits", icon: ListChecks },
  { to: "/weekly", label: "Weekly", icon: CalendarDays },
  { to: "/insights", label: "Insights", icon: Brain },
];

export default function Sidebar() {
  const { user, logout, updateUser } = useAuth();
  const { theme, toggle } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [morning, setMorning] = useState(user?.morningMotivation || false);
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [reminderTime, setReminderTime] = useState(user?.reminderTime || "08:00");
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => typeof Notification !== "undefined" && !!user?.pushSubscription && Notification.permission === "granted"
  );
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || null);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

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
      updateUser({ ...user, pushSubscription: subscription });
    } catch (err) {
      console.error("Failed to subscribe to push notifications", err);
      alert("Error enabling notifications");
    } finally {
      setSaving(false);
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      setSaving(true);
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
      await api.delete("/auth/push-subscription");
      setNotificationsEnabled(false);
      updateUser({ ...user, pushSubscription: null });
    } catch (err) {
      console.error("Failed to unsubscribe", err);
      alert("Error disabling notifications");
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("morningMotivation", morning);
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const res = await api.put("/auth/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      await api.put("/auth/settings", { reminderTime });
      
      const updatedUser = { ...res.data.user, reminderTime };
      updateUser(updatedUser);
      setSettingsOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setSaving(true);
      await api.delete("/auth/me");
      logout();
    } catch (err) {
      console.error("Failed to delete account", err);
      alert("Failed to delete account. Please try again.");
      setSaving(false);
    }
  };

  return (
    <aside className="hidden md:flex md:flex-col w-64 fixed inset-y-0 left-0 z-30 glass border-r">
      <div className="px-6 py-5 border-b divider">
        <NavLink to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Sparkles size={18} />
          </div>
          <div className="font-semibold text-lg tracking-tight">HabitIQ</div>
        </NavLink>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ease-out active:scale-[0.98] ${isActive
                ? "bg-gradient-to-r from-brand-500/15 to-brand-500/5 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500/20 shadow-sm"
                : "text-soft hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
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

        <div className="mt-2 p-3 flex items-center gap-3 rounded-xl border border-orange-500/30 backdrop-blur-md bg-orange-500/5 dark:bg-orange-500/10 shadow-sm hover:shadow-md hover:border-orange-500/60 transition-all group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white font-semibold flex items-center justify-center shadow-md shadow-brand-500/30 overflow-hidden shrink-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user?.avatar || user?.name?.charAt(0).toUpperCase() || "U"
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate text-[var(--text)]">{user?.name}</div>
            {user?.userTag && (
              <div className="text-[10px] text-brand-500 font-mono tracking-wider truncate">
                #{user.userTag.replace(/^#/, "")}
              </div>
            )}
            <div className="text-[10px] text-faint truncate opacity-80">{user?.email}</div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-2 rounded-lg text-soft hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 transition-colors opacity-70 group-hover:opacity-100"
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
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white font-semibold flex items-center justify-center text-2xl shadow-md overflow-hidden shrink-0">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.avatar || user?.name?.charAt(0).toUpperCase() || "U"
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-6 h-6 bg-white dark:bg-gray-800 rounded-full shadow-md flex items-center justify-center cursor-pointer border border-gray-100 dark:border-gray-700" title="Upload Picture">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 dark:text-gray-300"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
            <div className="flex-1">
              <label className="label">Profile name</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
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
                onClick={notificationsEnabled ? unsubscribeFromPush : subscribeToPush}
                disabled={saving}
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

          <div className="pt-2 border-t divider" />
          
          <div className="flex flex-col gap-2 pt-2">
            <div className="text-sm font-medium text-rose-500">Danger Zone</div>
            <button
              onClick={() => {
                setSettingsOpen(false);
                setDeleteOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-500 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
            >
              Delete Account
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-6 mt-4 border-t divider">
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

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Account?"
        maxWidth="max-w-sm"
      >
        <p className="text-sm text-soft">
          This will permanently delete your account, all habits, logs, and insights. This action <b>cannot</b> be undone.
        </p>
        <div className="flex justify-end gap-2 mt-5">
          <button
            className="btn-secondary"
            onClick={() => setDeleteOpen(false)}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 px-4 py-2.5 text-sm font-medium text-white hover:brightness-110 shadow-lg shadow-rose-500/30 transition"
            onClick={handleDeleteAccount}
            disabled={saving}
          >
            {saving ? "Deleting..." : "Delete Permanently"}
          </button>
        </div>
      </Modal>
    </aside>
  );
}
