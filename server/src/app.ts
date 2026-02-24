import express from 'express';
import { authRouter } from './modules/auth/auth.routes';
import { errorMiddleware } from './middleware/error.middleware';

export const app = express();

app.use(express.json());
app.use('/api/auth', authRouter);
app.use(errorMiddleware);