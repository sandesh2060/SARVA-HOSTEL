require("dotenv").config();

const mongoose = require("mongoose");
const { Hostel, User } = require("../models");

const HOSTEL_NAME = "Shree Haleshi Boys Hostel";

const PRIMARY_OWNER_EMAIL = "sharmasandesh66@gmail.com";
const SECOND_OWNER_EMAIL = "karnnavnit123@gmail.com";
const OLD_OWNER_EMAIL = "owner@sarva.cloud";

const normalizeEmail = (value) =>
  String(value || "").trim().toLowerCase();

async function run() {
  try {
if (!process.env.HOSTEL_MONGODB_URI) {
  throw new Error("HOSTEL_MONGODB_URI is missing.");
}

await mongoose.connect(process.env.HOSTEL_MONGODB_URI);

    console.log("Connected to MongoDB.");

    // ---------------------------------------------------------
    // 1. Find the exact hostel
    // ---------------------------------------------------------

    const hostel = await Hostel.findOne({
      name: HOSTEL_NAME,
    });

    if (!hostel) {
      throw new Error(
        `Hostel not found: "${HOSTEL_NAME}". No changes were made.`
      );
    }

    console.log(`Hostel found: ${hostel.name}`);
    console.log(`Hostel ID: ${hostel._id}`);

    // ---------------------------------------------------------
    // 2. Find/create Sandesh as owner
    // ---------------------------------------------------------

    let sandesh = await User.findOne({
      hostelId: hostel._id,
      email: normalizeEmail(PRIMARY_OWNER_EMAIL),
    });

    if (!sandesh) {
      sandesh = await User.create({
        hostelId: hostel._id,
        name: "Sandesh Sharma",
        email: normalizeEmail(PRIMARY_OWNER_EMAIL),
        role: "owner",
        active: true,
      });

      console.log(`Created owner: ${PRIMARY_OWNER_EMAIL}`);
    } else {
      sandesh.role = "owner";
      sandesh.active = true;
      await sandesh.save();

      console.log(`Updated owner: ${PRIMARY_OWNER_EMAIL}`);
    }

    // ---------------------------------------------------------
    // 3. Find/create Navnit as owner
    // ---------------------------------------------------------

    let navnit = await User.findOne({
      hostelId: hostel._id,
      email: normalizeEmail(SECOND_OWNER_EMAIL),
    });

    if (!navnit) {
      navnit = await User.create({
        hostelId: hostel._id,
        name: "Navnit",
        email: normalizeEmail(SECOND_OWNER_EMAIL),
        role: "owner",
        active: true,
      });

      console.log(`Created owner: ${SECOND_OWNER_EMAIL}`);
    } else {
      navnit.role = "owner";
      navnit.active = true;
      await navnit.save();

      console.log(`Updated owner: ${SECOND_OWNER_EMAIL}`);
    }

    // ---------------------------------------------------------
    // 4. Set Sandesh as primary Hostel.owner
    // ---------------------------------------------------------

    hostel.owner = sandesh._id;
    await hostel.save();

    console.log(
      `Primary hostel owner set to: ${PRIMARY_OWNER_EMAIL}`
    );

    // ---------------------------------------------------------
    // 5. Delete ONLY the old owner from THIS hostel
    // ---------------------------------------------------------

    const deletedOldOwner = await User.findOneAndDelete({
      hostelId: hostel._id,
      email: normalizeEmail(OLD_OWNER_EMAIL),
    });

    if (deletedOldOwner) {
      console.log(`Deleted old owner: ${OLD_OWNER_EMAIL}`);
    } else {
      console.log(
        `Old owner not found in this hostel: ${OLD_OWNER_EMAIL}`
      );
    }

    // ---------------------------------------------------------
    // 6. Verify final owners
    // ---------------------------------------------------------

    const owners = await User.find({
      hostelId: hostel._id,
      role: "owner",
    })
      .select("_id name email role active")
      .lean();

    console.log("\n========================================");
    console.log("FINAL HOSTEL OWNER CONFIGURATION");
    console.log("========================================");

    console.log(`Hostel: ${hostel.name}`);
    console.log(`Hostel ID: ${hostel._id}`);
    console.log(`Primary owner ID: ${hostel.owner}`);

    console.table(
      owners.map((owner) => ({
        id: String(owner._id),
        name: owner.name,
        email: owner.email,
        role: owner.role,
        active: owner.active,
      }))
    );

    const requiredEmails = new Set([
      PRIMARY_OWNER_EMAIL,
      SECOND_OWNER_EMAIL,
    ]);

    const validOwners = owners.filter((owner) =>
      requiredEmails.has(normalizeEmail(owner.email))
    );

    if (validOwners.length !== 2) {
      throw new Error(
        "Owner verification failed. Expected exactly the two requested owners."
      );
    }

    const oldOwnerStillExists = owners.some(
      (owner) =>
        normalizeEmail(owner.email) ===
        normalizeEmail(OLD_OWNER_EMAIL)
    );

    if (oldOwnerStillExists) {
      throw new Error(
        `${OLD_OWNER_EMAIL} still exists as an owner.`
      );
    }

    console.log("\nSUCCESS");
    console.log(`1. ${PRIMARY_OWNER_EMAIL}`);
    console.log(`2. ${SECOND_OWNER_EMAIL}`);
    console.log(`${OLD_OWNER_EMAIL} removed.`);

  } catch (error) {
    console.error("\nSeed failed:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

run();