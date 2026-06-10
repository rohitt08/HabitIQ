import { Settings, Wrench, Clock } from 'lucide-react';

export default function Maintenance() {
  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/30 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-600/30 blur-[120px] rounded-full animate-pulse delay-700" />
      
      {/* Glassmorphism card */}
      <div className="relative z-10 max-w-2xl w-full bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 md:p-12 text-center shadow-2xl transition-all hover:border-slate-600/50 group">
        
        {/* Animated icon container */}
        <div className="relative w-32 h-32 mx-auto mb-8 flex justify-center items-center">
          <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping" />
          <div className="relative z-10 bg-gradient-to-tr from-indigo-500 to-fuchsia-500 p-6 rounded-full shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-300">
            <Wrench className="w-12 h-12 text-white animate-bounce" />
          </div>
          
          <Settings className="absolute top-0 right-2 w-8 h-8 text-fuchsia-400 animate-[spin_3s_linear_infinite]" />
          <Clock className="absolute bottom-2 left-0 w-6 h-6 text-indigo-400 animate-pulse" />
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-6 tracking-tight">
          We'll be right back
        </h1>
        
        <p className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed max-w-lg mx-auto">
          HabitIQ is currently undergoing scheduled maintenance to improve your experience. We are polishing some gears and adding new features.
        </p>

        <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-800/50 rounded-full border border-slate-700/50 text-slate-300 transition-colors hover:bg-slate-800/70 cursor-default">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-sm font-medium tracking-wide">Estimated downtime: ~2 hours</span>
        </div>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-8 text-slate-500 text-sm tracking-wider">
        &copy; {new Date().getFullYear()} HabitIQ. All rights reserved.
      </div>
    </div>
  );
}
