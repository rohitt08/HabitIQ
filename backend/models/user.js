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

    friends: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "user"
    }],

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

    totalCompletedHabits: {
      type: Number,
      default: 0,
    },



    challengeFailures: {
      type: Number,
      default: 0,
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

    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },

    locationEnabled: {
      type: Boolean,
      default: false,
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
userSchema.index({ location: "2dsphere" });

export default mongoose.model("user", userSchema);