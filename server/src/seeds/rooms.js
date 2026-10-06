require("dotenv").config();

const mongoose = require("mongoose");
const { Hostel, Room, Bed } = require("../models");

const BUILDING = process.env.SEED_BUILDING_NAME || "Main Building";

const ROOM_PLAN = [
  // Ground Floor
  { floor: "Ground", name: "1", capacity: 2 },
  { floor: "Ground", name: "2", capacity: 2 },
  { floor: "Ground", name: "3", capacity: 1 },

  // 1st Floor
  { floor: "1", name: "1", capacity: 3 },
  { floor: "1", name: "2", capacity: 3 },
  { floor: "1", name: "3", capacity: 2 },

  // 2nd Floor
  { floor: "2", name: "1", capacity: 5 },
];

function roomType(capacity) {
  if (capacity === 1) return "Single Seater";
  return `${capacity} Seater`;
}

async function resolveHostel() {
  const slug = process.env.HOSTEL_SLUG?.trim();

  if (slug) {
    const hostel = await Hostel.findOne({ slug });

    if (!hostel) {
      throw new Error(`No hostel found with HOSTEL_SLUG="${slug}"`);
    }

    return hostel;
  }

  const hostels = await Hostel.find({})
    .select("_id name slug")
    .limit(2);

  if (hostels.length === 0) {
    throw new Error("No hostel exists. Create the hostel first.");
  }

  if (hostels.length > 1) {
    throw new Error(
      "More than one hostel exists. Set HOSTEL_SLUG before running this seed."
    );
  }

  return hostels[0];
}

async function seedRooms() {
  try {
    if (!process.env.HOSTEL_MONGODB_URI) {
      throw new Error("HOSTEL_MONGODB_URI is missing from .env");
    }

    await mongoose.connect(process.env.HOSTEL_MONGODB_URI);

    console.log("MongoDB connected");

    const hostel = await resolveHostel();

    console.log(`Hostel   : ${hostel.name}`);
    console.log(`Building : ${BUILDING}`);
    console.log("");

    let created = 0;
    let bedsCreated = 0;

    for (const spec of ROOM_PLAN) {
      const filter = {
        hostelId: hostel._id,
        building: BUILDING,
        floor: spec.floor,
        name: spec.name,
      };

      const existing = await Room.findOne(filter);

      if (existing) {
        throw new Error(
          `Room already exists: ${BUILDING} / Floor ${spec.floor} / Room ${spec.name}. Delete the old seeded rooms first, then run this seed again.`
        );
      }

      const room = await Room.create({
        ...filter,
        type: roomType(spec.capacity),
        capacity: spec.capacity,
        status: "available",
      });

      try {
        const beds = Array.from({ length: spec.capacity }, (_, index) => ({
          hostelId: hostel._id,
          roomId: room._id,
          label: `Bed ${index + 1}`,
          status: "available",
        }));

        await Bed.insertMany(beds);
        created += 1;
        bedsCreated += beds.length;

        console.log(
          `CREATED  Floor ${spec.floor} / Room ${spec.name} -> ${roomType(spec.capacity)} -> ${beds.length} beds`
        );
      } catch (bedError) {
        await Bed.deleteMany({ hostelId: hostel._id, roomId: room._id }).catch(() => {});
        await Room.deleteOne({ _id: room._id, hostelId: hostel._id }).catch(() => {});
        throw bedError;
      }
    }

    console.log("");
    console.log("========================================");
    console.log(" ROOM SEED COMPLETE");
    console.log("========================================");
    console.log(`Created        : ${created}`);
    console.log(`Beds created   : ${bedsCreated}`);
    console.log("Rooms in plan  : 7");
    console.log("Total capacity : 18");
    console.log("Expected beds  : 18");
    console.log("");
    console.log("Ground : Room 1 (2), Room 2 (2), Room 3 (1)");
    console.log("Floor 1: Room 1 (3), Room 2 (3), Room 3 (2)");
    console.log("Floor 2: Room 1 (5)");
    console.log("========================================");
  } catch (error) {
    console.error("Room seed failed:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

seedRooms();
