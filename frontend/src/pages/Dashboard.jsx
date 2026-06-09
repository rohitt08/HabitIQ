import { useEffect, useMemo, useState, useRef } from "react";
import { Plus, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../api/axios.js";
import Modal from "../components/Modal.jsx";
import HabitForm from "../components/HabitForm.jsx";
import TodayHabitCard from "../components/TodayHabitCard.jsx";
import Leaderboard from "../components/Leaderboard.jsx";
import HeatmapChart from "../components/HeatmapChart.jsx";
import SummaryCards from "../components/SummaryCards.jsx";
import AIWeeklyReport from "../components/AIWeeklyReport.jsx";
import MorningMotivation from "../components/MorningMotivation.jsx";
import HabitSuggestionModal from "../components/HabitSuggestionModal.jsx";
import StreakRecoveryCard from "../components/StreakRecoveryCard.jsx";
import ProgressRing from "../components/ProgressRing.jsx";
import { celebrate, celebrateBig } from "../utils/confetti.js";
import { getISTDate, todayKey, toKey, shortDate } from "../utils/dateHelpers.js";
import { subDays } from "date-fns";
import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [viewDate, setViewDate] = useState(todayKey());
  const [todayLogs, setTodayLogs] = useState([]);
  const [weekLogs, setWeekLogs] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [streaksById, setStreaksById] = useState({});
  const [loading, setLoading] = useState(true);
  const [fetchingDay, setFetchingDay] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [suggestOpen, setSuggestOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [recoveryHabit, setRecoveryHabit] = useState(null);
  const [maxHabitsError, setMaxHabitsError] = useState(false);
  const [restrictedActionMessage, setRestrictedActionMessage] = useState("");

  const loadAll = async () => {
    if (habits.length === 0) {
      setLoading(true);
    } else {
      setFetchingDay(true);
    }
    try {
      const week = [...Array(7)].map((_, i) => toKey(subDays(new Date(viewDate), 6 - i)));
      const start = week[0];
      const end = week[week.length - 1];

      const [habitsRes, todayRes, rangeRes, heatRes, streaksRes] = await Promise.all([
        api.get("/habits"),
        api.get("/logs/today", { params: { date: viewDate } }),
        api.get("/logs/range", { params: { start, end } }),
        api.get("/logs/heatmap", { params: { endDate: todayKey() } }),
        api.get("/logs/dashboard-streaks"),
      ]);

      setHabits(habitsRes.data);
      setTodayLogs(todayRes.data);
      setWeekLogs(rangeRes.data);
      setHeatmap(heatRes.data);
      setStreaksById(streaksRes.data);
    } finally {
      setLoading(false);
      setFetchingDay(false);
    }
  };

  const hasSuggested = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
  }, [viewDate]);

  useEffect(() => {
    if (!loading && habits.length === 0 && !hasSuggested.current) {
      setSuggestOpen(true);
      hasSuggested.current = true;
    }
  }, [loading, habits.length]);

  const lastToday = useRef(todayKey());

  // Auto-refresh for midnight rollover
  useEffect(() => {
    const interval = setInterval(() => {
      const currentToday = todayKey();
      
      // If the actual 'today' has changed (e.g. crossed midnight or user changed clock)
      if (currentToday !== lastToday.current) {
        // Only force the viewDate to update if the user was actually viewing the "old" today.
        // If they were looking at some past date deliberately, leave them alone.
        if (viewDate === lastToday.current) {
          setViewDate(currentToday);
        }
        lastToday.current = currentToday;
      }
    }, 2000); // Check every 2 seconds so it's super responsive to system clock changes
    return () => clearInterval(interval);
  }, [viewDate]);

  const completedToday = useMemo(
    () => new Set(todayLogs.map((l) => String(l.habitId))),
    [todayLogs]
  );

  const weekLogsByHabit = useMemo(() => {
    const out = {};
    for (const l of weekLogs) {
      if (!out[l.habitId]) out[l.habitId] = [];
      out[l.habitId].push(l.completedDate);
    }
    return out;
  }, [weekLogs]);



  const visibleHabits = useMemo(() => {
    return habits.filter((h) => {
      const createdDate = h.createdAt ? getISTDate(h.createdAt) : getISTDate();
      return toKey(createdDate) <= viewDate;
    });
  }, [habits, viewDate]);

  const todayProgress = visibleHabits.length
    ? Math.round((completedToday.size / visibleHabits.length) * 100)
    : 0;

  const activeStreaks = Object.values(streaksById).filter(
    (s) => s.current > 0
  ).length;
  const bestStreak = Math.max(
    0,
    ...Object.values(streaksById).map((s) => s.longest)
  );

  const weekTotal = habits.length * 7;
  const weekDone = Object.values(weekLogsByHabit).reduce(
    (s, arr) => s + arr.length,
    0
  );
  const weekRate = weekTotal ? Math.round((weekDone / weekTotal) * 100) : 0;

  // Recovery candidates — habits whose longest streak was >= 7 and current is 0
  useEffect(() => {
    if (recoveryHabit) return;
    if (!habits.length) return;
    const dismissed = JSON.parse(
      localStorage.getItem("recovery-dismissed") || "{}"
    );
    for (const h of habits) {
      const s = streaksById[h._id];
      if (!s) continue;
      if (s.longest >= 7 && s.current === 0 && !dismissed[h._id]) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRecoveryHabit(h);
        return;
      }
    }
  }, [habits, streaksById, recoveryHabit]);

  const toggle = async (habit) => {
    const done = completedToday.has(String(habit._id));
    const isToday = viewDate === todayKey();
    if (done) {
      return; // Locked for the day
    } else {
      // Optimistic update
      // eslint-disable-next-line react-hooks/purity
      const tempLog = { _id: "temp-" + Date.now(), habitId: habit._id, completedDate: viewDate };
      setTodayLogs((logs) => [...logs, tempLog]);
      setStreaksById((prev) => {
        const s = prev[habit._id] || { current: 0, longest: 0 };
        const nextCur = s.current + 1;
        return { 
          ...prev, 
          [habit._id]: { current: nextCur, longest: Math.max(s.longest, nextCur) } 
        };
      });
      
      celebrate();
      setTimeout(() => {
        const nextDone = completedToday.size + 1; // It was incremented optimistically
        if (nextDone >= visibleHabits.length && visibleHabits.length > 0) {
          celebrateBig();
        }
      }, 150);

      try {
        const res = await api.post("/logs", { habitId: habit._id, date: viewDate });
        // Replace temp log with real log
        setTodayLogs((logs) => logs.map(l => l._id === tempLog._id ? res.data : l));
      } catch (err) {
        console.error("Failed to add log", err);
        loadAll(); // Revert on error
      }
    }
  };

  const saveHabit = async (data) => {
    setSubmitting(true);
    try {
      if (editing) {
        const res = await api.put(`/habits/${editing._id}`, data);
        setHabits((hs) => hs.map((h) => (h._id === res.data._id ? res.data : h)));
      } else {
        const res = await api.post("/habits", data);
        setHabits((hs) => [...hs, res.data]);
        setStreaksById((p) => ({ ...p, [res.data._id]: { current: 0, longest: 0 } }));
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      if (err.response?.data?.message === "Maximum 7 active habits allowed") {
        setMaxHabitsError(true);
      } else if (err.response?.data?.message) {
        alert(err.response.data.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const deleteHabit = async (habit) => {
    try {
      await api.delete(`/habits/${habit._id}`);
      setHabits((hs) => hs.filter((h) => h._id !== habit._id));
      setTodayLogs((ls) =>
        ls.filter((l) => String(l.habitId) !== String(habit._id))
      );
      setStreaksById((prev) => {
        const next = { ...prev };
        delete next[habit._id];
        return next;
      });
      setDeleteTarget(null);
    } catch (err) {
      if (err.response?.data?.message) {
        alert(err.response.data.message);
      }
      setDeleteTarget(null);
    }
  };

  const archiveHabit = async (habit) => {
    try {
      const res = await api.put(`/habits/${habit._id}/archive`);
      if (res.data.isArchived)
        setHabits((hs) => hs.filter((h) => h._id !== habit._id));
      else setHabits((hs) => hs.map((h) => (h._id === res.data._id ? res.data : h)));
    } catch (err) {
      if (err.response?.data?.message) {
        alert(err.response.data.message);
      }
    }
  };

  const acceptSuggestion = async (s) => {
    try {
      const res = await api.post("/habits", {
        name: s.name,
        description: s.description,
        category: s.category,
        frequency: s.frequency,
        icon: s.icon,
        targetDays: s.frequency === "daily" ? 7 : 3,
      });
      setHabits((hs) => [...hs, res.data]);
      setStreaksById((p) => ({ ...p, [res.data._id]: { current: 0, longest: 0 } }));
    } catch (err) {
      if (err.response?.data?.message === "Maximum 7 active habits allowed") {
        setMaxHabitsError(true);
      } else if (err.response?.data?.message) {
        alert(err.response.data.message);
      }
    }
  };

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="h-10 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
        <div className="flex gap-2">
          <div className="hidden sm:block h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
        </div>
      </div>
      <div className="h-24 bg-gray-100 dark:bg-gray-800/50 rounded-2xl"></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800/50 rounded-2xl"></div>)}
      </div>
      <div className="h-64 bg-gray-100 dark:bg-gray-800/50 rounded-2xl mt-6"></div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full md:w-auto gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight truncate">
              Hey {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-sm text-muted mt-0.5 truncate">
              {getISTDate().toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex flex-col bg-indigo-50 dark:bg-indigo-900/30 px-3 py-2 md:px-4 md:py-2 rounded-xl border border-indigo-100 dark:border-indigo-800/50 shrink-0 w-full sm:w-auto">
            <div className="flex items-center justify-between gap-3 mb-1.5 whitespace-nowrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-indigo-700 dark:text-indigo-400">Level {user?.level || 1}</span>
                <span className="text-xs text-indigo-600 dark:text-indigo-300 font-medium">{user?.points || 0} pts</span>
              </div>
              {user?.badges?.length > 0 && (
                <div className="flex items-center gap-1 shrink-0">
                  {user.badges.includes("FIRST_HABIT") && <span title="Starter" className="text-sm leading-none shrink-0">🌟</span>}
                  {user.badges.includes("STREAK_7") && <span title="Week Warrior" className="text-sm leading-none shrink-0">🔥</span>}
                  {user.badges.includes("LEVEL_5") && <span title="Rising Star" className="text-sm leading-none shrink-0">⭐</span>}
                </div>
              )}
            </div>
            <div className="w-full sm:w-48 h-2 bg-indigo-200 dark:bg-indigo-950 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                style={{ width: `${(user?.points || 0) % 100}%` }}
              />
            </div>
          </div>
        </div>
        {viewDate === todayKey() && (
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            <button
              className="btn-secondary flex-1 md:flex-none justify-center"
              onClick={() => setSuggestOpen(true)}
            >
              <Sparkles size={14} />
              <span className="inline">Suggest a habit</span>
            </button>
            <button
              className="btn-primary flex-1 md:flex-none justify-center"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus size={14} />
              New habit
            </button>
          </div>
        )}
      </div>

      {user?.dailyXp >= 14 && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <h3 className="font-bold flex items-center gap-2">🎉 Daily XP Limit Reached</h3>
            <p className="text-sm opacity-90 mt-0.5">You've earned the maximum XP for today. Keep building your streak!</p>
          </div>
        </div>
      )}

      <MorningMotivation />

      {recoveryHabit && (
        <StreakRecoveryCard
          habit={recoveryHabit}
          onDismiss={() => {
            const dismissed = JSON.parse(
              localStorage.getItem("recovery-dismissed") || "{}"
            );
            dismissed[recoveryHabit._id] = Date.now();
            localStorage.setItem(
              "recovery-dismissed",
              JSON.stringify(dismissed)
            );
            setRecoveryHabit(null);
          }}
        />
      )}

      <SummaryCards
        totalHabits={habits.length}
        activeStreaks={activeStreaks}
        bestStreak={bestStreak}
        weekRate={weekRate}
      />

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-sm font-medium flex items-center gap-2 max-w-[200px] sm:max-w-md">
                <button 
                  onClick={() => setViewDate(toKey(subDays(new Date(viewDate), 1)))}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition shrink-0"
                >
                  <ChevronLeft size={16} />
                </button>
                <h2 className="text-lg sm:text-xl font-semibold truncate">
                  {viewDate === todayKey() ? "Today's habits" : viewDate === toKey(subDays(getISTDate(), 1)) ? "Yesterday's habits" : shortDate(new Date(viewDate))}
                </h2>
                <button 
                  onClick={() => setViewDate(toKey(subDays(new Date(viewDate), -1)))}
                  disabled={viewDate === todayKey()}
                  className={`p-1 rounded-md transition shrink-0 ${viewDate === todayKey() ? "opacity-30 cursor-not-allowed" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="text-xs text-muted">
                {completedToday.size} of {visibleHabits.length} complete
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <ProgressRing value={todayProgress} size={52} stroke={5} />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                {todayProgress}%
              </div>
            </div>
          </div>
        </div>

        {visibleHabits.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">🎯</div>
            <div className="font-medium">
              {viewDate === todayKey() ? "Let's build your first habit" : "No habits existed on this day"}
            </div>
            <div className="text-sm text-muted mt-1">
              {viewDate === todayKey() ? "Start small — something you can do in under 5 minutes." : "Habits you create today will appear here going forward."}
            </div>
            {viewDate === todayKey() && (
              <button
                className="btn-primary mt-4"
                onClick={() => setFormOpen(true)}
              >
                <Plus size={14} />
                Create habit
              </button>
            )}
          </div>
        ) : (
          <div className={`space-y-2 transition-opacity duration-200 ${fetchingDay ? "opacity-50 pointer-events-none" : ""}`}>
            {visibleHabits.map((h) => (
              <TodayHabitCard
                key={h._id}
                habit={h}
                completed={completedToday.has(String(h._id))}
                streak={streaksById[h._id]?.current || 0}
                onToggle={() => toggle(h)}
                onEdit={() => {
                  setEditing(h);
                  setFormOpen(true);
                }}
                onArchive={() => archiveHabit(h)}
                onDelete={() => setDeleteTarget(h)}
                onRestricted={(msg) => setRestrictedActionMessage(msg)}
              />
            ))}
          </div>
        )}
      </div>

      <AIWeeklyReport />

      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 min-w-0">
          <Leaderboard />
        </div>
        <div className="lg:col-span-4 min-w-0">
          <HeatmapChart data={heatmap} />
        </div>
      </div>

      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        title={editing ? "Edit habit" : "New habit"}
      >
        <HabitForm
          initial={editing}
          submitting={submitting}
          onCancel={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSubmit={saveHabit}
        />
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete habit?"
        maxWidth="max-w-sm"
      >
        <p className="text-sm text-soft">
          This will permanently delete <b>{deleteTarget?.name}</b> and all its
          history. This can't be undone.
        </p>
        <div className="flex justify-end gap-2 mt-5">
          <button
            className="btn-secondary"
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 px-4 py-2.5 text-sm font-medium text-white hover:brightness-110 shadow-lg shadow-rose-500/30 transition"
            onClick={() => deleteHabit(deleteTarget)}
          >
            Delete
          </button>
        </div>
      </Modal>

      <HabitSuggestionModal
        open={suggestOpen}
        onClose={() => setSuggestOpen(false)}
        onAccept={acceptSuggestion}
      />

      <Modal
        open={maxHabitsError}
        onClose={() => setMaxHabitsError(false)}
        title="Habit Limit Reached"
        maxWidth="max-w-sm"
      >
        <div className="text-center pb-2">
          <div className="text-4xl mb-4">🧘</div>
          <h3 className="font-semibold text-lg mb-2">Keep your focus sharp</h3>
          <p className="text-sm text-soft">
            You've reached the maximum of <strong>7 active habits</strong>. Science shows that focusing on fewer habits leads to better consistency.
          </p>
          <p className="text-sm text-soft mt-3">
            To add a new habit, please delete or archive an uncompleted one first.
          </p>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            className="btn-primary w-full justify-center"
            onClick={() => setMaxHabitsError(false)}
          >
            Got it
          </button>
        </div>
      </Modal>

      <Modal
        open={!!restrictedActionMessage}
        onClose={() => setRestrictedActionMessage("")}
        title="Action Not Allowed"
        maxWidth="max-w-sm"
      >
        <div className="text-center pb-2">
          <div className="text-4xl mb-4">🛑</div>
          <h3 className="font-semibold text-lg mb-2">Wait a minute!</h3>
          <p className="text-sm text-soft">
            {restrictedActionMessage}
          </p>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            className="btn-primary w-full justify-center"
            onClick={() => setRestrictedActionMessage("")}
          >
            Got it
          </button>
        </div>
      </Modal>
    </div>
  );
}
