import { useState, useEffect, useRef } from "react";
import api from "../api/axios.js";
import { Trophy, Award, Medal, Crown, Star, Info, ShieldAlert, Users, MapPin } from "lucide-react";
import { useAuthStore as useAuth } from "../store/authStore.js";
import { useSocketStore as useSocket } from "../store/socketStore.js";
import Modal from "./Modal.jsx";

const rankStyles = {
  1: "bg-gradient-to-br from-yellow-300 to-yellow-600 border-yellow-400/50 shadow-yellow-500/20 text-yellow-900",
  2: "bg-gradient-to-br from-gray-200 to-gray-400 border-gray-300/50 shadow-gray-400/20 text-gray-800",
  3: "bg-gradient-to-br from-amber-600 to-amber-800 border-amber-700/50 shadow-amber-800/20 text-amber-50",
};

const defaultRankStyle = "bg-[var(--surface)] border-[var(--border)]";

export default function Leaderboard() {
  const { user: authUser, updateUser } = useAuth();
  const { socket } = useSocket();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const [tab, setTab] = useState("friends");
  const [nearbyData, setNearbyData] = useState(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [friendsData, setFriendsData] = useState(null);
  const [locationEnabled, setLocationEnabled] = useState(authUser?.locationEnabled || false);
  const [locationLoading, setLocationLoading] = useState(false);
  
  const fetchGlobalRef = useRef(null);
  const fetchFriendsRef = useRef(null);
  const fetchNearbyRef = useRef(null);
  const isTogglingRef = useRef(false);

  const handleToggleLocation = async () => {
    if (locationLoading) return;
    try {
      if (locationEnabled) {
        // Disabling: optimistic UI update is fine
        setLocationLoading(true);
        setLocationEnabled(false);
        setNearbyData(null);
        updateUser({ ...authUser, locationEnabled: false });
        
        try {
          await api.post("/leaderboard/location/toggle", { enabled: false });
        } catch {
          // Revert on error
          setLocationEnabled(true);
          updateUser({ ...authUser, locationEnabled: true });
          setLocationError("Failed to disable location sharing.");
        } finally {
          setLocationLoading(false);
        }
      } else {
        // Enabling location: wait for user permission
        if (!navigator.geolocation) {
          setLocationError("Geolocation is not supported by your browser");
          return;
        }

        isTogglingRef.current = true;
        setLocationLoading(true);
        setLocationError("");

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              
              // Now we safely update UI after permission granted
              setLocationEnabled(true);
              setNearbyLoading(true);
              updateUser({ ...authUser, locationEnabled: true });

              await api.post("/leaderboard/location/toggle", { enabled: true, lat: latitude, lng: longitude });
              fetchNearby(false); // Fetch the list now that we're registered
            } catch {
              setLocationEnabled(false);
              updateUser({ ...authUser, locationEnabled: false });
              setLocationError("Failed to enable location sharing.");
            } finally {
              setNearbyLoading(false);
              setLocationLoading(false);
              isTogglingRef.current = false;
            }
          },
          (error) => {
            let errMsg = "Location access denied.";
            if (error.code === 1) { // PERMISSION_DENIED
              errMsg = "Permission denied. Please allow location access in your browser settings.";
            } else if (error.code === 2) { // POSITION_UNAVAILABLE
              errMsg = "Location information is unavailable.";
            } else if (error.code === 3) { // TIMEOUT
              errMsg = "Location request timed out.";
            }
            
            // Keep it off and show error
            setLocationEnabled(false);
            updateUser({ ...authUser, locationEnabled: false });
            setLocationError(errMsg);
            setLocationLoading(false);
            setNearbyLoading(false);
            isTogglingRef.current = false;
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }
    } catch (err) {
      console.error("Error toggling location", err);
      setLocationLoading(false);
    }
  };

  const fetchNearby = async (updateLocation = false) => {
    if (!locationEnabled && !updateLocation) return;
    
    try {
      setNearbyLoading(true);
      setLocationError("");

      if (updateLocation) {
        if (!navigator.geolocation) {
          setLocationError("Geolocation is not supported by your browser");
          setNearbyLoading(false);
          return;
        }
        
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              const res = await api.get(`/leaderboard/nearby?lat=${latitude}&lng=${longitude}`);
              setNearbyData(res.data);
            } catch (err) {
              if (err.response?.status === 403) setLocationError("Location sharing is disabled.");
              else setLocationError("Failed to find nearby users.");
            } finally {
              setNearbyLoading(false);
            }
          },
          () => {
            setLocationError("Location access denied.");
            setNearbyLoading(false);
          }
        );
      } else {
        const res = await api.get("/leaderboard/nearby");
        setNearbyData(res.data);
        setNearbyLoading(false);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setNearbyData(null);
        setLocationEnabled(false);
        setLocationError("Location sharing is disabled.");
      } else if (err.response?.status === 400) {
        setLocationError("No location available. Please enable location sharing.");
      }
      setNearbyLoading(false);
    }
  };

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      if (fetchGlobalRef.current) fetchGlobalRef.current();
      if (fetchFriendsRef.current) fetchFriendsRef.current(false);
      if (fetchNearbyRef.current) fetchNearbyRef.current(false);
    };
    socket.on("leaderboard_update", handleUpdate);
    return () => socket.off("leaderboard_update", handleUpdate);
  }, [socket]);

  useEffect(() => {
    if (!navigator.permissions) return;
    let permissionStatus;
    const handlePermissionChange = function() {
      if (this.state === "denied" || this.state === "prompt") {
        if (locationEnabled) {
          setLocationEnabled(false);
          setNearbyData(null);
          if (authUser) {
             updateUser({ ...authUser, locationEnabled: false });
          }
          setLocationError("Location access was revoked from browser.");
          api.post("/leaderboard/location/toggle", { enabled: false }).catch(() => {});
        }
      }
    };
    navigator.permissions.query({ name: "geolocation" }).then((status) => {
      permissionStatus = status;
      permissionStatus.addEventListener("change", handlePermissionChange);
    }).catch(err => console.error("Permissions API error", err));
    return () => {
      if (permissionStatus) {
        permissionStatus.removeEventListener("change", handlePermissionChange);
      }
    };
  }, [locationEnabled, authUser, updateUser]);

  useEffect(() => {
    if (tab === "nearby" && locationEnabled && !isTogglingRef.current) {
      fetchNearby(false);
    }
    fetchNearbyRef.current = fetchNearby;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, locationEnabled, authUser?.points]);

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
    fetchGlobalRef.current = fetchLeaderboard;
    fetchLeaderboard();
  }, [authUser?.points]);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await api.get("/leaderboard/friends");
        setFriendsData(res.data);
      } catch (err) {
        console.error("Error fetching friends leaderboard", err);
      }
    };

    fetchFriendsRef.current = fetchFriends;

    if (tab === "friends") {
      fetchFriends();
    }

    const handleSync = () => {
      if (tab === "friends") fetchFriends();
    };

    window.addEventListener("friends_updated", handleSync);
    
    return () => {
      window.removeEventListener("friends_updated", handleSync);
    };
  }, [tab, authUser?.points]);

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

  const activeData = tab === "nearby" && nearbyData ? nearbyData : (tab === "friends" && friendsData ? friendsData : data);
  const { topUsers, currentUser } = activeData;

  const paddedTopUsers = [...topUsers];
  while (paddedTopUsers.length < 10) {
    paddedTopUsers.push({
      _id: `empty-${paddedTopUsers.length}`,
      isEmpty: true,
      rank: paddedTopUsers.length + 1,
      name: "---",
      userTag: "---",
      points: 0,
      avatar: "",
      badge: null
    });
  }

  const renderRow = (user, isCurrentUser = false) => {
    if (user.isEmpty) {
      return (
        <div 
          key={user._id} 
          className="relative flex items-center p-3 sm:p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20 opacity-50 select-none"
        >
          <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 shrink-0 font-bold text-base sm:text-lg text-muted">
            #{user.rank}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 ml-2 sm:ml-4 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-muted shrink-0 text-[10px] sm:text-xs font-bold tracking-widest">
              {user.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-muted truncate text-sm sm:text-base">{user.name}</div>
              <div className="text-[10px] sm:text-xs font-mono text-faint truncate">#{user.userTag?.replace(/^#/, "")}</div>
            </div>
          </div>
          <div className="flex flex-col items-end shrink-0 ml-2 sm:ml-4">
            <div className="font-bold text-sm sm:text-lg text-faint">---</div>
          </div>
        </div>
      );
    }

    const isTop3 = user.rank <= 3;
    const rankClass = rankStyles[user.rank] || defaultRankStyle;
    
    return (
      <div 
        key={user._id} 
        className={`relative flex items-center p-3 sm:p-4 rounded-xl border transition-all duration-300 hover:scale-[1.01] hover:shadow-lg ${rankClass} ${
          isCurrentUser && !isTop3 ? "ring-2 ring-brand-500 shadow-brand-500/20" : ""
        }`}
      >
        <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 shrink-0 font-bold text-base sm:text-lg">
          {user.rank === 1 && <Trophy className="text-yellow-100 drop-shadow-md w-5 h-5 sm:w-6 sm:h-6" />}
          {user.rank === 2 && <Medal className="text-gray-100 drop-shadow-md w-5 h-5 sm:w-6 sm:h-6" />}
          {user.rank === 3 && <Medal className="text-amber-200 drop-shadow-md w-5 h-5 sm:w-6 sm:h-6" />}
          {user.rank > 3 && <span className="text-muted">#{user.rank}</span>}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 ml-2 sm:ml-4 flex-1 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20 overflow-hidden shrink-0 text-xs sm:text-base">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              user.avatar
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              <span className={`font-semibold truncate text-sm sm:text-base ${isTop3 ? "text-current" : ""}`}>
                {user.name}
              </span>
              {isCurrentUser && (
                <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-brand-500 text-white font-bold tracking-wider shrink-0">
                  YOU
                </span>
              )}
            </div>
            <div className={`text-[10px] sm:text-xs font-mono tracking-wider truncate ${isTop3 ? "opacity-80" : "text-brand-500"}`}>
              #{user.userTag?.replace(/^#/, "")}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0 ml-2 sm:ml-4">
          <div className={`font-bold text-sm sm:text-lg flex items-center gap-1 ${isTop3 ? "text-current" : "text-brand-600 dark:text-brand-400"}`}>
            {user.points} <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider opacity-70">XP</span>
          </div>
          <div className={`text-[10px] sm:text-xs flex items-center gap-1 font-medium ${isTop3 ? "opacity-90" : "text-muted"}`}>
            {user.badge.icon} <span className="hidden sm:inline max-w-[80px] truncate">{user.badge.name}</span>
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
        <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="text-brand-500" size={20} />
            In {tab === "global" ? "Global" : tab === "friends" ? "Friends" : "Nearby"} Ranking
          </div>
          <button 
            onClick={() => setInfoOpen(true)}
            className="text-muted hover:text-brand-500 transition-colors"
            title="How XP works"
          >
            <Info size={18} />
          </button>
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

      {/* SECTION 2: Leaderboard */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Crown className="text-yellow-500" size={20} />
            Leaderboard
          </h2>
          <div className="flex bg-[var(--input-bg)] rounded-lg p-1 border divider text-xs font-medium w-full sm:w-auto overflow-x-auto custom-scrollbar">
            <button 
              className={`flex-1 sm:flex-none whitespace-nowrap px-3 py-1.5 rounded-md transition ${tab === "friends" ? "bg-[var(--surface-strong)] shadow-sm text-brand-600 dark:text-brand-400" : "text-muted hover:text-[var(--text)]"}`} 
              onClick={() => setTab("friends")}
            >
              Friends
            </button>
            <button 
              className={`flex-1 sm:flex-none whitespace-nowrap px-3 py-1.5 rounded-md transition ${tab === "nearby" ? "bg-[var(--surface-strong)] shadow-sm text-brand-600 dark:text-brand-400" : "text-muted hover:text-[var(--text)]"}`} 
              onClick={() => setTab("nearby")}
            >
              Nearby
            </button>
            <button 
              className={`flex-1 sm:flex-none whitespace-nowrap px-3 py-1.5 rounded-md transition ${tab === "global" ? "bg-[var(--surface-strong)] shadow-sm text-brand-600 dark:text-brand-400" : "text-muted hover:text-[var(--text)]"}`} 
              onClick={() => setTab("global")}
            >
              Global
            </button>
          </div>
        </div>

        {tab === "friends" && (
           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-brand-500/10 border border-brand-500/20 p-3 sm:p-4 rounded-xl mb-4">
             <div className="flex items-center gap-3 text-brand-600 dark:text-brand-400">
               <Users size={20} className="shrink-0" />
               <span className="text-sm font-medium">Add friends to compete privately!</span>
             </div>
             <button 
               className="btn-secondary text-xs py-1.5 px-3 min-h-0 rounded-lg w-full sm:w-auto justify-center"
               onClick={() => {
                 const searchInput = document.getElementById("friend-search-input");
                 if (searchInput) {
                   searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
                   setTimeout(() => searchInput.focus(), 500);
                 }
               }}
             >
               Add Friends
             </button>
           </div>
        )}

        {tab === "nearby" && (
           <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-brand-500/10 border border-brand-500/20 p-4 rounded-xl mb-4">
             <div className="flex items-center gap-3 text-brand-600 dark:text-brand-400 shrink-0">
               <MapPin size={24} className="shrink-0" />
               <div className="flex flex-col">
                 <span className="text-sm font-semibold">Nearby Leaderboard</span>
                 <span className="text-xs opacity-80 mt-0.5">Find users within 1km.</span>
               </div>
             </div>
             
             <div className="flex items-center justify-between w-full xl:w-auto gap-3 shrink-0 pt-3 xl:pt-0 border-t xl:border-0 border-brand-500/20">
               {locationError ? (
                 <span className="text-xs text-red-500 flex-1 leading-tight" title={locationError}>{locationError}</span>
               ) : (
                 <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600/70 dark:text-brand-400/70 xl:hidden">
                   Status
                 </span>
               )}
               <label className={`flex items-center shrink-0 ml-auto xl:ml-0 transition-opacity duration-300 ${locationLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                 <span className="mr-3 text-sm font-medium text-[var(--text)] whitespace-nowrap">
                   {locationLoading ? "Waiting..." : (locationEnabled ? "Sharing" : "Hidden")}
                 </span>
                 <div className="relative pointer-events-none">
                   <input type="checkbox" className="sr-only" checked={locationEnabled} onChange={handleToggleLocation} disabled={locationLoading} />
                   <div className={`block w-11 h-6 rounded-full transition-colors ${locationEnabled ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"}`}></div>
                   <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${locationEnabled ? "transform translate-x-5" : ""}`}></div>
                 </div>
               </label>
             </div>
           </div>
        )}

        {tab === "nearby" && !locationEnabled && (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl my-6">
            <ShieldAlert size={48} className="text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-[var(--text)] mb-2">Location Hidden</h3>
            <p className="text-sm max-w-md mx-auto mb-4">
              Your location is currently completely hidden from everyone. To participate in the nearby leaderboard, you must explicitly enable location sharing above.
            </p>
          </div>
        )}

        {tab === "nearby" && locationEnabled && nearbyData && (
           <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-3 bg-emerald-500/10 px-3 py-2 rounded-lg flex items-center gap-2">
             <MapPin size={14} /> You are currently visible to nearby users.
           </div>
        )}

        {(!locationEnabled && tab === "nearby") ? null : nearbyLoading ? (
          <div className="space-y-3 h-[420px] overflow-hidden pr-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[74px] bg-gray-100 dark:bg-gray-800/50 rounded-xl animate-pulse flex items-center p-4">
                 <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 mr-4"></div>
                 <div className="flex-1 space-y-2">
                   <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                   <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                 </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 h-[420px] overflow-y-auto pr-2 custom-scrollbar">
            {paddedTopUsers.map(u => renderRow(u, u._id === authUser?._id))}
          </div>
        )}
        
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

      {/* XP Info Modal */}
      <Modal open={infoOpen} onClose={() => setInfoOpen(false)} title="How XP Works" maxWidth="max-w-xl">
        <div className="space-y-4 text-sm max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
          <p className="text-soft">
            Earn Experience Points (XP) to climb the leaderboard and unlock new badges!
          </p>
          <div className="glass rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-brand-600 dark:text-brand-400 mb-2">XP Rewards</h3>
            <div className="flex justify-between items-center pb-2 border-b divider">
              <span className="font-medium flex items-center gap-2">
                Complete a habit
                <span className="text-[10px] bg-brand-500/10 text-brand-600 dark:text-brand-400 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide">Max 35/day</span>
              </span>
              <span className="font-bold text-brand-500">+5 XP</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="font-medium text-orange-500 flex items-center gap-1">🔥 7-Day Streak</span>
              <span className="font-bold text-orange-500">+25 XP</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-red-500 flex items-center gap-1">🔥🔥 30-Day Streak</span>
              <span className="font-bold text-red-500">+100 XP</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-purple-500 flex items-center gap-1">✨ 90-Day Streak</span>
              <span className="font-bold text-purple-500">+200 XP</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b divider">
              <span className="font-medium text-indigo-500 flex items-center gap-1">💎 180-Day Streak</span>
              <span className="font-bold text-indigo-500">+500 XP</span>
            </div>
          </div>

          <div className="glass rounded-xl p-4 mt-4">
            <h3 className="font-bold text-brand-600 dark:text-brand-400 mb-3 flex items-center gap-1">
              <Award size={16}/> Unlock Badges
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b divider text-muted text-xs uppercase tracking-wider">
                    <th className="pb-2 font-semibold">Badge</th>
                    <th className="pb-2 font-semibold">XP Range</th>
                    <th className="pb-2 font-semibold">Requirements</th>
                  </tr>
                </thead>
                <tbody className="text-xs sm:text-sm">
                  <tr className="border-b divider last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="py-2 font-medium">🌱 First Step</td>
                    <td className="py-2 text-muted">0–100 XP</td>
                    <td className="py-2 text-muted">Complete first 10 habits</td>
                  </tr>
                  <tr className="border-b divider last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="py-2 font-medium">🧭 Explorer</td>
                    <td className="py-2 text-muted">100–200 XP</td>
                    <td className="py-2 text-muted">7-day streak</td>
                  </tr>
                  <tr className="border-b divider last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="py-2 font-medium">🎯 Achiever</td>
                    <td className="py-2 text-muted">200–400 XP</td>
                    <td className="py-2 text-muted">70 habits + 14-day streak</td>
                  </tr>
                  <tr className="border-b divider last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="py-2 font-medium">🛡️ Guardian</td>
                    <td className="py-2 text-muted">400–700 XP</td>
                    <td className="py-2 text-muted">150 habits + 30-day streak</td>
                  </tr>
                  <tr className="border-b divider last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="py-2 font-medium">💠 Elite</td>
                    <td className="py-2 text-muted">700–1000 XP</td>
                    <td className="py-2 text-muted">250 habits + 60-day streak</td>
                  </tr>
                  <tr className="border-b divider last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="py-2 font-medium">⚡ Titan</td>
                    <td className="py-2 text-muted">1000–1500 XP</td>
                    <td className="py-2 text-muted">500 habits + 90-day streak</td>
                  </tr>
                  <tr className="last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="py-2 font-medium">👑 Legend</td>
                    <td className="py-2 text-muted">1500+ XP</td>
                    <td className="py-2 text-muted">1000 habits + 180-day streak</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="glass rounded-xl p-4 mt-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
             <h3 className="font-bold text-red-600 dark:text-red-400 mb-3 text-xs uppercase tracking-wider flex items-center gap-1.5">
               <ShieldAlert size={14} /> Badge Protection & Penalties
             </h3>
             <ul className="text-xs text-soft space-y-2 list-disc pl-4">
               <li>
                 <strong className="text-gray-700 dark:text-gray-300 font-semibold">Permanent Badges:</strong> Once earned, you cannot lose a badge.
               </li>
               <li>
                 <strong className="text-gray-700 dark:text-gray-300 font-semibold">XP Floor:</strong> Your XP will never drop below the minimum floor of your highest unlocked badge.
               </li>
               <li>
                 <strong className="text-gray-700 dark:text-gray-300 font-semibold">Challenge Penalties:</strong> If you reach a new badge's XP tier but break your streak before completing the requirements, you'll receive a progressive penalty (-25, -50, or -75 XP).
               </li>
             </ul>
          </div>
        </div>
      </Modal>

    </div>
  );
}
