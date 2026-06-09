import { subDays } from "date-fns";

export const getISTDate = (dateStr) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * 5.5));
};

export const toKey = (d) => {
  // Since `d` is shifted such that its internal UTC time matches IST time,
  // we MUST use `.toISOString()` to extract the YYYY-MM-DD.
  // Using `format` would apply the browser's local timezone offset AGAIN, which breaks for non-IST users.
  return d.toISOString().split("T")[0];
};
export const todayKey = () => toKey(getISTDate());

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const last7Days = () => {
  const end = getISTDate();
  const keys = [];
  // Generate 7 days ending on `end`
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() - i, 12, 0, 0));
    keys.push({
      key: d.toISOString().split("T")[0],
      label: DAYS[d.getUTCDay()],
      short: String(d.getUTCDate()),
      date: d,
    });
  }
  return keys;
};

export const last90Days = () => {
  const end = getISTDate();
  const keys = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() - i, 12, 0, 0));
    keys.push(d.toISOString().split("T")[0]);
  }
  return keys;
};

export const weekKeys = () => weekKeysFor(getISTDate());

export const weekKeysFor = (date) => {
  // We need to calculate the start of the week (Monday) strictly using UTC methods.
  // getUTCDay() returns 0 for Sunday, 1 for Monday, etc.
  const d = new Date(date);
  const day = d.getUTCDay();
  // If day is 0 (Sunday), diff is 6. Otherwise diff is day - 1.
  const diff = day === 0 ? 6 : day - 1;
  
  // Create a new Date at 12:00 UTC on the Monday of this week.
  // Using 12:00 UTC ensures we don't accidentally slip into another day due to math.
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff, 12, 0, 0));
  
  const keys = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday.getTime() + (i * 24 * 60 * 60 * 1000));
    keys.push({
      key: dayDate.toISOString().split("T")[0],
      label: DAYS[dayDate.getUTCDay()],
      short: String(dayDate.getUTCDate()),
      date: dayDate,
    });
  }
  return keys;
};

export const prettyDate = (d) => {
  const date = d instanceof Date ? d : new Date(d);
  // If we are passing an IST-shifted date, we use UTC methods
  // Wait, if we pass a string "2026-06-10", new Date("2026-06-10") creates it at 00:00 UTC.
  // So UTC methods are correct for both cases!
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
};

export const shortDate = (d) => {
  const date = d instanceof Date ? d : new Date(d);
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`;
};

export const streakFromKeys = (keys) => {
  if (!keys?.length) return { current: 0, longest: 0 };
  const set = new Set(keys);
  const today = todayKey();
  const yKey = toKey(subDays(getISTDate(), 1));
  let current = 0;
  let cursor = getISTDate();
  if (!set.has(today) && !set.has(yKey)) {
    current = 0;
  } else {
    if (!set.has(today)) cursor = subDays(cursor, 1);
    while (set.has(toKey(cursor))) {
      current += 1;
      cursor = subDays(cursor, 1);
    }
  }
  const sorted = [...keys].sort();
  let longest = 0;
  let run = 0;
  let prev = null;
  for (const k of sorted) {
    if (prev) {
      const diff = Math.round(
        (new Date(k) - new Date(prev)) / (1000 * 60 * 60 * 24)
      );
      run = diff === 1 ? run + 1 : 1;
    } else run = 1;
    if (run > longest) longest = run;
    prev = k;
  }
  return { current, longest };
};
