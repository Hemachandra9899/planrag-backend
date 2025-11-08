import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import registerRoutes from "./routes/registerRoutes.js";
import ingestRoutes from "./routes/ingestRoutes.js";
import askRoutes from "./routes/askRoutes.js";
import { initPinecone } from "./utils/pineconeClient.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS middleware – this is enough
app.use(
    cors({
      origin: ["http://localhost:5174", "http://localhost:5175"],
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "x-api-key"],
    })
  );

// JSON body parsing
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "planrag-backend" });
});

// Routes


// ...
app.use("/register", registerRoutes);
app.use("/ingest", ingestRoutes);
app.use("/ask", askRoutes);

// Start server
const startServer = async () => {
  try {
    await initPinecone();
    app.listen(PORT, () => {
      console.log(`🚀 PlanRAG backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
