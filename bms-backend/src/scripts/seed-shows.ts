import mongoose from "mongoose";
import dayjs from "dayjs";

import { MovieModel } from "../modules/movie/movie.model";
import { TheaterModel } from "../modules/theater/theater.model";
import { ShowModel } from "../modules/show/show.model";

import { config } from "../config/config";
import { generateSeatLayout } from "../utils";

// 🎟️ PRICE MAP
const generatePriceMap = () =>
  new Map([
    ["PREMIUM", 510],
    ["EXECUTIVE", 290],
    ["NORMAL", 270],
  ]);

// 🎬 AVAILABLE FORMATS
const formats = ["2D", "3D", "IMAX", "PVR PXL"];

// ⏰ SHOW TIME SLOTS
const fixedTimeSlots = [
  { start: "09:00 AM", end: "11:30 AM" },
  { start: "12:30 PM", end: "03:00 PM" },
  { start: "04:00 PM", end: "06:30 PM" },
  { start: "07:30 PM", end: "10:00 PM" },
  { start: "10:30 PM", end: "01:00 AM" },
];

// 🕒 CONVERT TIME
const toDateWithTime = (baseDate: Date, timeStr: string) => {
  return dayjs(baseDate)
    .hour(dayjs(timeStr, ["hh:mm A"]).hour())
    .minute(dayjs(timeStr, ["hh:mm A"]).minute())
    .second(0)
    .toDate();
};

// 🎬 SEED SHOWS
export const seedShow = async () => {
  try {
    // ✅ GET ALL MOVIES
    const movies = await MovieModel.find();

    // ✅ GET ALL THEATRES
    const theatres = await TheaterModel.find({
      state: "Karnataka",
    });

    console.log("🎬 Movies found:", movies.length);
    console.log("🏢 Theatres found:", theatres.length);

    if (!movies.length || !theatres.length) {
      console.log("❌ Movies or theatres missing");
      return;
    }

    // ✅ DELETE OLD SHOWS
    await ShowModel.deleteMany({});
    console.log("🧹 Old shows deleted");

    const today = dayjs().startOf("day");

    for (const movie of movies) {
      for (const theatre of theatres) {
        for (let d = 0; d < 6; d++) {
          const showDate = today.add(d, "day");

          const formattedDate = showDate.format("DD-MM-YYYY");

          // 🎲 RANDOM NUMBER OF SHOWS
          const numShows = Math.floor(Math.random() * 3) + 2;

          const selectedSlots = fixedTimeSlots.slice(0, numShows);

          for (const slot of selectedSlots) {
            const startTime = toDateWithTime(showDate.toDate(), slot.start);

            const endTime = toDateWithTime(showDate.toDate(), slot.end);

            const newShow = new ShowModel({
              movie: movie._id,
              theater: theatre._id,
              location: theatre.state,

              format: formats[Math.floor(Math.random() * formats.length)],

              audioType: "Dolby 7.1",

              startTime: slot.start,

              date: formattedDate,

              priceMap: generatePriceMap(),

              seatLayout: generateSeatLayout(),
            });

            await newShow.save();

            console.log(
              `🎬 ${movie.title} | ${theatre.name} | ${formattedDate} | ${slot.start}`,
            );
          }
        }
      }
    }

    console.log("✅ Automatic show seeding completed successfully");
  } catch (error) {
    console.log("❌ SEED ERROR:", error);
  }
};

// 🚀 CONNECT DB & RUN SEED
mongoose
  .connect(config.databaseUrl as string)
  .then(async () => {
    console.log("✅ Database connected");

    await seedShow();

    await mongoose.disconnect();

    console.log("🔌 Database disconnected");
  })
  .catch((err) => console.log(err));
