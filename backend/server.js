import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import fpRoutes from './routes/fingerprint.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('🟢 MongoDB connected'))
  .catch(err => console.error('MongoDB connection error', err));

app.use('/api/auth', authRoutes);
app.use('/api/fingerprint', fpRoutes);

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));