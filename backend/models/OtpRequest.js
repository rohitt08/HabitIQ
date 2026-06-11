import mongoose from "mongoose";

const otpRequestSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
  },
  count: {
    type: Number,
    default: 1,
  },
}, { timestamps: true });

// TTL index to automatically remove documents after roughly 2 days to save space
otpRequestSchema.index({ createdAt: 1 }, { expireAfterSeconds: 172800 });
// Compound index for fast lookups
otpRequestSchema.index({ email: 1, date: 1 }, { unique: true });

export default mongoose.model("OtpRequest", otpRequestSchema);
