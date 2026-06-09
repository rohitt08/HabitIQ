import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/user.js";

const generateUniqueUserTag = async () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let tag = "";
  let isUnique = false;

  while (!isUnique) {
    tag = "#";
    for (let i = 0; i < 6; i++) {
      tag += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    const existingUser = await User.findOne({ userTag: tag });
    if (!existingUser) {
      isUnique = true;
    }
  }

  return tag;
};

const updateUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const users = await User.find({ userTag: { $exists: false } });
    console.log(`Found ${users.length} users without a tag.`);

    for (const user of users) {
      user.userTag = await generateUniqueUserTag();
      await user.save();
      console.log(`Updated user ${user.name} with tag ${user.userTag}`);
    }

    console.log("All existing users updated successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error updating users:", err);
    process.exit(1);
  }
};

updateUsers();
