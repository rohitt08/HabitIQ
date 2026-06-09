import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Archive,
  Pencil,
  Trash2,
  Flame,
  Trophy,
  ArchiveRestore,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import api from "../api/axios.js";
import Modal from "../components/Modal.jsx";
import HabitForm from "../components/HabitForm.jsx";
import HabitSuggestionModal from "../components/HabitSuggestionModal.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { CATEGORIES } from "../utils/constants.js";
import { streakFromKeys } from "../utils/dateHelpers.js";
import { format, subDays } from "date-fns";
import { getISTDate } from "../utils/dateHelpers.js";

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [logsByHabit, setLogsByHabit] = useState({});
  const [loading, setLoading] = useState(true);

  const [showArchived, setShowArchived] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [maxHabitsError, setMaxHabitsError] = useState(false);
  const [restrictedActionMessage, setRestrictedActionMessage] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [habitsRes, rangeRes] = await Promise.all([
        api.get("/habits", { params: { includeArchived: "true" } }),
        api.get("/logs/range", {
          params: {
            start: format(subDays(getISTDate(), 89), "yyyy-MM-dd"),
            end: format(getISTDate(), "yyyy-MM-dd"),
          },
        }),
      ]);
      setHabits(habitsRes.data);
      const byId = {};
      for (const h of habitsRes.data) byId[h._id] = [];
      for (const l of rangeRes.data) {
        if (!byId[l.habitId]) byId[l.habitId] = [];
        byId[l.habitId].push(l.completedDate);
      }
      for (const k of Object.keys(byId)) byId[k] = byId[k].sort().reverse();
      setLogsByHabit(byId);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return habits.filter((h) => {
      if (!showArchived && h.isArchived) return false;
      if (showArchived && !h.isArchived) return false;
      if (category !== "All" && h.category !== category) return false;
      if (q && !h.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [habits, query, category, showArchived]);

  const activeCount = habits.filter((h) => !h.isArchived).length;
  const archivedCount = habits.filter((h) => h.isArchived).length;

  const save = async (data) => {
    setSubmitting(true);
    try {
      if (editing) {
        const res = await api.put(`/habits/${editing._id}`, data);
        setHabits((hs) => hs.map((h) => (h._id === res.data._id ? res.data : h)));
      } else {
        const res = await api.post("/habits", data);
        setHabits((hs) => [...hs, res.data]);
        setLogsByHabit((p) => ({ ...p, [res.data._id]: [] }));
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

  const archive = async (habit) => {
    try {
      const res = await api.put(`/habits/${habit._id}/archive`);
      setHabits((hs) => hs.map((h) => (h._id === res.data._id ? res.data : h)));
    } catch (err) {
      if (err.response?.data?.message) {
        alert(err.response.data.message);
      }
    }
  };

  const remove = async (habit) => {
    try {
      await api.delete(`/habits/${habit._id}`);
      setHabits((hs) => hs.filter((h) => h._id !== habit._id));
      setDeleteTarget(null);
    } catch (err) {
      if (err.response?.data?.message) {
        alert(err.response.data.message);
      }
      setDeleteTarget(null);
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
      setLogsByHabit((p) => ({ ...p, [res.data._id]: [] }));
    } catch (err) {
      if (err.response?.data?.message === "Maximum 7 active habits allowed") {
        setMaxHabitsError(true);
      } else if (err.response?.data?.message) {
        alert(err.response.data.message);
      }
    }
  };

  if (loading) return <LoadingSpinner full />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            All habits
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Manage every habit you've ever created.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-secondary"
            onClick={() => setSuggestOpen(true)}
          >
            <Sparkles size={14} />
            <span className="hidden sm:inline">Suggest</span>
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus size={14} />
            New habit
          </button>
        </div>
      </div>

      <div className="card p-4 relative z-20">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-soft pointer-events-none"
            />
            <input
              className="input pl-9"
              placeholder="Search habits..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          
          <div className="relative md:w-52 z-30">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="input flex justify-between items-center w-full text-left"
            >
              <span className={category === "All" ? "text-soft" : ""}>{category === "All" ? "All categories" : category}</span>
              <ChevronDown size={16} className={`text-faint transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>
            
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-0" onClick={() => setDropdownOpen(false)} />
                <div className="absolute top-full mt-2 w-full glass-strong rounded-xl shadow-xl z-10 overflow-hidden py-1 animate-fade-in border border-[var(--surface-border)]">
                  <button
                    onClick={() => {
                      setCategory("All");
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[var(--surface-hover)] ${
                      category === "All" 
                        ? "bg-brand-500/10 text-brand-700 dark:text-brand-300 font-medium" 
                        : "text-soft"
                    }`}
                  >
                    All categories
                  </button>
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setCategory(c);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[var(--surface-hover)] ${
                        category === c 
                          ? "bg-brand-500/10 text-brand-700 dark:text-brand-300 font-medium" 
                          : "text-soft"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="inline-flex rounded-xl glass overflow-hidden text-sm">
            <button
              onClick={() => setShowArchived(false)}
              className={`px-3.5 py-2.5 font-medium transition ${
                !showArchived
                  ? "bg-brand-500/15 text-brand-700 dark:text-brand-300"
                  : "text-soft hover:bg-[var(--surface-hover)]"
              }`}
            >
              Active · {activeCount}
            </button>
            <button
              onClick={() => setShowArchived(true)}
              className={`px-3.5 py-2.5 font-medium transition border-l divider ${
                showArchived
                  ? "bg-brand-500/15 text-brand-700 dark:text-brand-300"
                  : "text-soft hover:bg-[var(--surface-hover)]"
              }`}
            >
              Archived · {archivedCount}
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-5xl mb-3">{showArchived ? "🗂️" : "🎯"}</div>
          <div className="font-medium">
            {showArchived
              ? "Nothing archived"
              : habits.length === 0
              ? "No habits yet"
              : "No habits match your filter"}
          </div>
          <div className="text-sm text-muted mt-1">
            {showArchived
              ? "Archived habits keep their history but stay out of your daily list."
              : habits.length === 0
              ? "Start small — something you can do in under 5 minutes."
              : "Try clearing your search or category filter."}
          </div>
          {!showArchived && habits.length === 0 && (
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
        <div className="space-y-2">
          {filtered.map((h) => {
            const keys = logsByHabit[h._id] || [];
            const { current, longest } = streakFromKeys(keys);
            const isCompletedToday = keys.includes(format(getISTDate(), "yyyy-MM-dd"));

            const handleRestrictedAction = (action) => {
              if (isCompletedToday) {
                setRestrictedActionMessage("Oops, cannot modify now! You can modify or update your habit tomorrow.");
                return;
              }
              action();
            };

            return (
              <div
                key={h._id}
                className={`card p-4 flex items-center gap-4 ${
                  h.isArchived ? "opacity-70" : ""
                }`}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: `${h.color}26`, color: h.color }}
                >
                  {h.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-medium truncate">{h.name}</div>
                    <span className="chip">{h.category}</span>
                    <span className="chip">{h.frequency}</span>
                    {h.isArchived && (
                      <span className="chip bg-amber-500/15 text-amber-700 dark:text-amber-300">
                        Archived
                      </span>
                    )}
                  </div>
                  {h.description && (
                    <div className="text-sm text-muted truncate mt-0.5">
                      {h.description}
                    </div>
                  )}
                </div>

                <div className="hidden sm:flex items-center gap-4 text-sm">
                  <div
                    className="flex items-center gap-1"
                    title="Current streak"
                  >
                    <Flame
                      size={14}
                      className={current > 0 ? "text-orange-500" : "text-faint"}
                    />
                    <span className="font-medium">{current}</span>
                  </div>
                  <div
                    className="flex items-center gap-1"
                    title="Longest streak"
                  >
                    <Trophy size={14} className="text-amber-500" />
                    <span className="font-medium">{longest}</span>
                  </div>
                  <div className="text-muted text-xs hidden md:block">
                    {keys.length} total
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    className="btn-ghost p-2"
                    onClick={() => handleRestrictedAction(() => {
                      setEditing(h);
                      setFormOpen(true);
                    })}
                    title="Edit"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="btn-ghost p-2"
                    onClick={() => handleRestrictedAction(() => archive(h))}
                    title={h.isArchived ? "Unarchive" : "Archive"}
                  >
                    {h.isArchived ? (
                      <ArchiveRestore size={16} />
                    ) : (
                      <Archive size={16} />
                    )}
                  </button>
                  <button
                    className="btn-ghost p-2 text-rose-500 hover:bg-rose-500/10 hover:text-rose-400"
                    onClick={() => handleRestrictedAction(() => setDeleteTarget(h))}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
          onSubmit={save}
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
            onClick={() => remove(deleteTarget)}
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
