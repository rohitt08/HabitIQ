import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
    },

    avatar: {
      type: String,
      default: "",
    },

    avatarUrl: {
      type: String,
      default: null,
    },

    morningMotivation: {
      type: Boolean,
      default: false,
    },

    points: {
      type: Number,
      default: 0,
    },

    level: {
      type: Number,
      default: 1,
    },

    badges: {
      type: [String],
      default: [],
    },

    dailyXp: {
      type: Number,
      default: 0,
    },

    dailyXpDate: {
      type: String,
      default: "",
    },

    pushSubscription: {
      type: Object,
      default: null,
    },

    reminderTime: {
      type: String,
      default: "08:00",
    },

    userTag: {
      type: String,
      unique: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

userSchema.index({ points: -1 });

export default mongoose.model("user", userSchema);