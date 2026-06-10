import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ListChecks,
  CalendarDays,
  Brain,
  Sparkles,
  LogOut,
  Settings,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

export default function MobileNav() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  return (
    <>
      <div className="md:hidden sticky top-0 z-20 bg-[var(--bg-base)] dark:bg-black/90 glass border-b divider px-4 py-3 flex items-center justify-between shadow-[0_4px_24px_rgba(0,0,0,0.05)]">
        <NavLink to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center shadow-md shadow-brand-500/30">
            <Sparkles size={16} />
          </div>
          <div className="font-semibold">HabitIQ</div>
        </NavLink>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="p-2 rounded-lg text-soft hover:bg-[var(--surface-hover)]"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={() => window.dispatchEvent(new Event("open-settings"))}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white text-sm font-semibold flex items-center justify-center shadow-md shadow-brand-500/30 overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.avatar || user?.name?.charAt(0).toUpperCase() || "U"
              )}
            </div>
          </button>
          <button
            onClick={() => window.dispatchEvent(new Event("open-settings"))}
            className="p-2 rounded-lg text-soft hover:bg-[var(--surface-hover)]"
            aria-label="Settings"
          >
            <Settings size={16} />
          </button>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-soft hover:bg-[var(--surface-hover)]"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-[var(--bg-base)] dark:bg-black/90 glass border-t divider flex justify-around pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">
        {[
          { to: "/dashboard", label: "Home", icon: LayoutDashboard },
          { to: "/habits", label: "Habits", icon: ListChecks },
          { to: "/weekly", label: "Weekly", icon: CalendarDays },
          { to: "/insights", label: "Insights", icon: Brain },
        ].map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg text-xs transition-all duration-300 ease-out active:scale-95 ${isActive
                ? "text-brand-700 dark:text-brand-300 font-semibold"
                : "text-faint hover:text-soft"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
