import userRepository from "../repositories/userRepository.js";
import jwt from "jsonwebtoken";

class AuthService {
  signToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
  }

  async generateUniqueUserTag() {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let tag = "";
    let isUnique = false;

    while (!isUnique) {
      tag = "#";
      for (let i = 0; i < 6; i++) {
        tag += characters.charAt(Math.floor(Math.random() * characters.length));
      }

      const existingUser = await userRepository.findByUserTag(tag);
      if (!existingUser) {
        isUnique = true;
      }
    }

    return tag;
  }

  async registerUser(userData) {
    const { name, email, password } = userData;
    const userExists = await userRepository.findByEmail(email.toLowerCase());
    if (userExists) {
      throw new Error("User already exists");
    }

    const userTag = await this.generateUniqueUserTag();

    const user = await userRepository.create({
      name,
      email: email.toLowerCase(),
      password,
      avatar: name.charAt(0).toUpperCase(),
      userTag,
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
  async updateSettings(userId, settings) {
    return await userRepository.updateSettings(userId, settings);
  }

  async savePushSubscription(userId, subscription) {
    return await userRepository.updateSettings(userId, { pushSubscription: subscription });
  }
}

export default new AuthService();
