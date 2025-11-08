// src/server.js
import express from 'express';
import dotenv from 'dotenv';

import ingestRoutes from './routes/ingestRoutes.js';
import askRoutes from './routes/askRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware to parse JSON
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'planrag-backend' });
});

// Routes
app.use('/ingest', ingestRoutes);
app.use('/ask', askRoutes);
try{
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
}catch(e){
    console.log(e)
}

