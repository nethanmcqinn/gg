import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectToDatabase } from './config/db.js';
import { mouseRouter } from './routes/mouse.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { uploadRouter } from './routes/upload.routes.js';
import { userRouter } from './routes/user.routes.js';
import { reviewRouter } from './routes/review.routes.js';

const app = express();

const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/mice', mouseRouter);
app.use('/api/auth', authRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/users', userRouter);
app.use('/api/reviews', reviewRouter);

const start = async () => {
  try {
    await connectToDatabase();
    app.listen(PORT, () => {
      console.log(`GGClicks API listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
};

start();


