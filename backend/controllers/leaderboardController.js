import User from "../models/user.js";

const getBadge = (xp) => {
  if (xp >= 5000) return { name: "Legend", icon: "👑" };
  if (xp >= 2500) return { name: "Titan", icon: "⚔️" };
  if (xp >= 1000) return { name: "Elite", icon: "💎" };
  if (xp >= 500) return { name: "Achiever", icon: "🥇" };
  if (xp >= 100) return { name: "Grinder", icon: "🥈" };
  return { name: "Rookie", icon: "🥉" };
};

const getXpToNextRank = (xp) => {
  if (xp >= 5000) return 0; // Max badge
  if (xp >= 2500) return 5000 - xp;
  if (xp >= 1000) return 2500 - xp;
  if (xp >= 500) return 1000 - xp;
  if (xp >= 100) return 500 - xp;
  return 100 - xp;
};

export const getLeaderboard = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    // Fetch Top 10 users sorted by points DESC
    const topUsers = await User.find({})
      .sort({ points: -1 })
      .limit(10)
      .select("name userTag points avatar");

    const formattedTopUsers = topUsers.map((u, index) => ({
      _id: u._id,
      name: u.name,
      userTag: u.userTag,
      points: u.points,
      avatar: u.avatar,
      rank: index + 1,
      badge: getBadge(u.points)
    }));

    // Find current user's stats
    const currentUser = await User.findById(currentUserId).select("name userTag points avatar");
    
    // Find current user's true rank
    // Count how many users have strictly more points.
    // If points are tied, we could do tie-breaking by _id, but simple count is fine.
    const higherRankedCount = await User.countDocuments({ points: { $gt: currentUser.points } });
    
    // Check for ties and calculate the exact rank
    const tiesCount = await User.countDocuments({ 
      points: currentUser.points, 
      _id: { $lt: currentUser._id } // Tie-breaking by older account
    });

    const currentUserRank = higherRankedCount + tiesCount + 1;

    // XP needed to overtake the user directly above them
    let xpToOvertake = 0;
    if (currentUserRank > 1) {
      const userAbove = await User.findOne({ points: { $gt: currentUser.points } })
        .sort({ points: 1 }) // The smallest points that are strictly greater
        .select("points");

      if (userAbove) {
        xpToOvertake = userAbove.points - currentUser.points + 1;
      } else {
        // Tie scenario but the other user is ranked higher by _id
        xpToOvertake = 1;
      }
    }

    const currentUserData = {
      _id: currentUser._id,
      name: currentUser.name,
      userTag: currentUser.userTag,
      points: currentUser.points,
      avatar: currentUser.avatar,
      rank: currentUserRank,
      badge: getBadge(currentUser.points),
      xpToNextBadge: getXpToNextRank(currentUser.points),
      xpToOvertake: xpToOvertake
    };

    res.json({
      topUsers: formattedTopUsers,
      currentUser: currentUserData
    });
  } catch (err) {
    next(err);
  }
};
