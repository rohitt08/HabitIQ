import { useState, useEffect, useRef } from "react";
import api from "../api/axios.js";
import { Users, UserPlus, UserMinus, Search, Loader2 } from "lucide-react";
import Modal from "./Modal.jsx";
import { useSocketStore as useSocket } from "../store/socketStore.js";

export default function FriendsManager() {
  const { socket } = useSocket();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTag, setSearchTag] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Search result state
  const [searchResult, setSearchResult] = useState(null);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState(null);

  const fetchRef = useRef(null);

  const fetchFriends = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await api.get("/friends");
      setFriends(res.data);
    } catch (err) {
      console.error("Error fetching friends:", err);
      if (showLoading) setError("Your friends seem to be hiding right now! Try refreshing.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchRef.current = fetchFriends;
    // eslint-disable-next-line
    fetchFriends();
    
    // Listen for external updates (optional, if we want sync from elsewhere)
    const handleSync = () => fetchFriends(false);
    window.addEventListener("friends_updated", handleSync);
    
    return () => {
      window.removeEventListener("friends_updated", handleSync);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    const handleUpdate = () => {
      if (fetchRef.current) fetchRef.current(false);
    };
    
    socket.on("friends_update", handleUpdate);
    socket.on("leaderboard_update", handleUpdate); // Also sync on leaderboard changes
    
    return () => {
      socket.off("friends_update", handleUpdate);
      socket.off("leaderboard_update", handleUpdate);
    };
  }, [socket]);

    const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTag.trim()) return;

    try {
      setSearchLoading(true);
      setError("");
      setSearchResult(null);

      const res = await api.get(`/friends/search?tag=${encodeURIComponent(searchTag)}`);
      setSearchResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to find user");
    } finally {
      setSearchLoading(false);
    }
  };

  const confirmAddFriend = async () => {
    if (!searchResult) return;
    try {
      const res = await api.post("/friends/add", { userTag: searchResult.userTag });
      setFriends([...friends, res.data]);
      setSearchResult(null);
      setSearchTag("");
      setAddModalOpen(false);
      
      // Notify other components (like Leaderboard) to sync
      window.dispatchEvent(new Event("friends_updated"));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add friend");
      setAddModalOpen(false);
    }
  };

  const confirmRemoveFriend = async () => {
    if (!userToRemove) return;
    try {
      await api.delete(`/friends/remove/${userToRemove._id}`);
      setFriends(friends.filter(f => f._id !== userToRemove._id));
      setRemoveModalOpen(false);
      setUserToRemove(null);
      
      // Notify other components (like Leaderboard) to sync
      window.dispatchEvent(new Event("friends_updated"));
    } catch (err) {
      console.error(err);
      setError("Failed to remove friend.");
      setRemoveModalOpen(false);
    }
  };

  return (
    <div className="card p-5 animate-fade-in flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
        <Users className="text-brand-500" size={20} />
        Friends
      </h2>

      <form onSubmit={handleSearch} className="mb-6 relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
            <Search size={16} />
          </div>
          <input
            id="friend-search-input"
            type="text"
            placeholder="Search #userTag..."
            value={searchTag}
            onChange={(e) => setSearchTag(e.target.value)}
            className="w-full pl-9 pr-10 py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
            disabled={searchLoading}
          />
          <button
            type="submit"
            disabled={!searchTag.trim() || searchLoading}
            className="absolute inset-y-1 right-1 px-3 bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] rounded-lg hover:bg-[var(--hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {searchLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          </button>
        </div>
        
        {error && <p className="text-red-500 text-xs mt-2 animate-slide-up">{error}</p>}
      </form>

      {/* Search Result Card */}
      {searchResult && (
        <div className="mb-4 p-3 rounded-xl border border-brand-500/30 bg-brand-50 dark:bg-brand-500/10 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-brand-500 text-white flex items-center justify-center font-bold overflow-hidden shrink-0">
              {searchResult.avatarUrl ? (
                <img src={searchResult.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                searchResult.avatar
              )}
            </div>
            <div>
              <div className="font-semibold text-sm text-[var(--text)]">{searchResult.name}</div>
              <div className="text-xs font-mono text-brand-500">#{searchResult.userTag?.replace(/^#/, "")}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="p-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
            title="Add friend"
          >
            <UserPlus size={16} />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-3 custom-scrollbar max-h-[420px] min-h-[200px]">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-muted">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : friends.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center px-4 border border-dashed rounded-xl border-[var(--border)] bg-[var(--surface)] text-muted">
            <Users size={24} className="mb-2 opacity-50" />
            <p className="text-sm">No friends added yet.</p>
            <p className="text-xs opacity-70 mt-1">Search for a tag above!</p>
          </div>
        ) : (
          friends.map((friend) => (
            <div 
              key={friend._id} 
              className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] transition-all hover:border-gray-300 dark:hover:border-gray-600 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-brand-500 text-white flex items-center justify-center font-bold shadow-md shadow-brand-500/10 overflow-hidden shrink-0">
                  {friend.avatarUrl ? (
                    <img src={friend.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    friend.avatar
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm truncate text-[var(--text)]">{friend.name}</div>
                  <div className="text-xs font-mono text-brand-500 truncate">#{friend.userTag?.replace(/^#/, "")}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-sm font-bold text-brand-600 dark:text-brand-400">
                  {friend.points} <span className="text-[10px] uppercase font-medium text-muted">XP</span>
                </div>
              
                <button
                  onClick={() => {
                    setUserToRemove(friend);
                    setRemoveModalOpen(true);
                  }}
                  className="p-2 text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Remove friend"
                >
                  <UserMinus size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Friend Modal */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add as friend?"
        maxWidth="max-w-sm"
      >
        {searchResult && (
          <>
            <p className="text-sm text-soft mt-2">
              Are you sure you want to add <b>{searchResult.name}</b> (<b>#{searchResult.userTag?.replace(/^#/, "")}</b>) to your friends list?
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="btn-secondary"
                onClick={() => setAddModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={confirmAddFriend}
              >
                Add
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Remove Friend Modal */}
      <Modal
        open={removeModalOpen}
        onClose={() => {
          setRemoveModalOpen(false);
          setUserToRemove(null);
        }}
        title="Remove friend?"
        maxWidth="max-w-sm"
      >
        {userToRemove && (
          <>
            <p className="text-sm text-soft mt-2">
              Are you sure you want to remove <b>{userToRemove.name}</b> from your friends list? They will also be removed from your leaderboard.
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="btn-secondary"
                onClick={() => {
                  setRemoveModalOpen(false);
                  setUserToRemove(null);
                }}
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 px-4 py-2.5 text-sm font-medium text-white hover:brightness-110 shadow-lg shadow-rose-500/30 transition"
                onClick={confirmRemoveFriend}
              >
                Yes, Remove
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
