import User from "../models/user.js";

class UserRepository {
  async findById(id) {
    return await User.findById(id);
  }

  async findByEmail(email) {
    return await User.findOne({ email });
  }

  async create(userData) {
    return await User.create(userData);
  }

  async save(user) {
    return await user.save();
  }
}

export default new UserRepository();
