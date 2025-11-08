// src/routes/ingestRoutes.js
import express from "express";
import { ingestDocuments } from "../controllers/ingestController.js";

const router = express.Router();

router.post("/", ingestDocuments);

export default router;
