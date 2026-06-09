import { useState, useEffect } from "react";
import api from "../api/axios.js";
import { Trophy, Award, Medal, Crown, Star } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const rankStyles = {
  1: "bg-gradient-to-br from-yellow-300 to-yellow-600 border-yellow-400/50 shadow-yellow-500/20 text-yellow-900",
  2: "bg-gradient-to-br from-gray-200 to-gray-400 border-gray-300/50 shadow-gray-400/20 text-gray-800",
  3: "bg-gradient-to-br from-amber-600 to-amber-800 border-amber-700/50 shadow-amber-800/20 text-amber-50",
};

const defaultRankStyle = "bg-[var(--surface)] border-[var(--border)]";

export default function Leaderboard() {
  const { user: authUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get("/leaderboard");
        setData(res.data);
      } catch (err) {
        console.error("Error fetching leaderboard", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card p-5 animate-pulse">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
          <div className="h-20 bg-gray-100 dark:bg-gray-800/50 rounded-xl"></div>
        </div>
        <div className="card p-5 animate-pulse">
          <div className="h-6 w-40 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800/50 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { topUsers, currentUser } = data;

  const renderRow = (user, isCurrentUser = false) => {
    const isTop3 = user.rank <= 3;
    const rankClass = rankStyles[user.rank] || defaultRankStyle;
    
    return (
      <div 
        key={user._id} 
        className={`relative flex items-center p-4 rounded-xl border transition-all duration-300 hover:scale-[1.01] hover:shadow-lg ${rankClass} ${
          isCurrentUser && !isTop3 ? "ring-2 ring-brand-500 shadow-brand-500/20" : ""
        }`}
      >
        <div className="flex items-center justify-center w-10 h-10 shrink-0 font-bold text-lg">
          {user.rank === 1 && <Trophy size={24} className="text-yellow-100 drop-shadow-md" />}
          {user.rank === 2 && <Medal size={24} className="text-gray-100 drop-shadow-md" />}
          {user.rank === 3 && <Medal size={24} className="text-amber-200 drop-shadow-md" />}
          {user.rank > 3 && <span className="text-muted">#{user.rank}</span>}
        </div>

        <div className="flex items-center gap-3 ml-4 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-inner ${
            isTop3 ? "bg-white/20 text-current" : "bg-gradient-to-br from-brand-500 to-brand-700 text-white"
          }`}>
            {user.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-semibold truncate ${isTop3 ? "text-current" : ""}`}>
                {user.name}
              </span>
              {isCurrentUser && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500 text-white font-bold tracking-wider">
                  YOU
                </span>
              )}
            </div>
            <div className={`text-xs font-mono tracking-wider truncate ${isTop3 ? "opacity-80" : "text-brand-500"}`}>
              {user.userTag}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0 ml-4">
          <div className={`font-bold text-lg flex items-center gap-1 ${isTop3 ? "text-current" : "text-brand-600 dark:text-brand-400"}`}>
            {user.points} <span className="text-xs font-medium uppercase tracking-wider opacity-70">XP</span>
          </div>
          <div className={`text-xs flex items-center gap-1 font-medium ${isTop3 ? "opacity-90" : "text-muted"}`}>
            {user.badge.icon} {user.badge.name}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* SECTION 1: Your Ranking */}
      <div className="card p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <Award size={150} />
        </div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Star className="text-brand-500" size={20} />
          Your Ranking
        </h2>
        
        <div className="mb-4">
          {renderRow(currentUser, true)}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="glass rounded-xl p-3 text-center border divider">
            <div className="text-xs text-muted mb-1 uppercase font-bold tracking-wider">Current Rank</div>
            <div className="text-xl font-bold text-brand-600 dark:text-brand-400">#{currentUser.rank}</div>
          </div>
          <div className="glass rounded-xl p-3 text-center border divider">
            <div className="text-xs text-muted mb-1 uppercase font-bold tracking-wider">Total XP</div>
            <div className="text-xl font-bold">{currentUser.points}</div>
          </div>
          <div className="glass rounded-xl p-3 text-center border divider">
            <div className="text-xs text-muted mb-1 uppercase font-bold tracking-wider">Current Badge</div>
            <div className="text-xl font-bold flex items-center justify-center gap-1">
              {currentUser.badge.icon} <span className="text-sm">{currentUser.badge.name}</span>
            </div>
          </div>
          <div className="glass rounded-xl p-3 text-center border divider relative overflow-hidden">
            <div className="text-xs text-muted mb-1 uppercase font-bold tracking-wider">To Overtake</div>
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {currentUser.xpToOvertake > 0 ? `+${currentUser.xpToOvertake} XP` : "Leader!"}
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t divider">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-medium text-muted">Progress to Next Badge</span>
            <span className="font-bold">{currentUser.xpToNextBadge} XP needed</span>
          </div>
          <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(100, Math.max(5, (currentUser.points / (currentUser.points + currentUser.xpToNextBadge)) * 100))}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Top Performers */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Crown className="text-yellow-500" size={20} />
            Top Performers
          </h2>
          <div className="text-xs font-medium px-2 py-1 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-lg">
            All-Time
          </div>
        </div>

        <div className="space-y-3">
          {topUsers.map(u => renderRow(u, u._id === authUser?._id))}
          
          {topUsers.length === 0 && (
            <div className="text-center py-10 text-muted">
              No users found on the leaderboard yet.
            </div>
          )}
        </div>
        
        {currentUser.rank > 10 && (
          <>
            <div className="flex justify-center py-2">
              <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700 mx-1"></div>
              <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700 mx-1"></div>
              <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700 mx-1"></div>
            </div>
            <div className="opacity-80">
              {renderRow(currentUser, true)}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
