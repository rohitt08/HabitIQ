import authService from "../services/authService.js";

const getCookieOptions = () => {
  const isHttps = process.env.CLIENT_URL?.startsWith("https");
  return {
    httpOnly: true,
    secure: !!isHttps,
    sameSite: isHttps ? "none" : "lax",
  };
};

export const sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.sendOtp(email);
    res.json({ message: "Verification code sent to email" });
  } catch (err) {
    if (err.message === "User already exists" || err.message === "Valid email is required") {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    await authService.verifyOtp(email, otp);
    res.json({ message: "Code verified successfully" });
  } catch (err) {
    if (err.message === "Invalid or expired verification code" || err.message === "Email and OTP are required") {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

export const register = async (req, res, next) => {
  try {
    const { user, token } = await authService.registerUser(req.body);

    res.cookie("jwt", token, {
      ...getCookieOptions(),
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ user, token });
  } catch (err) {
    if (
      err.message === "User already exists" ||
      err.message === "Valid name is required" ||
      err.message === "Valid email is required" ||
      err.message === "Verification code is required" ||
      err.message === "Invalid or expired verification code" ||
      err.message === "Valid password (at least 8 characters) is required"
    ) {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const { user, token } = await authService.loginUser(email, password);

    res.cookie("jwt", token, {
      ...getCookieOptions(),
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({ user, token });
  } catch (err) {
    if (err.message === "Invalid email or password") {
      return res.status(401).json({ message: err.message });
    }
    next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    if (req.file && req.file.path) {
      updateData.avatarUrl = req.file.path;
    }
    
    // Parse morningMotivation if it was sent as a string (from FormData)
    if (typeof updateData.morningMotivation === "string") {
      updateData.morningMotivation = updateData.morningMotivation === "true";
    }

    const user = await authService.updateProfile(req.user._id, updateData);
    res.json({ user });
  } catch (err) {
    if (err.message === "User not found") {
      return res.status(404).json({ message: err.message });
    }
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    res.cookie("jwt", "", {
      ...getCookieOptions(),
      expires: new Date(0),
    });
    res.json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const user = await authService.updateSettings(req.user._id, req.body);
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

export const savePushSubscription = async (req, res, next) => {
  try {
    const user = await authService.savePushSubscription(req.user._id, req.body);
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

export const removePushSubscription = async (req, res, next) => {
  try {
    const user = await authService.removePushSubscription(req.user._id);
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

export const getVapidPublicKey = (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || "BL7jXBI0e9GRORf3BgPd4fbwElOr1am9bsuQyKB3JUUX0BDfjTjQR-2c2iOzMWzXHky6IuzM16faktGQqcNMxWg" });
};

export const deleteAccount = async (req, res, next) => {
  try {
    await authService.deleteAccount(req.user._id);
    res.cookie("jwt", "", {
      ...getCookieOptions(),
      expires: new Date(0),
    });
    res.json({ message: "Account deleted" });
  } catch (err) {
    next(err);
  }
};
