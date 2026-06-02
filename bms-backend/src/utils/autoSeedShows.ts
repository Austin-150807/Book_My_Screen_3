import dayjs from "dayjs";

import { MovieModel } from "../modules/movie/movie.model";
import { TheaterModel } from "../modules/theater/theater.model";
import { ShowModel } from "../modules/show/show.model";

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

// 🎞️ REALISTIC TIME SLOTS
const fixedTimeSlots = [
  { start: "09:00 AM", end: "11:30 AM" },
  { start: "12:30 PM", end: "03:00 PM" },
  { start: "04:00 PM", end: "06:30 PM" },
  { start: "07:30 PM", end: "10:00 PM" },
  { start: "10:30 PM", end: "01:00 AM" },
];

// 🎲 SHUFFLE ARRAY
const shuffleArray = (array: any[]) => {
  return [...array].sort(() => Math.random() - 0.5);
};

// 🚀 MAIN FUNCTION
export const autoSeedShows = async () => {
  try {
    console.log("🎬 Auto generating shows...");

    const today = dayjs().startOf("day");

    // ✅ REMOVE OLD SHOWS
    const allShows = await ShowModel.find();

    for (const show of allShows) {
      const showDate = dayjs(show.date, "DD-MM-YYYY");

      if (showDate.isBefore(today, "day")) {
        await ShowModel.findByIdAndDelete(show._id);
      }
    }

    console.log("🧹 Old shows removed");

    // ✅ GET ALL MOVIES
    const movies = await MovieModel.find();

    // ✅ GET ALL THEATRES
    const theatres = await TheaterModel.find({
      state: "Karnataka",
    });

    if (!movies.length || !theatres.length) {
      console.log("❌ Movies or theatres missing");
      return;
    }

    // ✅ NEXT 7 DAYS
    for (let d = 0; d < 7; d++) {
      const showDate = today.add(d, "day");

      const formattedDate = showDate.format("DD-MM-YYYY");

      for (const movie of movies) {
        for (const theatre of theatres) {
          // ✅ IMPORTANT FIX
          // If this movie already has ANY shows
          // for this theatre + date → SKIP
          const existingShowsForDay = await ShowModel.findOne({
            movie: movie._id,
            theater: theatre._id,
            date: formattedDate,
          });

          if (existingShowsForDay) {
            continue;
          }

          // 🎲 RANDOM 2–4 SHOWS
          const numShows = Math.floor(Math.random() * 3) + 2;

          // 🎲 RANDOM SLOTS
          const shuffledSlots = shuffleArray(fixedTimeSlots);

          const selectedSlots = shuffledSlots.slice(0, numShows);

          for (const slot of selectedSlots) {
            // 🎲 RANDOM FORMAT
            const selectedFormat =
              formats[Math.floor(Math.random() * formats.length)];

            // ✅ CREATE SHOW
            await ShowModel.create({
              movie: movie._id,

              theater: theatre._id,

              location: theatre.state,

              format: selectedFormat,

              audioType: "Dolby 7.1",

              startTime: slot.start,

              date: formattedDate,

              priceMap: generatePriceMap(),

              seatLayout: generateSeatLayout(),
            });

            console.log(
              `🎬 Show created for ${movie.title} at ${theatre.name} on ${formattedDate} (${slot.start})`,
            );
          }
        }
      }
    }

    console.log("✅ Auto show generation completed");
  } catch (error) {
    console.log("❌ AUTO SEED ERROR:", error);
  }
};
