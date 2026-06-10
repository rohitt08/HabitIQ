import User from "../models/user.js";

const BADGE_MAP = {
  "LEGEND": { name: "Legend", icon: "👑", floor: 1500 },
  "TITAN": { name: "Titan", icon: "⚡", floor: 1000 },
  "ELITE": { name: "Elite", icon: "💠", floor: 700 },
  "GUARDIAN": { name: "Guardian", icon: "🛡️", floor: 400 },
  "ACHIEVER": { name: "Achiever", icon: "🎯", floor: 200 },
  "EXPLORER": { name: "Explorer", icon: "🧭", floor: 100 },
  "FIRST_STEP": { name: "First Step", icon: "🌱", floor: 0 }
};

const getHighestBadge = (userBadges = []) => {
  if (userBadges.includes("LEGEND")) return BADGE_MAP["LEGEND"];
  if (userBadges.includes("TITAN")) return BADGE_MAP["TITAN"];
  if (userBadges.includes("ELITE")) return BADGE_MAP["ELITE"];
  if (userBadges.includes("GUARDIAN")) return BADGE_MAP["GUARDIAN"];
  if (userBadges.includes("ACHIEVER")) return BADGE_MAP["ACHIEVER"];
  if (userBadges.includes("EXPLORER")) return BADGE_MAP["EXPLORER"];
  return BADGE_MAP["FIRST_STEP"];
};

const getXpToNextRank = (xp) => {
  if (xp >= 1500) return 0; // Max badge
  if (xp >= 1000) return 1500 - xp;
  if (xp >= 700) return 1000 - xp;
  if (xp >= 400) return 700 - xp;
  if (xp >= 200) return 400 - xp;
  if (xp >= 100) return 200 - xp;
  return 100 - xp;
};

export const getLeaderboard = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    // Fetch Top 10 users sorted by points DESC
    const topUsers = await User.find({})
      .sort({ points: -1 })
      .limit(10)
      .select("name userTag points avatar badges");

    const formattedTopUsers = topUsers.map((u, index) => ({
      _id: u._id,
      name: u.name,
      userTag: u.userTag,
      points: u.points,
      avatar: u.avatar,
      rank: index + 1,
      badge: getHighestBadge(u.badges)
    }));

    // Find current user's stats
    const currentUser = await User.findById(currentUserId).select("name userTag points avatar avatarUrl badges");
    
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
      avatarUrl: currentUser.avatarUrl,
      rank: currentUserRank,
      badge: getHighestBadge(currentUser.badges),
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

export const getNearbyLeaderboard = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    // First check if current user has location enabled
    const currentUserBase = await User.findById(currentUserId);
    if (!currentUserBase || !currentUserBase.locationEnabled) {
      return res.status(403).json({ message: "Location sharing is disabled." });
    }

    // Only update location if lat/lng are provided in the query (active tracking)
    const { lat, lng } = req.query;
    let latitude = null;
    let longitude = null;
    
    if (lat && lng) {
      latitude = parseFloat(lat);
      longitude = parseFloat(lng);
      
      await User.findByIdAndUpdate(currentUserId, {
        location: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
      });
    } else if (currentUserBase.location?.coordinates?.length === 2) {
      // Use existing coordinates
      longitude = currentUserBase.location.coordinates[0];
      latitude = currentUserBase.location.coordinates[1];
    } else {
      return res.status(400).json({ message: "No location available. Please provide lat/lng." });
    }

    // 2. Find nearby users within 1000m
    const radiusInMeters = 1000;
    
    // We use aggregation to sort by points after filtering by geoNear
    const pipeline = [
      {
        $geoNear: {
          near: { type: "Point", coordinates: [longitude, latitude] },
          distanceField: "distance",
          maxDistance: radiusInMeters,
          spherical: true,
          query: { locationEnabled: true } // ONLY include users who opted in
        }
      },
      {
        $sort: { points: -1, _id: 1 } // Sort by points DESC
      }
    ];

    const nearbyUsers = await User.aggregate(pipeline);

    // Slice top 10 from the nearby subset
    const topUsers = nearbyUsers.slice(0, 10);
    const formattedTopUsers = topUsers.map((u, index) => ({
      _id: u._id,
      name: u.name,
      userTag: u.userTag,
      points: u.points,
      avatar: u.avatar,
      rank: index + 1,
      badge: getHighestBadge(u.badges)
    }));

    // Calculate current user's rank within this specific nearby subset
    const currentUserIndex = nearbyUsers.findIndex(u => u._id.toString() === currentUserId.toString());
    const currentUserRank = currentUserIndex !== -1 ? currentUserIndex + 1 : 0;
    const currentUserDoc = nearbyUsers[currentUserIndex] || await User.findById(currentUserId);

    let xpToOvertake = 0;
    if (currentUserRank > 1) {
      const userAbove = nearbyUsers[currentUserIndex - 1];
      if (userAbove) {
        xpToOvertake = userAbove.points - currentUserDoc.points + 1;
      }
    }

    const currentUserData = {
      _id: currentUserDoc._id,
      name: currentUserDoc.name,
      userTag: currentUserDoc.userTag,
      points: currentUserDoc.points,
      avatar: currentUserDoc.avatar,
      avatarUrl: currentUserDoc.avatarUrl,
      rank: currentUserRank,
      badge: getHighestBadge(currentUserDoc.badges),
      xpToNextBadge: getXpToNextRank(currentUserDoc.points),
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

export const getFriendsLeaderboard = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    
    // Find current user to get their friends array
    const currentUserBase = await User.findById(currentUserId);
    
    // The pool of users is the current user + their friends
    const userIds = [currentUserId, ...currentUserBase.friends];

    // Find all these users and sort by points
    const friendsUsers = await User.find({ _id: { $in: userIds } })
      .sort({ points: -1, _id: 1 })
      .select("name userTag points avatar avatarUrl badges");

    // Slice top 10 from the friends subset
    const topUsers = friendsUsers.slice(0, 10);
    const formattedTopUsers = topUsers.map((u, index) => ({
      _id: u._id,
      name: u.name,
      userTag: u.userTag,
      points: u.points,
      avatar: u.avatar,
      avatarUrl: u.avatarUrl,
      rank: index + 1,
      badge: getHighestBadge(u.badges)
    }));

    // Calculate current user's rank within this specific friends subset
    const currentUserIndex = friendsUsers.findIndex(u => u._id.toString() === currentUserId.toString());
    const currentUserRank = currentUserIndex !== -1 ? currentUserIndex + 1 : 0;
    const currentUserDoc = friendsUsers[currentUserIndex] || currentUserBase;

    let xpToOvertake = 0;
    if (currentUserRank > 1) {
      const userAbove = friendsUsers[currentUserIndex - 1];
      if (userAbove) {
        xpToOvertake = userAbove.points - currentUserDoc.points + 1;
      }
    }

    const currentUserData = {
      _id: currentUserDoc._id,
      name: currentUserDoc.name,
      userTag: currentUserDoc.userTag,
      points: currentUserDoc.points,
      avatar: currentUserDoc.avatar,
      avatarUrl: currentUserDoc.avatarUrl,
      rank: currentUserRank,
      badge: getHighestBadge(currentUserDoc.badges),
      xpToNextBadge: getXpToNextRank(currentUserDoc.points),
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

export const toggleLocation = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { enabled, lat, lng } = req.body;

    if (enabled === false) {
      // Instantly disable and wipe location data
      await User.findByIdAndUpdate(currentUserId, {
        $set: { locationEnabled: false },
        $unset: { location: "" }
      });
      try {
        const { getIo } = await import("../socket.js");
        getIo().emit("leaderboard_update");
      } catch(e) {}
      return res.json({ message: "Location sharing disabled", locationEnabled: false });
    }

    if (enabled === true) {
      if (!lat || !lng) {
        return res.status(400).json({ message: "Coordinates required to enable location sharing" });
      }

      await User.findByIdAndUpdate(currentUserId, {
        $set: {
          locationEnabled: true,
          location: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
          }
        }
      });
      try {
        const { getIo } = await import("../socket.js");
        getIo().emit("leaderboard_update");
      } catch(e) {}
      return res.json({ message: "Location sharing enabled", locationEnabled: true });
    }

    return res.status(400).json({ message: "Invalid request" });
  } catch (err) {
    next(err);
  }
};
