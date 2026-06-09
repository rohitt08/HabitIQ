import { format, subDays, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";

export const getISTDate = (dateStr) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * 5.5));
};

export const toDateKey = (date) => {
  return date.toISOString().split("T")[0];
};

export const todayKey = () => toDateKey(getISTDate());

export const isValidLogDate = (dateStr) => {
  const today = todayKey();
  const yesterday = toDateKey(subDays(getISTDate(), 1));
  const tomorrow = toDateKey(addDays(getISTDate(), 1));
  return [today, yesterday, tomorrow].includes(dateStr);
};

export const last90Days = (endDateStr) => {
  const end = endDateStr ? getISTDate(endDateStr) : getISTDate();
  const keys = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() - i, 12, 0, 0));
    keys.push(d.toISOString().split("T")[0]);
  }
  return keys;
};

export const currentWeekKeys = () => {
  const now = getISTDate();
  const day = now.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff, 12, 0, 0));
  
  const keys = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday.getTime() + (i * 24 * 60 * 60 * 1000));
    keys.push(dayDate.toISOString().split("T")[0]);
  }
  return keys;
};

export const lastNDays = (n) => {
    const end = getISTDate();
    const keys = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() - i, 12, 0, 0));
      keys.push(d.toISOString().split("T")[0]);
    }
    return keys;
};

export const calcStreak = (sortedDateKeys) => {
  // sortedDateKeys newest first, unique

  if (!sortedDateKeys.length) {
    return { current: 0, longest: 0 };
  }

  const set = new Set(sortedDateKeys);

  const today = todayKey();
  const yesterday = toDateKey(subDays(getISTDate(), 1));

  let current = 0;

  let cursor = getISTDate();

  if (!set.has(today) && !set.has(yesterday)) {
    current = 0;
  } else {
    if (!set.has(today)) {
      cursor = subDays(cursor, 1);
    }

    while (set.has(toDateKey(cursor))) {
      current += 1;
      cursor = subDays(cursor, 1);
    }
  }

  const sortedAsc = [...sortedDateKeys].sort();

let longest = 0;
let run = 0;
let prev = null;

for (const k of sortedAsc) {
  if (prev) {
    const d = new Date(k);
    const p = new Date(prev);

    const diff = Math.round((d - p) / (1000 * 60 * 60 * 24));

    if (diff === 1) {
      run += 1;
    } else {
      run = 1;
    }
  } else {
    run = 1;
  }

  if (run > longest) {
    longest = run;
  }

  prev = k;
}

return { current, longest };
};