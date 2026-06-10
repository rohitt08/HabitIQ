import { useMemo, useState, useRef } from "react";
import { format, parseISO, subDays } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

const levelColor = (count, max) => {
  if (!count) return "var(--heat-0)";
  const ratio = count / Math.max(1, max);
  if (ratio < 0.25) return "var(--heat-1)";
  if (ratio < 0.5) return "var(--heat-2)";
  if (ratio < 0.85) return "var(--heat-3)";
  return "var(--heat-4)";
};

import { getISTDate } from "../utils/dateHelpers.js";

export default function HeatmapChart({ data = [], offset = 0, onPrevious, onNext }) {
  const { cols, max, startDateStr, endDateStr } = useMemo(() => {
    const end = subDays(getISTDate(), offset);
    const start = subDays(end, 89);
    const skeleton = [];
    for (let i = 89; i >= 0; i--) {
      skeleton.push(format(subDays(end, i), "yyyy-MM-dd"));
    }

    const countMap = {};
    let max = 0;
    data.forEach(d => {
      countMap[d.date] = d.count;
      if (d.count > max) max = d.count;
    });

    const cols = [];
    let col = [];
    skeleton.forEach((date, i) => {
      const dow = new Date(date).getDay();
      const shifted = (dow + 6) % 7;
      if (i === 0) {
        for (let j = 0; j < shifted; j++) col.push(null);
      }
      col.push({ date, count: countMap[date] || 0 });
      if (shifted === 6) {
        cols.push(col);
        col = [];
      }
    });
    if (col.length) {
      while (col.length < 7) col.push(null);
      cols.push(col);
    }
    return { 
      cols, 
      max,
      startDateStr: format(start, "MMM d"),
      endDateStr: format(end, "MMM d")
    };
  }, [data, offset]);

  const totalCount = data.reduce((s, d) => s + d.count, 0);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, text: "" });
  const containerRef = useRef(null);

  const handleMouseEnter = (e, date, count) => {
    if (!containerRef.current) return;
    const rect = e.target.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    let align = "center";
    let x = rect.left - containerRect.left + rect.width / 2;
    
    // Tooltip is ~220px wide, so we need ~110px clearance on either side
    if (x > containerRect.width - 120) {
      align = "right";
    } else if (x < 120) {
      align = "left";
    }

    setTooltip({
      show: true,
      x,
      y: rect.top - containerRect.top - 8,
      align,
      text: `${format(parseISO(date), "d MMMM, yyyy")} ( ${count} completion${count === 1 ? "" : "s"} )`
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ ...tooltip, show: false });
  };

  return (
    <div className="card p-5 relative" ref={containerRef}>
      <div className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="text-sm font-medium">Consistency</div>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            Less
            {[0, 0.2, 0.5, 0.8, 1].map((r, i) => (
              <span
                key={i}
                className="w-3 h-3 rounded-sm"
                style={{ background: levelColor(r * (max || 1), max || 1) }}
              />
            ))}
            More
          </div>
        </div>
        
        <div className="text-xs text-muted flex items-center gap-1">
          <button 
            onClick={onPrevious} 
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors"
            title="Previous 90 days"
          >
            <ChevronLeft size={16}/>
          </button>
          <span className="font-medium text-[11px] uppercase tracking-wider">
            {totalCount} completions ({startDateStr} - {endDateStr})
          </span>
          <button 
            onClick={onNext} 
            disabled={offset === 0}
            className={`p-1 rounded transition-colors ${offset === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-gray-200 dark:hover:bg-gray-800"}`}
            title="Next 90 days"
          >
            <ChevronRight size={16}/>
          </button>
        </div>
      </div>

      <div className="mt-4 w-full max-w-[600px] mx-auto">
        <div className="flex w-full gap-1">
          {cols.map((col, ci) => (
            <div key={ci} className="flex-1 flex flex-col gap-1">
              {col.map((d, ri) =>
                d ? (
                  <div
                    key={ri}
                    className="w-full aspect-square rounded-sm sm:rounded-md md:rounded-full transition-all duration-300 ease-out hover:scale-110 cursor-pointer shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]"
                    style={{ background: levelColor(d.count, max) }}
                    onMouseEnter={(e) => handleMouseEnter(e, d.date, d.count)}
                    onMouseLeave={handleMouseLeave}
                  />
                ) : (
                  <div key={ri} className="w-full aspect-square rounded-sm sm:rounded-md md:rounded-full bg-gray-200/40 dark:bg-gray-800/40 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]" />
                )
              )}
            </div>
          ))}
        </div>
      </div>

      {tooltip.show && (
        <div 
          className="absolute z-50 pointer-events-none"
          style={{ 
            left: tooltip.x, 
            top: tooltip.y,
            transform: `translate(${tooltip.align === "right" ? "-90%" : tooltip.align === "left" ? "-10%" : "-50%"}, -100%)`
          }}
        >
          <div className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-white bg-black/90 dark:bg-white/90 dark:text-black shadow-xl whitespace-nowrap animate-pop relative">
            {tooltip.text}
            <div 
              className="absolute top-full border-4 border-transparent border-t-black/90 dark:border-t-white/90"
              style={{
                left: tooltip.align === "right" ? "90%" : tooltip.align === "left" ? "10%" : "50%",
                transform: "translateX(-50%)"
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
