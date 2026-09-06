import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import colors from "colors";
import connectDB from "./config/dbConfig.js";

import authRoutes from "./routes/authRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import creditRoutes from "./routes/creditRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const PORT = process.env.PORT || 5511;

const app = express();
const server = http.createServer(app);

// CORS Configuration
const clientOrigin = process.env.CLIENT_URL || "http://localhost:5173";
const corsOptions = {
  origin: clientOrigin.includes(",")
    ? clientOrigin.split(",").map((s) => s.trim())
    : clientOrigin,
  credentials: true,
};

// Initialize Socket.io
const io = new Server(server, {
  cors: corsOptions,
});

// SGS DB Connection
connectDB();

// Middlewares
app.use(cors(corsOptions));
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Attach Socket.io instance to request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/credits", creditRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome To SGS AI Interview Practice API 1.0",
    author: "SGS",
    status: "Active",
  });
});

// Real-time Socket.io handlers
io.on("connection", (socket) => {
  console.log(`Socket Connected: ${socket.id}`.cyan);

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room: ${roomId}`.gray);
  });

  socket.on("leave_room", (roomId) => {
    socket.leave(roomId);
    console.log(`Socket ${socket.id} left room: ${roomId}`.gray);
  });

  socket.on("disconnect", () => {
    console.log(`Socket Disconnected: ${socket.id}`.gray);
  });
});

server.listen(PORT, () => {
  console.log(`SGS Server & Socket.io Running At PORT : ${PORT}`.bgBlue.white);
});
