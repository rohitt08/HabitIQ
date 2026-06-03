import userRepository from "../repositories/userRepository.js";
import jwt from "jsonwebtoken";

class AuthService {
  signToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
  }

  async registerUser(userData) {
    const { name, email, password } = userData;
    const userExists = await userRepository.findByEmail(email.toLowerCase());
    if (userExists) {
      throw new Error("User already exists");
    }

    const user = await userRepository.create({
      name,
      email: email.toLowerCase(),
      password,
      avatar: name.charAt(0).toUpperCase(),
    });

    const token = this.signToken(user._id);
    return { user, token };
  }

  async loginUser(email, password) {
    const user = await userRepository.findByEmail(email.toLowerCase());

    if (!user || !(await user.matchPassword(password))) {
      throw new Error("Invalid email or password");
    }

    const token = this.signToken(user._id);
    return { user, token };
  }

  async updateProfile(userId, updateData) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error("User not found");

    if (updateData.name !== undefined) {
      user.name = updateData.name;
      user.avatar = updateData.name.charAt(0).toUpperCase();
    }

    if (updateData.morningMotivation !== undefined) {
      user.morningMotivation = updateData.morningMotivation;
    }

    await userRepository.save(user);
    return user;
  }
}

export default new AuthService();
