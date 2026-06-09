import User from "../models/user.js";

class UserRepository {
  async findById(id) {
    return await User.findById(id);
  }

  async findByEmail(email) {
    return await User.findOne({ email });
  }

  async findByUserTag(userTag) {
    return await User.findOne({ userTag });
  }

  async create(userData) {
    return await User.create(userData);
  }

  async save(user) {
    return await user.save();
  }

  async updatePointsAndLevel(userId, pointsDelta) {
    const user = await this.findById(userId);
    if (!user) return null;

    user.points += pointsDelta;
    if (user.points < 0) user.points = 0;
    
    // Simple leveling logic: 100 points per level
    user.level = Math.floor(user.points / 100) + 1;
    
    return await this.save(user);
  }

  async updateSettings(userId, settings) {
    return await User.findByIdAndUpdate(userId, { $set: settings }, { new: true });
  }
}

export default new UserRepository();
