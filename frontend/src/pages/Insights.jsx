import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  RefreshCw,
  Trophy,
  Flame,
  TrendingDown,
} from "lucide-react";
import { format, parseISO, subDays } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import api from "../api/axios.js";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import Markdown from "../components/Markdown.jsx";
import {
  weekKeysFor,
  getISTDate
} from "../utils/dateHelpers.js";
import { useTheme } from "../context/ThemeContext.jsx";
import HabitStatsCard from "../components/HabitStatsCard.jsx";
import MonthlyBarChart from "../components/MonthlyBarChart.jsx";
import CategoryPieChart from "../components/CategoryPieChart.jsx";

const REPORT_CACHE_KEY = (weekStart) => `weekly-report-${weekStart}`;

export default function Insights() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const grid = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,15,27,0.08)";
  const tick = isDark ? "#8a8aa0" : "#6b6b78";
  const tooltipStyle = {
    background: isDark ? "rgba(20,20,36,0.95)" : "rgba(255,255,255,0.95)",
    border: `1px solid ${grid}`,
    borderRadius: 12,
    fontSize: 12,
    color: isDark ? "#ebebf5" : "#13131b",
    backdropFilter: "blur(12px)",
  };

  const [stats, setStats] = useState(null);
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [report, setReport] = useState("");
  const [reportGeneratedAt, setReportGeneratedAt] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const thisWeek = useMemo(() => weekKeysFor(getISTDate()), []);
  const lastWeek = useMemo(
    () => weekKeysFor(subDays(getISTDate(), 7)),
    []
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const end = getISTDate();
        const start = subDays(end, 29); // fetch 30 days for Monthly chart

        const [habitsRes, logsRes, statsRes] = await Promise.all([
          api.get("/habits"),
          api.get("/logs/range", {
            params: {
              start: format(start, "yyyy-MM-dd"),
              end: format(end, "yyyy-MM-dd"),
            },
          }),
          api.get("/logs/stats"),
        ]);
        
        setHabits(habitsRes.data);
        setLogs(logsRes.data);
        setStats(statsRes.data);

        // try to load cached report for this week
        const cached = localStorage.getItem(REPORT_CACHE_KEY(thisWeek[0].key));
        if (cached) {
          try {
            const { content, generatedAt } = JSON.parse(cached);
            setReport(content);
            setReportGeneratedAt(new Date(generatedAt));
          } catch {
            localStorage.removeItem(REPORT_CACHE_KEY(thisWeek[0].key));
          }
        } else {
          // auto-generate on first visit this week
          generateReport();
        }
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateReport = async () => {
    setReportLoading(true);
    try {
      const res = await api.post("/ai/weekly-report");
      const now = getISTDate();
      setReportGeneratedAt(now);
      localStorage.setItem(
        REPORT_CACHE_KEY(thisWeek[0].key),
        JSON.stringify({ content: res.data.content, generatedAt: now })
      );
    } catch (err) {
      if (err.response?.status === 429) {
        setReport("🤖 Greetings! You have exhausted your AI responses for today. Please come back tomorrow for more!");
      } else {
        setReport("Failed to generate the report. Please try again.");
      }
    } finally {
      setReportLoading(false);
    }
  };

  // --- Aggregations ---

  // 1. This week vs Last week comparison
  const thisWeekKeys = useMemo(
    () => new Set(thisWeek.map((d) => d.key)),
    [thisWeek]
  );
  const thisWeekLogs = useMemo(
    () => logs.filter((l) => thisWeekKeys.has(l.completedDate)),
    [logs, thisWeekKeys]
  );
  const lastWeekLogs = useMemo(
    () => logs.filter((l) => !thisWeekKeys.has(l.completedDate)),
    [logs, thisWeekKeys]
  );

  const compareData = thisWeek.map((d, idx) => {
    const thisCount = thisWeekLogs.filter(
      (l) => l.completedDate === d.key
    ).length;
    const lastCount = lastWeekLogs.filter(
      (l) => l.completedDate === lastWeek[idx].key
    ).length;
    return { label: d.label, "This week": thisCount, "Last week": lastCount };
  });

  // 2. Monthly 30-day Chart
  const monthly = useMemo(() => {
    const end = getISTDate();
    const byDate = {};
    for (let i = 29; i >= 0; i--) {
      const d = subDays(end, i);
      const key = format(d, "yyyy-MM-dd");
      byDate[key] = 0;
    }
    for (const l of logs) {
      if (byDate[l.completedDate] !== undefined)
        byDate[l.completedDate] += 1;
    }
    return Object.entries(byDate).map(([k, v]) => ({
      label: format(parseISO(k), "MMM d"),
      count: v,
    }));
  }, [logs]);

  // 3. Category Data (30-day)
  const categoryData = useMemo(() => {
    if (!stats) return [];
    const map = {};
    for (const h of habits) map[h._id] = h.category;
    const counts = {};
    for (const l of logs) {
      const cat = map[l.habitId];
      if (!cat) continue;
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [stats, logs, habits]);

  if (loading || !stats) return <LoadingSpinner full />;

  // 4. Highlight Stats
  const sortedByStreak = [...stats.perHabit].sort(
    (a, b) => b.currentStreak - a.currentStreak
  );
  const best = sortedByStreak[0];
  const sortedByComp = [...stats.perHabit].sort(
    (a, b) => b.completions30d - a.completions30d
  );
  const longestLongest = [...stats.perHabit].sort(
    (a, b) => b.longestStreak - a.longestStreak
  )[0];
  const worst = [...stats.perHabit]
    .filter((s) => s.completions30d < 30)
    .sort((a, b) => a.completions30d - b.completions30d)[0];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            AI Coach & Insights
          </h1>
          <p className="text-sm text-muted mt-0.5 inline-flex items-center gap-2">
            Personalised analytics and actionable coaching.
          </p>
        </div>
      </div>

      {/* AI report */}
      <div className="card p-6 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            background:
              "radial-gradient(circle at 0% 0%, rgba(251,191,36,0.22), transparent 55%), radial-gradient(circle at 100% 100%, rgba(236,72,153,0.12), transparent 55%)",
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Sparkles size={18} />
            </div>
            <div className="flex-1 flex justify-between items-center">
              <div>
                <div className="text-sm font-semibold">AI Weekly Report</div>
                <div className="text-xs text-muted">
                  {reportGeneratedAt
                    ? `Generated ${reportGeneratedAt.toLocaleString()}`
                    : "Personalised review of your last 7 days"}
                </div>
              </div>
              <button
                onClick={generateReport}
                className="btn-secondary text-xs"
                disabled={reportLoading}
              >
                <RefreshCw
                  size={14}
                  className={reportLoading ? "animate-spin" : ""}
                />
                <span className="hidden sm:inline">Regenerate</span>
              </button>
            </div>
          </div>

          {reportLoading && !report && (
            <div className="flex items-center gap-2 text-sm text-soft py-6">
              <RefreshCw size={14} className="animate-spin" />
              Analysing your week...
            </div>
          )}

          {report && (
            <Markdown className="glass rounded-xl p-4 text-sm">
              {report}
            </Markdown>
          )}

          {!report && !reportLoading && (
            <button onClick={generateReport} className="btn-primary">
              <Sparkles size={14} /> Generate report
            </button>
          )}
        </div>
      </div>

      {/* Highlights */}
      {stats.perHabit.length > 0 && (
        <div className="grid md:grid-cols-3 gap-4">
          {best && (
            <div className="card p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <Flame size={14} className="text-orange-500" />
                Best streak
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-3xl">{best.icon}</span>
                <div>
                  <div className="font-semibold">{best.name}</div>
                  <div className="text-sm text-muted">
                    {best.currentStreak} day{best.currentStreak === 1 ? "" : "s"} running
                  </div>
                </div>
              </div>
            </div>
          )}
          {longestLongest && (
            <div className="card p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <Trophy size={14} className="text-amber-500" />
                Longest ever
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-3xl">{longestLongest.icon}</span>
                <div>
                  <div className="font-semibold">{longestLongest.name}</div>
                  <div className="text-sm text-muted">
                    {longestLongest.longestStreak} day record
                  </div>
                </div>
              </div>
            </div>
          )}
          {worst && (
            <div className="card p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                <TrendingDown size={14} className="text-rose-500" />
                Needs attention
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-3xl">{worst.icon}</span>
                <div>
                  <div className="font-semibold">{worst.name}</div>
                  <div className="text-sm text-muted">
                    {worst.completions30d}/30 in the last 30 days
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="text-sm font-medium mb-3">This week vs last week</div>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={compareData}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: tick }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: tick }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={tooltipStyle} 
                  cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,15,27,0.04)" }}
                  itemStyle={{ color: isDark ? "#ebebf5" : "#13131b", fontSize: 12 }}
                  labelStyle={{ color: isDark ? "#ebebf5" : "#13131b", fontSize: 12, fontWeight: "bold", marginBottom: 4 }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: tick }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar dataKey="Last week" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="This week" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <MonthlyBarChart data={monthly} />
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-[1fr_1fr] gap-5">
        <CategoryPieChart data={categoryData} />
        
        <div className="card p-5">
          <div className="text-sm font-medium mb-3">
            Top habits by completion (30d)
          </div>
          {!sortedByComp.length ? (
            <div className="text-sm text-muted py-10 text-center">
              No active habits.
            </div>
          ) : (
            <div className="space-y-3">
              {sortedByComp.slice(0, 5).map((s) => {
                const pct = Math.round((s.completions30d / 30) * 100);
                return (
                  <div key={s.habitId}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg shrink-0">{s.icon}</span>
                        <span className="truncate">{s.name}</span>
                      </div>
                      <span className="text-muted text-xs">
                        {s.completions30d}/30 · {pct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--chip-bg)" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: s.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detailed stats */}
      {stats.perHabit.length > 0 && (
        <div className="space-y-2 pt-4">
          <div className="text-sm font-medium mb-2">Detailed Habit Statistics</div>
          {stats.perHabit.map((s) => (
            <HabitStatsCard key={s.habitId} stat={s} />
          ))}
        </div>
      )}
    </div>
  );
}
