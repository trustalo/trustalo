import mongoose from "mongoose";

const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017/trustalo";

mongoose.connection.on("connected", () => {
  console.log("[mongoose] Connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("[mongoose] Connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("[mongoose] Disconnected from MongoDB");
});

export async function connectMongo() {
  await mongoose.connect(MONGODB_URL);
}

export async function disconnectMongo() {
  await mongoose.disconnect();
}

export { mongoose };
