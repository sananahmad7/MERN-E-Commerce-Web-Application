import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.route.js";
import { connectDB } from "./lib/db.js";
const app = express();
dotenv.config();

const PORT = process.env.PORT || 5000;

app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log("Server is running on port: ", PORT);
  connectDB();
});

//
//NXgo9D5Y2528jXxn
