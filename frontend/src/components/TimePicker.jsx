import { useState, useEffect, useRef } from "react";

const Wheel = ({ options, value, onChange }) => {
  const ref = useRef(null);
  const timeoutRef = useRef(null);
  
  useEffect(() => {
    if (ref.current) {
       const index = options.findIndex(o => o === value);
       if (index !== -1) {
           ref.current.scrollTop = index * 40;
       }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const handleScroll = (e) => {
     const y = e.target.scrollTop;
     if (timeoutRef.current) clearTimeout(timeoutRef.current);
     timeoutRef.current = setTimeout(() => {
         const index = Math.round(y / 40);
         if (options[index] !== undefined && options[index] !== value) {
            onChange(options[index]);
         }
     }, 100);
  };

  return (
    <div 
      ref={ref}
      onScroll={handleScroll}
      className="h-[120px] overflow-y-scroll snap-y snap-mandatory no-scrollbar text-center border-x border-[var(--surface-border)] first:border-l-0 last:border-r-0 flex-1 relative z-10"
      style={{ scrollBehavior: "smooth" }}
    >
      <div className="h-10" />
      {options.map(opt => (
        <div 
          key={opt} 
          className={`h-10 flex items-center justify-center snap-center text-lg font-bold transition-all duration-200 ${
            value === opt 
              ? "text-brand-600 dark:text-brand-400 scale-110" 
              : "text-faint scale-90 opacity-60"
          }`}
        >
          {typeof opt === 'number' ? opt.toString().padStart(2, "0") : opt}
        </div>
      ))}
      <div className="h-10" />
    </div>
  );
};

export default function TimePicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const parseTime = (timeStr) => {
    if (!timeStr) return { h: 8, m: 0, p: "AM" };
    const [hStr, mStr] = timeStr.split(":");
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    return {
      h: h % 12 === 0 ? 12 : h % 12,
      m: m,
      p: h >= 12 ? "PM" : "AM"
    };
  };

  const initial = parseTime(value);
  const [hour, setHour] = useState(initial.h);
  const [minute, setMinute] = useState(initial.m);
  const [period, setPeriod] = useState(initial.p);

  const formatOutput = (h, m, p) => {
    let hour24 = h;
    if (p === "AM" && h === 12) hour24 = 0;
    if (p === "PM" && h !== 12) hour24 += 12;
    return `${hour24.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    onChange(formatOutput(hour, minute, period));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hour, minute, period]);

  const displayVal = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")} ${period}`;

  return (
    <div className="w-full">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-transparent px-4 py-3 text-center text-2xl md:text-3xl font-bold tracking-widest text-brand-700 dark:text-brand-300 focus:outline-none cursor-pointer hover:bg-brand-500/5 transition-colors"
      >
        {displayVal}
      </div>
      
      {isOpen && (
        <div className="w-full p-3 bg-white/50 dark:bg-black/20 rounded-2xl flex flex-col origin-top animate-fade-in border-t border-[var(--surface-border)]">
          <div className="flex justify-between items-center px-2 pb-3 border-b divider mb-3">
             <span className="text-xs font-bold uppercase tracking-wider text-soft">Set time</span>
             <button onClick={() => setIsOpen(false)} className="text-brand-600 dark:text-brand-400 font-semibold text-sm hover:opacity-80 transition">Done</button>
          </div>
          
          <div className="relative flex justify-between rounded-xl overflow-hidden h-[120px] shadow-inner bg-black/5 dark:bg-white/5">
             <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-10 bg-brand-500/10 border-y border-brand-500/20 pointer-events-none z-0" />
             
             <Wheel 
               options={Array.from({length: 12}, (_, i) => i + 1)} 
               value={hour} 
               onChange={setHour} 
             />
             <Wheel 
               options={Array.from({length: 60}, (_, i) => i)} 
               value={minute} 
               onChange={setMinute} 
             />
             <Wheel 
               options={["AM", "PM"]} 
               value={period} 
               onChange={setPeriod} 
             />
          </div>
        </div>
      )}
    </div>
  );
}
