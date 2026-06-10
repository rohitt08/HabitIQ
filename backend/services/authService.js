import userRepository from "../repositories/userRepository.js";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Habit from "../models/habit.js";
import HabitLog from "../models/habitlog.js";
import AIInsight from "../models/AIInsight.js";
import Otp from "../models/Otp.js";
import OtpRequest from "../models/OtpRequest.js";
import { sendOtpEmail } from "./emailService.js";

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

  async sendOtp(email) {
    if (!email || typeof email !== "string" || !email.trim()) {
      throw new Error("Valid email is required");
    }
    
    const normalizedEmail = email.toLowerCase();
    const userExists = await userRepository.findByEmail(normalizedEmail);
    if (userExists) {
      throw new Error("User already exists");
    }

    // Check daily limit
    const today = new Date().toISOString().split('T')[0];
    let otpRequest = await OtpRequest.findOne({ email: normalizedEmail, date: today });

    if (otpRequest && otpRequest.count >= 5) {
      throw new Error("Daily OTP limit reached. Please try again tomorrow.");
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Clean up old OTPs for this email
    await Otp.deleteMany({ email: normalizedEmail });

    // Create new OTP
    await Otp.create({ email: normalizedEmail, otp });

    // Update request count
    if (otpRequest) {
      otpRequest.count += 1;
      await otpRequest.save();
    } else {
      await OtpRequest.create({ email: normalizedEmail, date: today });
    }

    // Dispatch email
    await sendOtpEmail(normalizedEmail, otp);
    return true;
  }

  async verifyOtp(email, otp) {
    if (!email || !otp) {
      throw new Error("Email and OTP are required");
    }

    const record = await Otp.findOne({ email: email.toLowerCase(), otp });
    if (!record) {
      throw new Error("Invalid or expired verification code");
    }
    
    return true;
  }

  async registerUser(userData) {
    const { name, email, password } = userData;

    if (!name || typeof name !== "string" || !name.trim()) {
      throw new Error("Valid name is required");
    }
    if (!email || typeof email !== "string" || !email.trim()) {
      throw new Error("Valid email is required");
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      throw new Error("Valid password (at least 8 characters) is required");
    }

    // Verify OTP
    if (!userData.otp) {
      throw new Error("Verification code is required");
    }
    await this.verifyOtp(email, userData.otp);

    const userExists = await userRepository.findByEmail(email.toLowerCase());
    if (userExists) {
      throw new Error("User already exists");
    }

    // Consume the OTP
    await Otp.deleteMany({ email: email.toLowerCase() });

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
      if (typeof updateData.name === "string" && updateData.name.trim() !== "") {
        user.name = updateData.name;
        user.avatar = updateData.name.charAt(0).toUpperCase();
      }
    }

    if (updateData.morningMotivation !== undefined) {
      user.morningMotivation = Boolean(updateData.morningMotivation);
    }

    if (updateData.avatarUrl !== undefined) {
      user.avatarUrl = updateData.avatarUrl;
    }

    await userRepository.save(user);
    return user;
  }
  async updateSettings(userId, settings) {
    const safeSettings = {};
    if (settings.reminderTime !== undefined) safeSettings.reminderTime = settings.reminderTime;
    if (settings.morningMotivation !== undefined) safeSettings.morningMotivation = Boolean(settings.morningMotivation);

    if (Object.keys(safeSettings).length === 0) {
      return await userRepository.findById(userId);
    }

    return await userRepository.updateSettings(userId, safeSettings);
  }

  async savePushSubscription(userId, subscription) {
    return await userRepository.updateSettings(userId, { pushSubscription: subscription });
  }

  async removePushSubscription(userId) {
    return await userRepository.updateSettings(userId, { pushSubscription: null });
  }

  async deleteAccount(userId) {
    await Habit.deleteMany({ userId });
    await HabitLog.deleteMany({ userId });
    await AIInsight.deleteMany({ userId });
    await User.findByIdAndDelete(userId);
  }
}

export default new AuthService();
