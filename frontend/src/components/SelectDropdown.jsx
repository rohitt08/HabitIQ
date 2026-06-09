import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function SelectDropdown({ 
  value, 
  onChange, 
  options, 
  placeholder = "Select...", 
  className = "",
  placeholderStyle = false
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative z-30 ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="input flex justify-between items-center w-full text-left focus:outline-none focus:ring-2 focus:ring-brand-500/50"
      >
        <span className={placeholderStyle && (!value || value === options[0]) ? "text-soft" : ""}>
          {value || placeholder}
        </span>
        <ChevronDown size={16} className={`text-faint transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-0" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-2 w-full bg-white/95 dark:bg-[#1a1a24]/98 backdrop-blur-xl rounded-xl shadow-2xl z-10 overflow-hidden py-1 animate-fade-in border border-[var(--surface-border)] max-h-60 overflow-y-auto no-scrollbar">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[var(--surface-hover)] ${
                  value === opt 
                    ? "bg-brand-500/10 text-brand-700 dark:text-brand-300 font-medium" 
                    : "text-soft"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
