import authService from "../services/authService.js";

const getCookieOptions = () => {
  const isHttps = process.env.CLIENT_URL?.startsWith("https");
  return {
    httpOnly: true,
    secure: !!isHttps,
    sameSite: isHttps ? "none" : "lax",
  };
};

export const register = async (req, res, next) => {
  try {
    const { user, token } = await authService.registerUser(req.body);

    res.cookie("jwt", token, {
      ...getCookieOptions(),
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ user });
  } catch (err) {
    if (err.message === "User already exists") {
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

    res.json({ user });
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
    const user = await authService.updateProfile(req.user._id, req.body);
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

export const getVapidPublicKey = (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || "BL7jXBI0e9GRORf3BgPd4fbwElOr1am9bsuQyKB3JUUX0BDfjTjQR-2c2iOzMWzXHky6IuzM16faktGQqcNMxWg" });
};
