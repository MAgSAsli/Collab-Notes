import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import authRoutes from "./routes/auth";
import documentRoutes from "./routes/documents";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true },
});

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);

// track active users per document: { documentId: { socketId: { userId, name } } }
const activeUsers: Record<string, Record<string, { userId: string; name: string }>> = {};

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Unauthorized"));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; name?: string };
    socket.data.userId = decoded.userId;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  socket.on("join-document", ({ documentId, userName }: { documentId: string; userName: string }) => {
    socket.join(documentId);
    socket.data.documentId = documentId;
    socket.data.userName = userName;

    if (!activeUsers[documentId]) activeUsers[documentId] = {};
    activeUsers[documentId][socket.id] = { userId: socket.data.userId, name: userName };

    io.to(documentId).emit("active-users", Object.values(activeUsers[documentId]));
  });

  socket.on("document-change", ({ documentId, content }: { documentId: string; content: string }) => {
    socket.to(documentId).emit("document-update", { content });
  });

  socket.on("title-change", ({ documentId, title }: { documentId: string; title: string }) => {
    socket.to(documentId).emit("title-update", { title });
  });

  socket.on("disconnect", () => {
    const { documentId } = socket.data;
    if (documentId && activeUsers[documentId]) {
      delete activeUsers[documentId][socket.id];
      if (Object.keys(activeUsers[documentId]).length === 0) {
        delete activeUsers[documentId];
      } else {
        io.to(documentId).emit("active-users", Object.values(activeUsers[documentId]));
      }
    }
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
