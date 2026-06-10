import User from "../models/user.js";

// @desc    Get current user's friends
// @route   GET /api/friends
// @access  Private
export const getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("friends", "name userTag avatar avatarUrl points");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.friends);
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Search for a user by userTag
// @route   GET /api/friends/search
// @access  Private
export const searchUser = async (req, res) => {
  try {
    let { tag } = req.query;
    
    if (!tag) {
      return res.status(400).json({ message: "Please provide a tag to search" });
    }
    
    if (tag.startsWith("#") || tag.startsWith("@")) {
      tag = tag.substring(1);
    }
    
    const searchStr = tag.startsWith("#") ? tag : "#" + tag;

    const userToFind = await User.findOne({ userTag: searchStr }).select("name userTag avatar points");
    
    if (!userToFind) {
      return res.status(404).json({ message: "User not found with that tag" });
    }

    if (userToFind._id.toString() === req.user.id) {
      return res.status(400).json({ message: "You cannot search yourself" });
    }

    res.json(userToFind);
  } catch (error) {
    console.error("Error searching user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Add a friend by userTag
// @route   POST /api/friends/add
// @access  Private
export const addFriend = async (req, res) => {
  try {
    let { userTag } = req.body;
    
    if (!userTag) {
      return res.status(400).json({ message: "Please provide a userTag" });
    }
    
    // Support adding by @userTag or just userTag
    if (userTag.startsWith("@")) {
      userTag = userTag.substring(1);
    }

    // Find the user to add
    const searchStr = userTag.startsWith("#") ? userTag : "#" + userTag;
    const friendToAdd = await User.findOne({ userTag: searchStr });
    
    if (!friendToAdd) {
      return res.status(404).json({ message: "User not found with that tag" });
    }

    if (friendToAdd._id.toString() === req.user.id) {
      return res.status(400).json({ message: "You cannot add yourself" });
    }

    const user = await User.findById(req.user.id);
    
    if (user.friends.includes(friendToAdd._id)) {
      return res.status(400).json({ message: "User is already your friend" });
    }

    // Mutual add: Add friend to user's friends list
    user.friends.push(friendToAdd._id);
    await user.save();
    
    // Add user to friend's friends list
    if (!friendToAdd.friends.includes(user._id)) {
      friendToAdd.friends.push(user._id);
      await friendToAdd.save();
    }

    try {
      const { getIo } = await import("../socket.js");
      getIo().to(user._id.toString()).emit("friends_update");
      getIo().to(friendToAdd._id.toString()).emit("friends_update");
      getIo().emit("leaderboard_update");
    } catch(e) {}

    // Return the newly added friend object
    res.status(201).json({
      _id: friendToAdd._id,
      name: friendToAdd.name,
      userTag: friendToAdd.userTag,
      avatar: friendToAdd.avatar,
      avatarUrl: friendToAdd.avatarUrl,
      points: friendToAdd.points
    });
  } catch (error) {
    console.error("Error adding friend:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Remove a friend
// @route   DELETE /api/friends/remove/:id
// @access  Private
export const removeFriend = async (req, res) => {
  try {
    const friendId = req.params.id;
    const user = await User.findById(req.user.id);
    
    if (!user.friends.includes(friendId)) {
      return res.status(400).json({ message: "User is not in your friends list" });
    }

    // Mutual remove: Remove friend from user's friends list
    user.friends = user.friends.filter(id => id.toString() !== friendId);
    await user.save();
    
    // Remove user from friend's friends list
    const friend = await User.findById(friendId);
    if (friend) {
      friend.friends = friend.friends.filter(id => id.toString() !== user._id.toString());
      await friend.save();
    }
    
    try {
      const { getIo } = await import("../socket.js");
      getIo().to(user._id.toString()).emit("friends_update");
      if (friend) getIo().to(friend._id.toString()).emit("friends_update");
      getIo().emit("leaderboard_update");
    } catch(e) {}

    res.json({ message: "Friend removed successfully", id: friendId });
  } catch (error) {
    console.error("Error removing friend:", error);
    res.status(500).json({ message: "Server error" });
  }
};
