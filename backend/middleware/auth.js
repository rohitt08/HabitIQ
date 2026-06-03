import jwt from "jsonwebtoken";
import userRepository from "../repositories/userRepository.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res
        .status(401)
        .json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userRepository.findById(decoded.id);

    if (!user) {
      return res
        .status(401)
        .json({ message: "User no longer exists" });
    }

    req.user = user;

    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Not authorized, token invalid" });
  }
};