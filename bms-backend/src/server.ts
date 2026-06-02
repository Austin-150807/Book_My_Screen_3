import app from "./app";
import { config } from "./config/config";
import connectDB from "./config/db";

import { autoSeedShows } from "./utils/autoSeedShows";

const startServer = async () => {
  const port = config.port;

  // ✅ CONNECT DB
  await connectDB();

  // ✅ AUTO GENERATE SHOWS
  await autoSeedShows();

  app.listen(port, () => {
    console.log(`🚀 Listening on port: ${port}`);
  });
};

startServer();
