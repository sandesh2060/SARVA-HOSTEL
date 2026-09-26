require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const {
  Hostel,
  User,
} = require("../models");

async function seedHostelOwner() {
  try {
    if (!process.env.HOSTEL_MONGODB_URI) {
      throw new Error("HOSTEL_MONGODB_URI is missing from .env");
    }

    await mongoose.connect(process.env.HOSTEL_MONGODB_URI);

    console.log("MongoDB connected");

    // ─────────────────────────────────────
    // HOSTEL
    // ─────────────────────────────────────

    let hostel = await Hostel.findOne({
      slug: "sarva-demo-hostel",
    });

    if (!hostel) {
      hostel = await Hostel.create({
        name: "SARVA Demo Hostel",
        slug: "sarva-demo-hostel",

        status: "approved",
        plan: "advanced",

        email: "hostel@sarva.cloud",
        phone: "9800000000",

        address: {
          city: "Kathmandu",
          country: "Nepal",
        },

        currency: "NPR",
        timezone: "Asia/Kathmandu",
      });

      console.log("Hostel created:", hostel.name);
    } else {
      console.log("Hostel already exists:", hostel.name);
    }

    // ─────────────────────────────────────
    // OWNER
    // ─────────────────────────────────────

    const email = "owner@sarva.cloud";
    const password = "Owner@123";

    let owner = await User.findOne({
      email,
      hostelId: hostel._id,
    });

    if (!owner) {
      const passwordHash = await bcrypt.hash(password, 12);

      owner = await User.create({
        hostelId: hostel._id,

        name: "SARVA Hostel Owner",
        email,

        passwordHash,

        role: "owner",
        isActive: true,
      });

      console.log("Owner created");
    } else {
      console.log("Owner already exists");
    }

    console.log("");
    console.log("=================================");
    console.log(" SARVA HOSTEL OWNER");
    console.log("=================================");
    console.log(`Hostel   : ${hostel.name}`);
    console.log(`Plan     : ${hostel.plan}`);
    console.log(`Status   : ${hostel.status}`);
    console.log(`Email    : ${email}`);
    console.log(`Password : ${password}`);
    console.log("=================================");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:");
    console.error(error);

    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

seedHostelOwner();